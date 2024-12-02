use rmpv::Value;
use std::sync::Arc;
use tracing;
use yrs::{
  sync::{Awareness, AwarenessUpdate},
  updates::{decoder::Decode, encoder::Encode},
  ReadTxn, StateVector, Transact, Update,
};

use socketioxide::extract::{AckSender, Data, SocketRef, State};

use crate::GlobalState;

#[tracing::instrument(skip_all)]
pub fn init_sync_listeners(socket: &SocketRef) {
  socket.on(
    "sync-step-1",
    |socket: SocketRef,
     value: Data<Value>,
     sync_step_2: AckSender,
     State(GlobalState { documents })| {
      let binary = value.as_slice().unwrap();
      let state_vector = StateVector::decode_v1(binary).unwrap();

      let doc_ns = socket.ns().replace("/yjs|", "");
      let awareness = documents.get(&doc_ns).unwrap();
      let data = Value::from(
        awareness
          .doc()
          .transact_mut()
          .encode_state_as_update_v1(&state_vector),
      );
      sync_step_2.send(&data).unwrap();
    },
  );

  socket.on(
    "sync-update",
    |socket: SocketRef, data: Data<Value>, State(GlobalState { documents })| {
      let binary = data.as_slice().unwrap();
      let update = Update::decode_v1(binary).unwrap();

      let doc_ns = socket.ns().replace("/yjs|", "");
      let awareness = documents.get(&doc_ns).unwrap();
      awareness.doc().transact_mut().apply_update(update).unwrap();
    },
  );
}

#[tracing::instrument(skip_all)]
pub fn init_awareness_listeners(socket: &SocketRef) {
  socket.on(
    "awareness-update",
    |socket: SocketRef, data: Data<Value>, State(GlobalState { documents })| {
      let binary = data.as_slice().unwrap();
      let update = AwarenessUpdate::decode_v1(binary).unwrap();

      let doc_ns = socket.ns().replace("/yjs|", "");
      let awareness = documents.get(&doc_ns).unwrap();
      awareness.apply_update(update).unwrap();
    },
  );
}

// pub fn init_socket_listeners(socket: SocketRef, doc: Document) {
//   socket.on_disconnect(|| {
//     socket.
//     if ((await socket.nsp.allSockets()).size === 0) {
//       this.emit("all-document-connections-closed", [doc])
//       if (this.persistence != null) {
//         await this.persistence.writeState(doc.name, doc)
//         await doc.destroy()
//       }
//     }

//   })
// }

#[tracing::instrument(skip_all)]
pub async fn start_synchronization(socket: SocketRef, awareness: Arc<Awareness>) {
  let data = Value::from(awareness.doc().transact_mut().state_vector().encode_v1());

  match socket
    .emit_with_ack::<_, Value>("sync-step-1", &data)
    .unwrap()
    .await
  {
    Ok(ack) => {
      let binary = ack.as_slice().unwrap();
      let update = Update::decode_v1(binary).unwrap();
      awareness.doc().transact_mut().apply_update(update).unwrap();
    }
    Err(err) => println!("Ack error {:?}", err),
  }

  let data = awareness.update().unwrap().encode_v1();
  socket.emit("awareness-update", &Value::from(data)).unwrap();
}
