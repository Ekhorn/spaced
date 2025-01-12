use std::{hash::Hash, sync::Arc};

use axum::{
  body::Body,
  extract::State,
  http::{header::CONTENT_TYPE, StatusCode},
  response::{IntoResponse, Response},
};
use prometheus_client::{
  encoding::{text::encode, EncodeLabelSet},
  metrics::{counter::Counter, family::Family, gauge::Gauge, histogram::Histogram},
  registry::Registry,
};
use tokio::sync::Mutex;

use crate::AppState;

#[derive(Clone, Debug, Hash, PartialEq, Eq, EncodeLabelSet)]
struct NamespaceLabels {
  namespace: &'static str,
}

// #[derive(Clone, Debug, Hash, PartialEq, Eq, EncodeLabelValue)]
// enum EventStatus {
//   SUCCESS,
//   ERROR,
// }

#[derive(Clone, Debug, Hash, PartialEq, Eq, EncodeLabelSet)]
struct NamespaceEventStatusLabels {
  namespace: &'static str,
  event: &'static str,
  // status: EventStatus,
}

#[derive(Clone, Debug, Hash, PartialEq, Eq, EncodeLabelSet)]
struct NamespaceReasonLabels {
  namespace: &'static str,
  reason: String,
}

#[derive(Debug)]
pub struct Metrics {
  active_connections: Family<NamespaceLabels, Gauge>,
  open_documents: Family<NamespaceLabels, Gauge>,
  messages_sent: Family<NamespaceEventStatusLabels, Counter>,
  messages_received: Family<NamespaceEventStatusLabels, Counter>,
  disconnects: Family<NamespaceReasonLabels, Counter>,
  event_latency: Family<NamespaceEventStatusLabels, Histogram>,
}

impl Metrics {
  pub fn new(registry: &mut Registry) -> Self {
    let active_connections = Family::<NamespaceLabels, Gauge>::default();
    registry.register(
      "active_connections",
      "Number of active WebSocket connections",
      active_connections.clone(),
    );

    let open_documents = Family::<NamespaceLabels, Gauge>::default();
    registry.register(
      "open_documents",
      "Number of open documents",
      open_documents.clone(),
    );

    let messages_sent = Family::<NamespaceEventStatusLabels, Counter>::default();
    registry.register(
      "messages_sent",
      "Number of WebSocket messages sent",
      messages_sent.clone(),
    );

    let messages_received = Family::<NamespaceEventStatusLabels, Counter>::default();
    registry.register(
      "messages_received",
      "Number of WebSocket messages received",
      messages_received.clone(),
    );

    let disconnects = Family::<NamespaceReasonLabels, Counter>::default();
    registry.register(
      "disconnects",
      "Number of WebSocket disconnections",
      disconnects.clone(),
    );

    let event_latency =
      Family::<NamespaceEventStatusLabels, Histogram>::new_with_constructor(|| {
        Histogram::new(
          [
            0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0,
          ]
          .into_iter(),
        )
      });
    registry.register(
      "event_latency_seconds",
      "Latency of WebSocket events in seconds",
      event_latency.clone(),
    );

    Metrics {
      active_connections,
      open_documents,
      messages_sent,
      messages_received,
      disconnects,
      event_latency,
    }
  }

  pub fn inc_active_connections(&self, namespace: &'static str) {
    self
      .active_connections
      .get_or_create(&NamespaceLabels { namespace })
      .inc();
  }

  pub fn dec_active_connections(&self, namespace: &'static str) {
    self
      .active_connections
      .get_or_create(&NamespaceLabels { namespace })
      .dec();
  }

  pub fn inc_open_documents(&self) {
    self
      .open_documents
      .get_or_create(&NamespaceLabels { namespace: "all" })
      .inc();
  }

  pub fn dec_open_documents(&self) {
    self
      .open_documents
      .get_or_create(&NamespaceLabels { namespace: "all" })
      .dec();
  }

  pub fn inc_messages_received(
    &self,
    namespace: &'static str,
    event: &'static str,
    // status: EventStatus,
  ) {
    self
      .messages_received
      .get_or_create(&NamespaceEventStatusLabels {
        namespace,
        event,
        // status,
      })
      .inc();
  }

  pub fn inc_messages_sent(&self, namespace: &'static str, event: &'static str) {
    self
      .messages_sent
      .get_or_create(&NamespaceEventStatusLabels {
        namespace,
        event,
        // status: EventStatus,
      })
      .inc();
  }

  pub fn inc_disconnects(&self, namespace: &'static str, reason: String) {
    self
      .disconnects
      .get_or_create(&NamespaceReasonLabels { namespace, reason })
      .inc();
  }

  pub fn observe_event_latency(&self, namespace: &'static str, event: &'static str, v: f64) {
    self
      .event_latency
      .get_or_create(&NamespaceEventStatusLabels { namespace, event })
      .observe(v);
  }
}

pub async fn metrics_handler(State(state): State<Arc<Mutex<AppState>>>) -> impl IntoResponse {
  let state = state.lock().await;
  let mut buffer = String::new();
  encode(&mut buffer, &state.registry).unwrap();

  Response::builder()
    .status(StatusCode::OK)
    .header(
      CONTENT_TYPE,
      "application/openmetrics-text; version=1.0.0; charset=utf-8",
    )
    .body(Body::from(buffer))
    .unwrap()
}
