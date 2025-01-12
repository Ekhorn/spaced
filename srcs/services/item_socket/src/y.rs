use rmpv::Value;
use std::{sync::Arc, time::Instant};
use tracing;
use yrs::{
  sync::{Awareness, AwarenessUpdate},
  updates::{decoder::Decode, encoder::Encode},
  ReadTxn, StateVector, Transact, Update,
};

use socketioxide::{
  extract::{AckSender, Data, SocketRef, State},
  socket::DisconnectReason,
};

use crate::{MetricsState, SocketState};

#[tracing::instrument(skip_all)]
pub fn init_sync_listeners(socket: &SocketRef) {
  socket.on(
    "sync-step-1",
    |socket: SocketRef,
     value: Data<Value>,
     sync_step_2: AckSender,
     State(SocketState { documents }),
     metrics: State<MetricsState>| async move {
      let metrics = metrics.lock().await;
      metrics.inc_messages_received("/yjs|all", "sync-step-1");
      let start_time = Instant::now();

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

      let latency = start_time.elapsed().as_secs_f64();
      metrics.observe_event_latency("/yjs|all", "sync-update", latency);

      sync_step_2.send(&data).unwrap();
      metrics.inc_messages_sent("/yjs|all", "sync-step-1");
    },
  );

  socket.on(
    "sync-update",
    |socket: SocketRef,
     data: Data<Value>,
     State(SocketState { documents }),
     metrics: State<MetricsState>| async move {
      let metrics = metrics.lock().await;
      metrics.inc_messages_received("/yjs|all", "sync-update");
      let start_time = Instant::now();

      let binary = data.as_slice().unwrap();
      let update = Update::decode_v1(binary).unwrap();

      let doc_ns = socket.ns().replace("/yjs|", "");
      let awareness = documents.get(&doc_ns).unwrap();
      awareness.doc().transact_mut().apply_update(update).unwrap();

      let latency = start_time.elapsed().as_secs_f64();
      metrics.observe_event_latency("/yjs|all", "sync-update", latency);
    },
  );
}

#[tracing::instrument(skip_all)]
pub fn init_awareness_listeners(socket: &SocketRef) {
  socket.on(
    "awareness-update",
    |socket: SocketRef,
     data: Data<Value>,
     State(SocketState { documents }),
     metrics: State<MetricsState>| async move {
      let metrics = metrics.lock().await;
      metrics.inc_messages_received("/yjs|all", "awareness-update");
      let start_time = Instant::now();

      let binary = data.as_slice().unwrap();
      let update = AwarenessUpdate::decode_v1(binary).unwrap();

      let doc_ns = socket.ns().replace("/yjs|", "");
      let awareness = documents.get(&doc_ns).unwrap();
      awareness.apply_update(update).unwrap();

      let latency = start_time.elapsed().as_secs_f64();
      metrics.observe_event_latency("/yjs|all", "awareness-update", latency);
    },
  );
}

pub async fn init_socket_listeners(socket: &SocketRef) {
  socket.on_disconnect(
    move |socket: SocketRef,
          State(SocketState { documents }),
          metrics: State<MetricsState>,
          reason: DisconnectReason| async move {
      let metrics = metrics.lock().await;
      metrics.dec_active_connections("/yjs|all");
      metrics.inc_disconnects("/yjs|all", format!("{reason}"));

      let doc_ns = socket.ns().replace("/yjs|", "");
      if socket.broadcast().sockets().unwrap().len() == 0 {
        documents.remove(&doc_ns);
        metrics.dec_open_documents();
      }
    },
  )
}

#[tracing::instrument(skip_all)]
pub async fn start_synchronization(
  socket: SocketRef,
  awareness: Arc<Awareness>,
  // metrics: &Metrics,
) {
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
