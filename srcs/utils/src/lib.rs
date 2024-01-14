use axum::{
  extract::rejection::JsonRejection,
  extract::FromRequest,
  http::StatusCode,
  response::{IntoResponse, Response},
};
use serde::Serialize;
use serde_json::json;

use tracing::level_filters::LevelFilter;
use tracing_subscriber::EnvFilter;

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
