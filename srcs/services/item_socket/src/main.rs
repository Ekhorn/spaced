use std::sync::Arc;

use axum::Router;
use clap::Parser;
use dashmap::DashMap;
use rmpv::Value;
use socketioxide::{
  extract::{SocketRef, State},
  SocketIo,
};
use tokio::net::TcpListener;
use tower::ServiceBuilder;
use tracing::info;
use yrs::sync::Awareness;

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
  fn init_document(&self, namespace: String, socket: SocketIo) -> Arc<Awareness> {
    self.documents.get(&namespace).map_or_else(
      || {
        let v = Arc::new(Awareness::default());
        let nsp = namespace.clone();
        v.doc()
          .observe_after_transaction_with("update", move |txn| {
            info!("observe_after_transaction");
            socket
              .of(format!("/yjs|{}", nsp))
              .unwrap()
              .emit("sync-update", &Value::from(txn.encode_update_v1()))
              .unwrap();
          })
          .unwrap();

        v.on_update(move |_, _, _| {
          info!("awareness on_update");
        });
        v.on_change(move |_, _, _| {
          info!("awareness on_change");
        });

        self.documents.insert(namespace, v.clone());
        info!("document loaded");
        v
      },
      |v| v.clone(),
    )
  }
}

// fn init_document(name: String, namespace: Namespace, gc: bool) -> Doc {
//   const doc = this._documents.get(name) ?? (Doc::new().nam(name, namespace, {
//     onUpdate: (doc, update) => this.emit("document-update", [doc, update]),
//     onChangeAwareness: (doc, update) => this.emit("awareness-update", [doc, update]),
//     onDestroy: async (doc) => {
//       this._documents.delete(doc.name)
//       this.emit("document-destroy", [doc])
//     }
//   }))
//   doc.gc = gc
//   if (!this._documents.has(name)) {
//     if (this.persistence != null) await this.persistence.bindState(name, doc)
//     this._documents.set(name, doc)
//     this.emit("document-loaded", [doc])
//   }
//   return doc
// }

async fn app() -> anyhow::Result<Router> {
  let (io_layer, io) = SocketIo::builder()
    .with_state(GlobalState::default())
    .build_layer();

  let io_clone = io.clone();

  io.dyn_ns(
    "/yjs|{room}",
    |socket: SocketRef, state: State<GlobalState>| async move {
      info!("{}", socket.ns());
      let namespace = socket.ns().replace("/yjs|", "");
      let awareness = state.init_document(namespace, io_clone);

      y::init_sync_listeners(socket.clone());
      y::init_awareness_listeners(socket.clone());

      // this.initSocketListeners(socket, doc)

      y::start_synchronization(socket, awareness).await;
    },
  )
  .unwrap();

  Ok(Router::new().layer(ServiceBuilder::new().layer(io_layer)))
}
