use std::sync::Arc;

use axum::{routing::get, Router};
use clap::Parser;
use dashmap::DashMap;
use metrics::{metrics_handler, Metrics};
use prometheus_client::registry::Registry;
use socketioxide::{
  extract::{SocketRef, State},
  SocketIo,
};
use tokio::{net::TcpListener, sync::Mutex};
use tower::ServiceBuilder;
use tracing::{info, level_filters::LevelFilter};
use utils::shutdown_task;
use yrs::sync::Awareness;

mod document;
mod metrics;
mod y;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
  #[arg(long, env, default_value_t = String::from("localhost"))]
  host: String,
  #[arg(long, env, default_value_t = 8081)]
  port: u16,
  #[arg(long, env, default_value_t = LevelFilter::INFO)]
  log_level: LevelFilter,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  let args = Args::parse();

  utils::init_logging(args.log_level);

  let address = format!("{}:{}", args.host, args.port);

  info!("Server starting on http://{}", address);
  info!("Server metrics available at http://{}/metrics", address);
  let listener = TcpListener::bind(address).await?;
  let app = app().await?;

  let server = axum::serve(listener, app);

  tokio::select! {
    _ = shutdown_task() => {
      println!(", shutting down...");
    }
    _ = server => {},
  }

  Ok(())
}

#[derive(Debug)]
pub struct AppState {
  pub registry: Registry,
}

#[derive(Clone, Default)]
pub struct SocketState {
  // TODO: consider diff string for perf
  // TODO: compare HashMap to DashMap
  documents: Arc<DashMap<String, Arc<Awareness>>>,
}

impl SocketState {
  fn init_document(&self, namespace: String, doc_ns: String, socket: SocketIo) -> Arc<Awareness> {
    self.documents.get(&doc_ns).map_or_else(
      || {
        let awareness = document::create(namespace, socket);
        self.documents.insert(doc_ns, awareness.clone());
        awareness
      },
      |v| v.clone(),
    )
  }
}

pub type MetricsState = Arc<Mutex<Metrics>>;

async fn app() -> anyhow::Result<Router> {
  let mut registry = <Registry>::with_prefix("item_socket");
  let metrics = Metrics::new(&mut registry);
  let metrics = Arc::new(Mutex::new(metrics));

  let (io_layer, io) = SocketIo::builder()
    .with_state(SocketState::default())
    .with_state(metrics.clone())
    .build_layer();

  let io_clone = io.clone();

  io.dyn_ns(
    "/yjs|{doc_ns}",
    |socket: SocketRef, state: State<SocketState>, metrics: State<MetricsState>| async move {
      let namespace = socket.ns();
      let doc_ns = namespace.replace("/yjs|", "");

      let metrics = metrics.lock().await;
      metrics.inc_active_connections("/yjs|all");
      metrics.inc_open_documents();

      info!("{} connected to {}", socket.id, doc_ns);
      let awareness = state.init_document(namespace.to_string(), doc_ns, io_clone);

      y::init_sync_listeners(&socket);
      y::init_awareness_listeners(&socket);
      // y::init_socket_listeners(&socket).await;
      y::start_synchronization(socket, awareness).await;
    },
  )
  .unwrap();

  let state = Arc::new(Mutex::new(AppState { registry }));

  let router = Router::new()
    .layer(ServiceBuilder::new().layer(io_layer))
    .route("/metrics", get(metrics_handler))
    .with_state(state)
    .with_state(metrics);

  Ok(router)
}
