use std::time::{SystemTime, UNIX_EPOCH};

use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
  Json,
};
use jsonwebtoken::{encode, DecodingKey, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::handlers::KEYS;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
  pub sub: String,
  pub exp: usize,
}

// #[async_trait]
// impl<S> FromRequestParts<S> for Claims
// where
//   S: Send + Sync,
// {
//   type Rejection = AuthError;

//   async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
//     let TypedHeader(Authorization(bearer)) = parts
//       .extract::<TypedHeader<Authorization<Bearer>>>()
//       .await
//       .map_err(|_| AuthError::InvalidToken)?;

//     let token_data = decode::<Claims>(bearer.token(), &KEYS.decoding, &Validation::default())
//       .map_err(|_| AuthError::InvalidToken)?;

//     Ok(token_data.claims)
//   }
// }

#[derive(Debug, PartialEq)]
pub enum AuthError {
  WrongCredentials,
  // MissingCredentials,
  TokenCreation,
  InvalidToken,
}

pub struct Keys {
  pub encoding: EncodingKey,
  pub decoding: DecodingKey,
}

impl Keys {
  pub fn new(secret: &[u8]) -> Self {
    Self {
      encoding: EncodingKey::from_secret(secret),
      decoding: DecodingKey::from_secret(secret),
    }
  }
}

impl IntoResponse for AuthError {
  fn into_response(self) -> Response {
    let (status, error_message) = match self {
      AuthError::WrongCredentials => (StatusCode::UNAUTHORIZED, "Wrong credentials"),
      // AuthError::MissingCredentials => (StatusCode::BAD_REQUEST, "Missing credentials"),
      AuthError::TokenCreation => (StatusCode::INTERNAL_SERVER_ERROR, "Token creation error"),
      AuthError::InvalidToken => (StatusCode::BAD_REQUEST, "Invalid token"),
    };
    let body = Json(json!({
      "error": error_message,
    }));
    (status, body).into_response()
  }
}

#[derive(Debug, Serialize)]
pub struct AuthBody {
  pub access_token: String,
  pub expires_in: usize,
  pub refresh_token: String,
  pub token_type: String,
}

impl AuthBody {
  fn new(access_token: String, refresh_token: String) -> Self {
    Self {
      access_token,
      expires_in: 3600,
      refresh_token,
      token_type: "Bearer".to_string(),
    }
  }
}

pub fn create_jwt_response(sub: String) -> Result<AuthBody, AuthError> {
  let expires = 3600;
  let iat = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap()
    .as_secs() as usize;

  let access_token = encode(
    &Header::default(),
    &Claims {
      sub: sub.to_string(),
      exp: iat + expires,
    },
    &KEYS.encoding,
  )
  .map_err(|_| AuthError::TokenCreation)?;

  Ok(AuthBody::new(
    access_token,
    encode(
      &Header::default(),
      &Claims {
        sub,
        // Refresh token expires in a month.
        exp: (iat + 60 * 60 * 24 * 30),
      },
      &KEYS.encoding,
    )
    .map_err(|_| AuthError::TokenCreation)?,
  ))
}