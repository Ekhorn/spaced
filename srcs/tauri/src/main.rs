// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

use item::item_client::ItemClient;
use item::ItemListResponse;
use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::sync::Mutex;
use tonic::transport::Channel;
use tonic::Request;
use utils::BoundingBox;

pub mod item {
  tonic::include_proto!("item");
}
pub mod utils {
  tonic::include_proto!("utils");
}

#[derive(Serialize, Deserialize, Debug)]
struct Item {
  id: i32,
  x: i32,
  y: i32,
  w: i32,
  h: i32,
  name: Option<String>,
  schema: Option<String>,
}
struct Client(Mutex<ItemClient<Channel>>);

impl ItemListResponse {
  fn into(self) -> Vec<Item> {
    let item_resp = self.item_response;
    item_resp
      .into_iter()
      .map(|i| Item {
        id: i.id,
        x: i.x,
        y: i.y,
        w: i.w,
        h: i.h,
        name: i.name,
        schema: i.schema,
      })
      .collect()
  }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  // let client = ItemClient::connect("http://127.0.0.1:50051").await?;

  tauri::Builder::default()
    // .manage(Client(client.into()))
    .invoke_handler(tauri::generate_handler![fetch_nearby_items])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

  Ok(())
}

#[tauri::command]
async fn fetch_nearby_items(
  client: State<'_, Client>,
  xmin: i32,
  ymin: i32,
  xmax: i32,
  ymax: i32,
) -> Result<Vec<Item>, ()> {
  println!("{:?}", "test");

  let response = client
    .0
    .lock()
    .await
    .nearby_items(Request::new(BoundingBox {
      xmin,
      ymin,
      xmax,
      ymax,
    }))
    .await
    .unwrap();

  println!("{:?}", response);
  Ok(response.into_inner().into())
}

// #[tauri::command]
// async fn select(pool: State<'_, Pool<Postgres>>) -> Result<Vec<Item>, ()> {
//   let rows = sqlx::query_as!(Item, "SELECT * FROM item;")
//     .fetch_all(&*pool)
//     .await
//     .unwrap();
//   Ok(rows)
// }

// #[tauri::command]
// async fn insert(
//   pool: State<'_, Pool<Postgres>>,
//   x: i32,
//   y: i32,
//   color: Option<String>,
//   data: String,
// ) -> Result<Item, ()> {
//   let item = sqlx::query_as!(
//     Item,
//     r#"
//     INSERT INTO item ( x, y, color, data )
//     VALUES ($1, $2, $3, $4) RETURNING id, x, y, color, data;
//     "#,
//     x,
//     y,
//     color,
//     data,
//   )
//   .fetch_one(&*pool)
//   .await
//   .unwrap();
//   Ok(item)
// }

// #[tauri::command]
// async fn update(
//   pool: State<'_, Pool<Postgres>>,
//   id: i32,
//   x: i32,
//   y: i32,
//   color: Option<String>,
//   data: String,
// ) -> Result<Item, ()> {
//   let item = sqlx::query_as!(
//     Item,
//     r#"
//     UPDATE item
//     SET (x, y, color, data) = ($2, $3, $4, $5)
//     WHERE id = $1
//     RETURNING id, x, y, color, data;
//     "#,
//     id,
//     x,
//     y,
//     color,
//     data,
//   )
//   .fetch_one(&*pool)
//   .await
//   .unwrap();
//   Ok(item)
// }

// #[tauri::command]
// async fn delete(pool: State<'_, Pool<Postgres>>, id: i32) -> Result<(), ()> {
//   sqlx::query!(
//     r#"
//     DELETE FROM item
//     WHERE id = $1;
//     "#,
//     id,
//   )
//   .execute(&*pool)
//   .await
//   .unwrap();
//   Ok(())
// }
