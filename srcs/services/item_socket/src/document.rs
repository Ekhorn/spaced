use std::sync::Arc;

use rmpv::Value;
use socketioxide::SocketIo;
use tracing::info;
use yrs::{sync::Awareness, updates::encoder::Encode};

pub fn create(namespace: String, socket: SocketIo) -> Arc<Awareness> {
  let nsp = namespace.clone();
  let socket_clone = socket.clone();

  let awareness = Arc::new(Awareness::default());
  info!("{} created", awareness.doc().guid());

  awareness
    .doc()
    // TODO: figure out why _with is needed for subscriptions to work
    .observe_after_transaction_with("update", move |tx| {
      // TODO: figure out non-async closures with y-rs
      // or wait for async closures to become stable https://rust-lang.github.io/rfcs/3668-async-closures.html
      let future = socket_clone
        .of(&nsp)
        .unwrap()
        .emit("sync-update", &Value::from(tx.encode_update_v1()));
      tokio::spawn(async { future.await.unwrap() });
    })
    .unwrap();

  awareness.on_update_with("update", move |awareness, _, _| {
    let data = awareness.update().unwrap().encode_v1();
    let future = socket
      .of(&namespace)
      .unwrap()
      .emit("awareness-update", &Value::from(data));
    tokio::spawn(async { future.await.unwrap() });
  });

  awareness
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
