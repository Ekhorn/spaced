use std::{
  collections::HashMap,
  sync::{OnceLock, RwLock},
};

use serde::Deserialize;
use socketioxide::extract::SocketRef;

static USERS: OnceLock<RwLock<HashMap<String, String>>> = OnceLock::new();
pub fn get_users() -> &'static RwLock<HashMap<String, String>> {
  USERS.get_or_init(|| RwLock::new(HashMap::new()))
}

#[derive(Debug, Deserialize)]
pub struct AuthData {
  user: Option<String>,
}

#[derive(Debug)]
pub enum ConnectError {
  InvalidUsername,
  EncodeError(serde_json::Error),
}

pub fn user_connect(
  socket: &SocketRef,
  auth: Result<AuthData, serde_json::Error>,
) -> Result<(), ConnectError> {
  let auth = auth.map_err(ConnectError::EncodeError)?;
  let mut users = get_users().write().unwrap();
  if let Some(user) = auth.user {
    users.insert(socket.id.to_string(), user);
  } else {
    return Err(ConnectError::InvalidUsername);
  }
  drop(users);
  Ok(())
}
