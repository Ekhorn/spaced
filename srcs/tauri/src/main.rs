// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::bail;
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

// #[tauri::command]
// async fn detect() -> Result<String, Error> {
//   let args: Vec<_> = ["mnist.onnx", "example.png"].collect();
//   let (weights, image) = match args.as_slice() {
//     [_, w, i] => (std::path::Path::new(w), i.to_owned()),
//     _ => bail!("usage: main resnet18.ot image.jpg"),
//   };
//   // Load the image file and resize it to the usual imagenet dimension of 224x224.
//   let image = imagenet::load_image_and_resize224(image)?;

//   // Create the model and load the weights from the file.
//   let mut vs = tch::nn::VarStore::new(tch::Device::Cpu);

//   let resnet18 = tch::CModule::vs.load("mnist-12.onnx")?;

//   let output = net
//     .forward_t(&image.unsqueeze(0), /* train= */ false)
//     .softmax(-1, tch::Kind::Float); // Convert to probability.

//   for (probability, class) in imagenet::top(&output, 5).iter() {
//     println!("{:50} {:5.2}%", class, 100.0 * probability)
//   }

//   Ok("test".to_string())
// }

#[tauri::command]
async fn detect() -> Result<String, Error> {
  let model = std::path::PathBuf::from("mnist.onnx");

  let model = candle_onnx::read_file(model).unwrap();
  let graph = model.graph.as_ref().unwrap();
  let mut inputs = std::collections::HashMap::new();
  inputs.insert(graph.input[0].name.to_string(), image.unsqueeze(0)?);
  let mut outputs = candle_onnx::simple_eval(&model, inputs)?;
  let output = outputs.remove(&graph.output[0].name).unwrap();
  let prs = match args.which {
    Which::SqueezeNet => candle_nn::ops::softmax(&output, D::Minus1)?,
    Which::EfficientNet => output,
  };
  let prs = prs.i(0)?.to_vec1::<f32>()?;

  // Sort the predictions and take the top 5
  let mut top: Vec<_> = prs.iter().enumerate().collect();
  top.sort_by(|a, b| b.1.partial_cmp(a.1).unwrap());
  let top = top.into_iter().take(5).collect::<Vec<_>>();

  // Print the top predictions
  for &(i, p) in &top {
    println!(
      "{:50}: {:.2}%",
      candle_examples::imagenet::CLASSES[i],
      p * 100.0
    );
  }

  Ok("test".to_string())
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
async fn get_nearby_items(state: State<'_, AppState>) -> Result<Vec<Item>, Error> {
  let pool = state.db.read().await;
  let rows: Vec<Item> = sqlx::query_as!(Item, "SELECT * FROM item;")
    .fetch_all(&pool.clone().unwrap())
    .await?;
  info!("{}", rows.len());
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
