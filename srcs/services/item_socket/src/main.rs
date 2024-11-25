use std::sync::Arc;

use axum::Router;
use clap::Parser;
use dashmap::DashMap;
use socketioxide::{
  extract::{SocketRef, State},
  SocketIo,
};
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tracing::info;
use yrs::sync::Awareness;

mod document;
mod y;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
  #[arg(long, env, default_value_t = String::from("localhost"))]
  host: String,
  #[arg(long, env, default_value_t = 8080)]
  port: u16,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  utils::init_logging();

  let args = Args::parse();
  let address = format!("{}:{}", args.host, args.port);

  info!("Server starting on http://{}", address);
  let listener = TcpListener::bind(address).await?;
  let app = app().await?;

  axum::serve(listener, app).await?;

  Ok(())
}

#[derive(Default, Clone)]
pub struct GlobalState {
  // TODO: consider diff string for perf
  // TODO: compare HashMap to DashMap
  documents: Arc<DashMap<String, Arc<Awareness>>>,
}

impl GlobalState {
  fn init_document(&self, namespace: String, room: String, socket: SocketIo) -> Arc<Awareness> {
    self.documents.get(&room).map_or_else(
      || {
        let awareness = document::create(namespace, socket);
        self.documents.insert(room, awareness.clone());
        awareness
      },
      |v| v.clone(),
    )
  }
}

async fn app() -> anyhow::Result<Router> {
  let (io_layer, io) = SocketIo::builder()
    .with_state(GlobalState::default())
    .build_layer();

  let io_clone = io.clone();

  io.dyn_ns(
    "/yjs|{room}",
    |socket: SocketRef, state: State<GlobalState>| async move {
      let namespace = socket.ns();
      let room = namespace.replace("/yjs|", "");

      info!("Session ID {} connected to {}", socket.id, &namespace);
      let awareness = state.init_document(namespace.to_string(), room, io_clone);

      y::init_sync_listeners(&socket);
      y::init_awareness_listeners(&socket);
      // this.initSocketListeners(socket, doc)
      y::start_synchronization(socket, awareness).await;
    },
  )
  .unwrap();

  Ok(Router::new().layer(ServiceBuilder::new().layer(io_layer)))
}
