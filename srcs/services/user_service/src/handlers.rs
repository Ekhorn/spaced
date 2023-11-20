use argon2::{
  password_hash::{rand_core::OsRng, SaltString},
  Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
};
use axum::{extract::State, Json};
use jsonwebtoken::{decode, Algorithm, Validation};
use once_cell::sync::Lazy;
use serde::Deserialize;
use sqlx::PgPool;

use crate::auth::{create_jwt_response, AuthBody, AuthError, Claims, Keys};

#[derive(sqlx::FromRow, Deserialize)]
struct User {
  id: i32,
  email: String,
  username: String,
  password: Vec<u8>,
}

pub static KEYS: Lazy<Keys> = Lazy::new(|| {
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
) -> Result<Json<AuthBody>, AuthError> {
  let email = payload.email.to_lowercase();
  let username = payload.username;
  let argon2 = Argon2::default();
  let salt = SaltString::generate(&mut OsRng);
  let password_hash = argon2
    .hash_password(payload.password.as_bytes(), &salt)
    .unwrap()
    .to_string()
    .into_bytes();

  let mut transaction = pool.begin().await.unwrap();

  let user: User = sqlx::query_as!(
    User,
    r#"INSERT INTO "user" (id, email, username, password) VALUES (DEFAULT, $1, $2, $3) RETURNING *"#,
    email,
    username,
    password_hash
  )
  .fetch_one(&mut *transaction)
  .await.unwrap();

  transaction.commit().await.unwrap();

  // TODO: generate email verification code

  Ok(Json(create_jwt_response(user.id.to_string())?))
}

pub async fn email_login(
  State(pool): State<PgPool>,
  Json(payload): Json<LoginUserPayload>,
) -> Result<Json<AuthBody>, AuthError> {
  let user: User = sqlx::query_as!(
    User,
    r#"SELECT * FROM "user" WHERE email = $1;"#,
    payload.email,
  )
  .fetch_one(&pool)
  .await
  .unwrap();

  let argon2 = Argon2::default();

  argon2
    .verify_password(
      payload.password.as_bytes(),
      &PasswordHash::new(std::str::from_utf8(&user.password).unwrap()).unwrap(),
    )
    .map_err(|_| AuthError::WrongCredentials)?;

  Ok(Json(create_jwt_response(user.id.to_string())?))
}

pub async fn refresh_token(Json(payload): Json<AuthPayload>) -> Result<Json<AuthBody>, AuthError> {
  let data = decode::<Claims>(
    &payload.refresh_token,
    &KEYS.decoding,
    &Validation::new(Algorithm::HS256),
  )
  .map_err(|_| AuthError::InvalidToken)?;

  Ok(Json(create_jwt_response(data.claims.sub)?))
}
