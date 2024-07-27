// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use item::{Asset, Components, Item};
use serde::{Serialize, Serializer};
use sqlx::{
  sqlite::{SqliteConnectOptions, SqliteJournalMode},
  SqlitePool,
};
use std::{env, str::FromStr};
use tauri::{api::dialog::blocking::FileDialogBuilder, State};
use tokio::sync::RwLock;
use tracing::info;
use uuid::Uuid;

mod item;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Serde(#[from] serde_json::Error),
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
      get_asset,
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
  let opts = SqliteConnectOptions::from_str(&file_path)?
    .create_if_missing(true)
    .foreign_keys(true)
    /* *
     * In sqlite, WAL mode is just fast enough to update 1 moving item per
     * Tauri command invocation without any optimizations.
     */
    .journal_mode(SqliteJournalMode::Wal);

  Ok((SqlitePool::connect_with(opts).await?, file_path))
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
async fn get_nearby_items(state: State<'_, AppState>) -> Result<Vec<Item>, Error> {
  let pool = state.db.read().await;
  let rows: Vec<Item> = sqlx::query_as!(Item, "SELECT * FROM item;")
    .fetch_all(&pool.clone().unwrap())
    .await?;
  info!("Retrieved {} record(s)", rows.len());
  Ok(rows)
}

#[tauri::command]
#[tracing::instrument(skip_all)]
async fn get_asset(state: State<'_, AppState>, id: String) -> Result<Asset, Error> {
  let pool = state.db.read().await;
  let asset: Asset = sqlx::query_as!(Asset, "SELECT * FROM asset WHERE id = ?1;", id)
    .fetch_one(&pool.clone().unwrap())
    .await?;
  info!("Retrieved asset: {}", id);
  Ok(asset)
}

#[tauri::command]
async fn create_item(
  state: State<'_, AppState>,
  x: i64,
  y: i64,
  w: i64,
  h: i64,
  schema: String,
  mut assets: Vec<Vec<u8>>,
) -> Result<Item, Error> {
  let pool = state.db.read().await;
  let mut transaction = pool.clone().unwrap().begin().await?;

  let item_schema = serde_json::from_str::<Components>(&schema).unwrap();
  let mut assets = assets
    .iter_mut()
    .map(|asset| Asset {
      id: Uuid::new_v4().to_string(),
      name: "".to_string(),
      mime: "".to_string(),
      data: Some(asset.to_vec()),
    })
    .collect::<Vec<Asset>>();
  let (output_schema, prepared_assets) = item_schema.process_refs(&mut assets);

  for asset in prepared_assets {
    sqlx::query!(
      r#"
INSERT INTO asset ( id, name, mime, data )
VALUES ( ?1, ?2, ?3, ?4 )
      "#,
      asset.id,
      asset.name,
      asset.mime,
      asset.data,
    )
    .execute(&mut *transaction)
    .await?;
  }

  let schema = serde_json::to_string::<Components>(&output_schema)?;

  let item = sqlx::query_as!(
    Item,
    r#"
INSERT INTO item ( x, y, w, h, schema )
VALUES ( ?1, ?2, ?3, ?4, ?5 ) RETURNING *
      "#,
    x,
    y,
    w,
    h,
    schema,
  )
  .fetch_one(&mut *transaction)
  .await?;

  for asset in prepared_assets {
    sqlx::query!(
      r#"
  INSERT INTO item_assets ( item_id, asset_id )
  VALUES ( ?1, ?2 )
        "#,
      item.id,
      asset.id,
    )
    .execute(&mut *transaction)
    .await?;
  }

  transaction.commit().await?;

  Ok(item)
}

/**
 * The items are updated in batch in a transaction improving performance. The batch
 * transaction allows the patch_item command to be able to update at least 10 moving
 * items without needing to throttle on the client, while without it can only handle
 * 1 moving item per Tauri command invocation.
 *
 * The patch operations could be refined into:
 * - Moving
 * - Resizing
 * - Schema updates
 */
#[tauri::command]
async fn patch_item(state: State<'_, AppState>, items: Vec<Item>) -> Result<(), Error> {
  let pool = state.db.read().await;
  let mut transaction = pool.clone().unwrap().begin().await?;

  for item in items {
    // https://github.com/launchbadge/sqlx/issues/2542
    sqlx::query!(
      r#"
  UPDATE item
  SET x = ?2,
    y = ?3,
    w = ?4,
    h = ?5,
    schema = ?6
  WHERE id = ?1
      "#,
      item.id,
      item.x,
      item.y,
      item.w,
      item.h,
      item.schema,
    )
    .execute(&mut *transaction)
    .await?;
  }

  transaction.commit().await?;

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
