use argon2::{
  password_hash::{rand_core::OsRng, SaltString},
  Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};
use axum::{extract::State, http::StatusCode};
use dotenvy::dotenv;
use jsonwebtoken::{decode, Algorithm, Validation};
use once_cell::sync::Lazy;
use serde::Deserialize;
use sqlx::PgPool;
use utils::{ApiError, Json};

use crate::auth::{create_jwt_response, AuthBody, Claims, Keys};

#[allow(dead_code)]
#[derive(sqlx::FromRow, Deserialize)]
struct User {
  id: i32,
  email: String,
  username: String,
  password: Vec<u8>,
}

pub static KEYS: Lazy<Keys> = Lazy::new(|| {
  dotenv().ok();
  let secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");
  Keys::new(secret.as_bytes())
});

#[derive(Deserialize)]
pub struct RegisterUserPayload {
  email: String,
  username: String,
  password: String,
}

#[derive(Deserialize)]
pub struct LoginUserPayload {
  email: String,
  password: String,
}

#[derive(Deserialize)]
pub struct AuthPayload {
  pub refresh_token: String,
}

pub async fn register_email(
  State(pool): State<PgPool>,
  Json(payload): Json<RegisterUserPayload>,
) -> Result<Json<AuthBody>, ApiError> {
  let email = payload.email.to_lowercase();
  let username = payload.username;
  let argon2 = Argon2::default();
  let salt = SaltString::generate(&mut OsRng);
  let password_hash = argon2
    .hash_password(payload.password.as_bytes(), &salt)
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, None))?
    .to_string()
    .into_bytes();

  let mut transaction = pool
    .begin()
    .await
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, None))?;

  let user: User = sqlx::query_as!(
    User,
    r#"INSERT INTO "user" (id, email, username, password) VALUES (DEFAULT, $1, $2, $3) RETURNING *"#,
    email,
    username,
    password_hash
  )
  .fetch_one(&mut *transaction)
  .await
  .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, None))?;

  transaction
    .commit()
    .await
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, None))?;

  // TODO: generate email verification code

  Ok(Json(create_jwt_response(user.id.to_string())?))
}

pub async fn email_login(
  State(pool): State<PgPool>,
  Json(payload): Json<LoginUserPayload>,
) -> Result<Json<AuthBody>, ApiError> {
  let user: User = sqlx::query_as!(
    User,
    r#"SELECT * FROM "user" WHERE email = $1;"#,
    payload.email,
  )
  .fetch_one(&pool)
  .await
  .map_err(|_| ApiError(StatusCode::NOT_FOUND, Some("User not found.".into())))?;

  let argon2 = Argon2::default();

  let password = std::str::from_utf8(&user.password)
    .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, None))?;

  argon2
    .verify_password(
      payload.password.as_bytes(),
      &PasswordHash::new(password)
        .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, None))?,
    )
    .map_err(|_| ApiError(StatusCode::UNAUTHORIZED, Some("Wrong credentials".into())))?;

  Ok(Json(create_jwt_response(user.id.to_string())?))
}

pub async fn refresh_token(Json(payload): Json<AuthPayload>) -> Result<Json<AuthBody>, ApiError> {
  let data = decode::<Claims>(
    &payload.refresh_token,
    &KEYS.decoding,
    &Validation::new(Algorithm::HS256),
  )
  .map_err(|_| ApiError(StatusCode::BAD_REQUEST, Some("Invalid token".into())))?;

  Ok(Json(create_jwt_response(data.claims.sub)?))
}
