// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod model;

use serde::{Deserialize, Serialize, Serializer};
use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};
use std::env;
use tauri::{api::dialog::blocking::FileDialogBuilder, State};
use tokio::sync::RwLock;
use tracing::{info, span};

use burn::{backend::NdArray, tensor::Tensor};
use model::mnist::Model;

type Backend = NdArray<f32>;

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
      detect,
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

#[tauri::command]
#[tracing::instrument(skip_all)]
fn detect(image_data: Vec<u8>) -> Result<String, Error> {
  let img = image::load_from_memory(&image_data)
    .map_err(|_| Error::UnsupportedDatatype("Test".to_string()))?
    .resize_to_fill(28, 28, image::imageops::FilterType::Nearest)
    .to_luma32f()
    .into_vec();

  // Initialize a new model instance
  let device = <Backend as burn::tensor::backend::Backend>::Device::default();
  let model: Model<Backend> = Model::default();

  let input: Tensor<Backend, 4> =
    Tensor::from_floats(img.as_slice(), &device).reshape([1, 1, 28, 28]);

  // Normalize the input
  // input = ((input / 255) - 0.1307) / 0.3081;

  // Perform inference
  let output = model.forward(input);

  let arg_max = output.argmax(1).into_scalar() as u8;
  info!("Found number {}", arg_max);

  Ok(arg_max.to_string())
}

#[derive(Serialize, Deserialize)]
struct Item {
  id: i64,
  x: i64,
  y: i64,
  w: i64,
  h: i64,
  name: Option<String>,
  schema: Option<String>,
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
  schema: String,
) -> Result<Item, Error> {
  let pool = state.db.read().await;

  let item = sqlx::query_as!(
    Item,
    r#"
INSERT INTO item ( x, y, w, h, name, schema )
VALUES ( ?1, ?2, ?3, ?4, ?5, ?6 ) RETURNING *
      "#,
    x,
    y,
    w,
    h,
    name,
    schema,
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
  schema: String,
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
  schema = ?7
WHERE id = ?1
    "#,
    id,
    x,
    y,
    w,
    h,
    name,
    schema,
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
