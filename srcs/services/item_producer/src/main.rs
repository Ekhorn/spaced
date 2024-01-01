use std::{sync::Arc, net::ToSocketAddrs};

use amqprs::{
  callbacks::{DefaultChannelCallback, DefaultConnectionCallback},
  connection::{Connection, OpenConnectionArguments},
};
use anyhow::Result;
use axum::{Router, Server};
use clap::Parser;
use socketioxide::{
  extract::{SocketRef, TryData},
  SocketIo,
};
use sqlx::PgPool;
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, services::ServeDir};
use tracing::{error, info};
use tracing_subscriber::{filter::LevelFilter, EnvFilter};

mod clients;
mod consumer;
mod handlers;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
  #[arg(long, env, default_value_t = String::from("localhost"))]
  host: String,
  #[arg(long, env, default_value_t = 8080)]
  port: u16,

  #[arg(long, default_value_t = String::from("localhost"))]
  amqp_host: String,
  #[arg(long, default_value_t = 5672)]
  amqp_port: u16,
  #[arg(long, default_value_t = String::from("user"))]
  amqp_username: String,
  #[arg(long, default_value_t = String::from("bitnami"))]
  amqp_password: String,

  #[arg(long, default_value_t = String::from("postgres://admin:password@localhost:5432/spaced"))]
  database_host: String,
}

#[tokio::main]
async fn main() -> Result<()> {
  init_logging();

  let args = Args::parse();

  let db_connection = PgPool::connect(&args.database_host).await?;
  let connection = Connection::open(&OpenConnectionArguments::new(
    args.amqp_host.as_str(),
    args.amqp_port,
    args.amqp_username.as_str(),
    args.amqp_password.as_str(),
  ))
  .await?;
  connection
    .register_callback(DefaultConnectionCallback)
    .await?;
  let channel = Arc::new(connection.open_channel(None).await?);
  channel.register_callback(DefaultChannelCallback).await?;

  let (io_layer, io) = SocketIo::new_layer();
  tokio::spawn(consumer::background_task(io.clone(), channel.clone()));
  io.ns(
    "/",
    |socket: SocketRef, TryData(auth): TryData<clients::AuthData>| {
      if let Err(e) = clients::user_connect(&socket, auth) {
        error!("Failed to connect: {:?}", e);
        socket.disconnect().ok();
        return;
      }
      let users = clients::get_users().read().unwrap();
      info!("Users: {:?}", users);

      socket.extensions.insert(db_connection);
      socket.extensions.insert(channel);
      // Setup handlers
      socket.on("item:create", handlers::create);
      socket.on("item:get_nearby", handlers::get_nearby);
      socket.on("item:update_outer", handlers::update_outer);
      socket.on("item:update_inner", handlers::update_inner);
      socket.on_disconnect(|socket, reason| async move {
        info!("Socket.IO disconnected: {} {}", socket.id, reason);
        let mut users = clients::get_users().write().unwrap();
        users.remove(&socket.id.to_string());
      });
    },
  );

  let app = Router::new()
    .nest_service("/", ServeDir::new("dist"))
    .layer(
      ServiceBuilder::new()
        .layer(CorsLayer::permissive()) // Enable CORS policy
        .layer(io_layer),
    );

  info!(
    "Server starting on {}://{}:{}",
    "http", args.host, args.port
  );
  let addr = format!("{}:{}", args.host, args.port)
    .to_socket_addrs()?
    .next()
    .expect("No socket address found");
  Server::bind(&addr).serve(app.into_make_service()).await?;

  Ok(())
}

fn init_logging() {
  let env_filter = EnvFilter::builder()
    .with_default_directive(LevelFilter::INFO.into())
    .from_env_lossy();

  tracing_subscriber::fmt()
    .with_target(true)
    .with_level(true)
    .with_env_filter(env_filter)
    .init();
}
