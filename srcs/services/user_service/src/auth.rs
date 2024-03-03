use std::time::{SystemTime, UNIX_EPOCH};

use axum::http::StatusCode;
use jsonwebtoken::{encode, DecodingKey, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use utils::axum::ApiError;

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

pub fn create_jwt_response(sub: String) -> Result<AuthBody, ApiError> {
  let expires = 3600;
  let iat = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, None))?
    .as_secs() as usize;

  let access_token = encode(
    &Header::default(),
    &Claims {
      sub: sub.to_string(),
      exp: iat + expires,
    },
    &KEYS.encoding,
  )
  .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, None))?;

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
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, None))?,
  ))
}

#[cfg(test)]
mod tests {
  use super::*;
  use jsonwebtoken::{decode, Validation};

  #[tokio::test]
  async fn test_create_jwt_response() {
    std::env::set_var("JWT_SECRET", "test");

    let sub = String::from("test_user");

    let result = create_jwt_response(sub.clone());

    assert!(result.is_ok());

    let auth_body = result.unwrap();

    let token_data = decode::<Claims>(
      &auth_body.access_token,
      &KEYS.decoding,
      &Validation::default(),
    )
    .expect("Failed to decode access token");

    assert_eq!(token_data.claims.sub, sub);
    assert!(token_data.claims.exp > 0);

    let token_data = decode::<Claims>(
      &auth_body.refresh_token,
      &KEYS.decoding,
      &Validation::default(),
    )
    .expect("Failed to decode refresh token");

    assert_eq!(token_data.claims.sub, sub);
    assert!(token_data.claims.exp > 0);
  }
}
