use std::sync::Arc;

use amqprs::{
  callbacks::{DefaultChannelCallback, DefaultConnectionCallback},
  channel::Channel,
  connection::{Connection, OpenConnectionArguments},
};
use axum::Router;
use clap::Parser;
use socketioxide::{
  extract::{SocketRef, TryData},
  socket::DisconnectReason,
  SocketIo,
};
use sqlx::PgPool;
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tracing::{error, info};

mod clients;
mod consumer;
mod handlers;

pub struct GlobalState {
  pub db_pool: PgPool,
  pub shared_amqp_channel: Arc<Channel>,
}

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
  #[arg(long, env, default_value_t = String::from("localhost"))]
  host: String,
  #[arg(long, env, default_value_t = 8080)]
  port: u16,

  #[arg(long, env, default_value_t = String::from("localhost"))]
  amqp_host: String,
  #[arg(long, env, default_value_t = 5672)]
  amqp_port: u16,
  #[arg(long, env, default_value_t = String::from("admin"))]
  amqp_username: String,
  #[arg(long, env, default_value_t = String::from("password"))]
  amqp_password: String,

  #[arg(long, env, default_value_t = String::from("postgres://admin:password@localhost:5432/spaced"))]
  database_host: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  utils::init_logging();

  let args = Args::parse();
  let db_pool = PgPool::connect(&args.database_host).await?;

  sqlx::migrate!("../migrations").run(&db_pool).await?;

  let amqp_connection = Connection::open(&OpenConnectionArguments::new(
    args.amqp_host.as_str(),
    args.amqp_port,
    args.amqp_username.as_str(),
    args.amqp_password.as_str(),
  ))
  .await?;
  amqp_connection
    .register_callback(DefaultConnectionCallback)
    .await?;
  let shared_amqp_channel = Arc::new(amqp_connection.open_channel(None).await?);
  shared_amqp_channel
    .register_callback(DefaultChannelCallback)
    .await?;

  let address = format!("{}:{}", args.host, args.port);
  info!("Server starting on http://{}", address);
  let listener = TcpListener::bind(address).await?;
  axum::serve(listener, app(db_pool, shared_amqp_channel).await?).await?;

  Ok(())
}

async fn app(db_pool: PgPool, shared_amqp_channel: Arc<Channel>) -> anyhow::Result<Router> {
  let (io_layer, io) = SocketIo::builder()
    .with_state(GlobalState {
      db_pool,
      shared_amqp_channel: shared_amqp_channel.clone(),
    })
    .build_layer();

  tokio::spawn(consumer::background_task(io.clone(), shared_amqp_channel));

  io.ns(
    "/",
    |socket: SocketRef, TryData(auth): TryData<clients::AuthData>| {
      if let Err(e) = clients::user_connect(&socket, auth) {
        error!("Failed to connect: {:?}", e);
        socket.disconnect().ok();
        return;
      }
      // Setup handlers
      socket.on("item:create", handlers::create);
      socket.on("item:get_nearby", handlers::get_nearby);
      socket.on("item:update_outer", handlers::update_outer);
      socket.on("item:update_inner", handlers::update_inner);
      socket.on_disconnect(|socket: SocketRef, reason: DisconnectReason| async move {
        info!("Socket.IO disconnected: {} {}", socket.id, reason);
        let mut users = clients::get_users().write().unwrap();
        users.remove(&socket.id.to_string());
      });
    },
  );

  Ok(Router::new().layer(ServiceBuilder::new().layer(io_layer)))
}

#[cfg(test)]
mod tests {
  use super::*;
  use futures_util::FutureExt;
  use rust_socketio::{asynchronous::ClientBuilder, Payload};
  use serde_json::json;
  use std::{
    future::IntoFuture,
    net::{Ipv4Addr, SocketAddr},
    time::Duration,
  };
  use tokio::sync::mpsc;

  #[sqlx::test(migrations = "../migrations")]
  async fn test_create_item(db_pool: PgPool) {
    let amqp_connection = Connection::open(&OpenConnectionArguments::new(
      "localhost",
      5672,
      "admin",
      "password",
    ))
    .await
    .unwrap();
    amqp_connection
      .register_callback(DefaultConnectionCallback)
      .await
      .unwrap();
    let shared_amqp_channel = Arc::new(amqp_connection.open_channel(None).await.unwrap());
    shared_amqp_channel
      .register_callback(DefaultChannelCallback)
      .await
      .unwrap();

    let listener = TcpListener::bind(SocketAddr::from((Ipv4Addr::UNSPECIFIED, 0)))
      .await
      .unwrap();
    let address = listener.local_addr().unwrap();
    tokio::spawn(
      axum::serve(listener, app(db_pool, shared_amqp_channel).await.unwrap()).into_future(),
    );

    let socket = ClientBuilder::new(format!("http://{}", address))
      .auth(json!({ "user": "123" }))
      .namespace("/")
      .connect()
      .await
      .unwrap();

    let (tx, mut rx) = mpsc::channel(2);

    socket
      .emit_with_ack(
        "item:create",
        json!({
          "id": 0, "x": 5, "y": 5, "w": 5, "h": 5, "name": "test", "schema": "test"
        }),
        Duration::from_secs(1),
        move |message: Payload, _| {
          let clone_tx = tx.clone();
          async move {
            clone_tx.send(message).await.unwrap();
          }
          .boxed()
        },
      )
      .await
      .unwrap();

    let message = rx.recv().await.unwrap();
    assert_eq!(
      message,
      json!([{
        "id": 1, "x": 5, "y": 5, "w": 5, "h": 5, "name": "test", "schema": "test"
      }])
      .into()
    );
  }
}
