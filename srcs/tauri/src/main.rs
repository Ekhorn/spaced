// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize, Serializer};
use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};
use std::env;
use tauri::{api::dialog::blocking::FileDialogBuilder, State};
use tokio::sync::RwLock;
use tracing::info;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Sql(#[from] sqlx::Error),
  #[error(transparent)]
  Migration(#[from] sqlx::migrate::MigrateError),
  #[error("database {0} not loaded")]
  DatabaseNotLoaded(String),
  #[error("unsupported datatype: {0}")]
  UnsupportedDatatype(String),
}

impl Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

struct AppState {
  // TODO: Consider parking_lot rwlock if async works
  db: RwLock<Option<SqlitePool>>,
}

fn main() -> anyhow::Result<()> {
  utils::init_logging();
  tauri::Builder::default()
    .manage(AppState { db: None.into() })
    .invoke_handler(tauri::generate_handler![
      connect,
      get_nearby_items,
      create_item,
      patch_item,
      delete_item,
      save
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

  Ok(())
}

async fn try_connect(file_path: String) -> Result<(SqlitePool, String), Error> {
  Ok(if let Ok(pool) = SqlitePool::connect(&file_path).await {
    (pool, file_path)
  } else {
    Sqlite::create_database(&file_path).await?;
    (SqlitePool::connect(&file_path).await?, file_path)
  })
}

#[tauri::command]
async fn save(state: State<'_, AppState>) -> Result<String, Error> {
  let mut pool = state.db.write().await;

  let file_path = FileDialogBuilder::new()
    .add_filter("Sqlite database", &["db"])
    .save_file()
    .unwrap()
    .to_str()
    .unwrap()
    .to_string();

  let (new_pool, connected_path) = try_connect(file_path).await?;

  sqlx::migrate!().run(&new_pool).await?;
  *pool = Some(new_pool);

  Ok(connected_path)
}

#[tauri::command]
async fn connect(state: State<'_, AppState>, path: String) -> Result<String, Error> {
  let mut pool = state.db.write().await;
  let new_pool = SqlitePool::connect(&path).await?;

  sqlx::migrate!().run(&new_pool).await?;
  *pool = Some(new_pool);

  Ok(path)
}

#[derive(Serialize, Deserialize)]
struct Item {
  id: i64,
  x: i64,
  y: i64,
  w: i64,
  h: i64,
  name: Option<String>,
  mime: String,
  schema: Option<String>,
  file: Option<Vec<u8>>,
}

#[tauri::command]
#[tracing::instrument(skip_all)]
async fn get_nearby_items(state: State<'_, AppState>) -> Result<Vec<Item>, Error> {
  let pool = state.db.read().await;
  let rows: Vec<Item> = sqlx::query_as!(Item, "SELECT * FROM item;")
    .fetch_all(&pool.clone().unwrap())
    .await?;
  info!("Retrieved {} record(s)", rows.len());
  Ok(rows)
}

#[tauri::command]
async fn create_item(
  state: State<'_, AppState>,
  x: i64,
  y: i64,
  w: i64,
  h: i64,
  name: String,
  mime: String,
  schema: String,
  file: Option<Vec<u8>>,
) -> Result<Item, Error> {
  let pool = state.db.read().await;

  let item = sqlx::query_as!(
    Item,
    r#"
INSERT INTO item ( x, y, w, h, name, mime, schema, file )
VALUES ( ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8 ) RETURNING *
      "#,
    x,
    y,
    w,
    h,
    name,
    mime,
    schema,
    file,
  )
  .fetch_one(&pool.clone().unwrap())
  .await?;

  Ok(item)
}

#[tauri::command]
async fn patch_item(
  state: State<'_, AppState>,
  id: i64,
  x: i64,
  y: i64,
  w: i64,
  h: i64,
  name: String,
  mime: String,
  schema: String,
  file: Option<Vec<u8>>,
) -> Result<(), Error> {
  let pool = state.db.read().await;

  // https://github.com/launchbadge/sqlx/issues/2542
  sqlx::query!(
    r#"
UPDATE item
SET x = ?2,
  y = ?3,
  w = ?4,
  h = ?5,
  name = ?6,
  mime = ?7,
  schema = ?8,
  file = ?9
WHERE id = ?1
    "#,
    id,
    x,
    y,
    w,
    h,
    name,
    mime,
    schema,
    file,
  )
  .execute(&pool.clone().unwrap())
  .await?;

  Ok(())
}

#[tauri::command]
async fn delete_item(state: State<'_, AppState>, id: i64) -> Result<i64, Error> {
  let pool = state.db.read().await;

  sqlx::query!(
    r#"
DELETE FROM item WHERE id = ?1
    "#,
    id,
  )
  .execute(&pool.clone().unwrap())
  .await?;

  Ok(id)
}
