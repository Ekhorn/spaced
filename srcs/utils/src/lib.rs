#[cfg(feature = "axum")]
pub mod axum {
  use axum::{
    extract::rejection::JsonRejection,
    extract::FromRequest,
    http::StatusCode,
    response::{IntoResponse, Response},
  };
  use serde::Serialize;
  use serde_json::json;

  #[derive(FromRequest)]
  #[from_request(via(axum::Json), rejection(ApiError))]
  pub struct Json<T>(pub T);

  impl<T: Serialize> IntoResponse for Json<T> {
    fn into_response(self) -> Response {
      let Self(value) = self;
      axum::Json(value).into_response()
    }
  }

  #[derive(Debug)]
  pub struct ApiError(pub StatusCode, pub Option<String>);

  impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
      let payload = json!({
        "status": self.0.as_str(),
        "message": self.0.canonical_reason(),
        "error": self.1
      });

      (self.0, axum::Json(payload)).into_response()
    }
  }

  impl From<JsonRejection> for ApiError {
    fn from(rejection: JsonRejection) -> Self {
      Self(rejection.status(), Some(rejection.body_text()))
    }
  }
}

#[cfg(feature = "logging")]
use tracing::level_filters::LevelFilter;
#[cfg(feature = "logging")]
use tracing_subscriber::EnvFilter;

#[cfg(feature = "logging")]
pub fn init_logging() {
  let env_filter = EnvFilter::builder()
    .with_default_directive(LevelFilter::INFO.into())
    .from_env_lossy();

  tracing_subscriber::fmt()
    .with_target(true)
    .with_level(true)
    .with_env_filter(env_filter)
    .init();
}

use tokio::{
  signal::unix::{signal, SignalKind},
  task,
};

pub fn shutdown_task() -> tokio::task::JoinHandle<()> {
  task::spawn(async {
    let mut term_signal =
      signal(SignalKind::terminate()).expect("Failed to create SIGTERM listener");
    let mut int_signal = signal(SignalKind::interrupt()).expect("Failed to create SIGINT listener");

    tokio::select! {
      _ = term_signal.recv() => {
        print!("Received SIGTERM");
      }
      _ = int_signal.recv() => {
        print!("Received SIGINT (CTRL+C)");
      }
    }
  })
}
