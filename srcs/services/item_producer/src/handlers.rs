use std::sync::Arc;

use amqprs::{
  channel::{BasicPublishArguments, Channel},
  BasicProperties,
};
use serde::{Deserialize, Serialize};
use socketioxide::extract::{AckSender, Data, SocketRef};
use sqlx::PgPool;
use tracing::info;

pub mod item {
  include!(concat!(env!("OUT_DIR"), "/item.rs"));
}
use item::ItemResponse;
use prost::Message as ProtoMessage;

#[derive(Debug, Serialize, Deserialize)]
pub struct Item {
  pub id: i32,
  pub x: i32,
  pub y: i32,
  pub w: i32,
  pub h: i32,
  pub name: Option<String>,
  pub schema: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BoundingBox {
  xmin: i32,
  ymin: i32,
  xmax: i32,
  ymax: i32,
}

pub fn get_nearby(socket: SocketRef, Data(data): Data<BoundingBox>, ack: AckSender) {
  // info!("Requesting nearby items");
  let pool = socket.extensions.get::<PgPool>().unwrap().clone();
  tokio::spawn(async move {
    let records: Vec<Item> = sqlx::query_as!(
      Item,
      r#"
        SELECT *
        FROM item
        WHERE x BETWEEN $1 AND $3
          AND y BETWEEN $2 AND $4;
        "#,
      data.xmin,
      data.ymin,
      data.xmax,
      data.ymax
    )
    .fetch_all(&pool)
    .await
    .unwrap();

    ack.send(records).ok();
  });
}

pub fn create(socket: SocketRef, Data(data): Data<Item>, ack: AckSender) {
  info!("Received item creation");
  let pool = socket.extensions.get::<PgPool>().unwrap().clone();
  tokio::spawn(async move {
    let record: Item = sqlx::query_as!(
      Item,
      r#"
        INSERT INTO item (id, x, y, w, h, name, schema)
        VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)
        RETURNING *
        "#,
      data.x,
      data.y,
      data.w,
      data.h,
      data.name,
      data.schema,
    )
    .fetch_one(&pool)
    .await
    .unwrap();

    ack.send(record).ok();
  });
}

pub fn update_outer(socket: SocketRef, Data(data): Data<Item>, _ack: AckSender) {
  info!("Received outer item update");
  let channel = socket.extensions.get::<Arc<Channel>>().unwrap().clone();
  tokio::spawn(async move {
    let exchange_name = "amq.topic";
    let routing_key = "item.update";
    let args = BasicPublishArguments::new(exchange_name, routing_key);
    channel
      .basic_publish(
        BasicProperties::default(),
        ItemResponse::encode_to_vec(&ItemResponse {
          id: data.id,
          x: data.x,
          y: data.y,
          w: data.w,
          h: data.h,
          name: data.name,
          schema: data.schema,
        }),
        args,
      )
      .await
      .unwrap();
  });
}

pub fn update_inner(socket: SocketRef, Data(data): Data<Item>, _ack: AckSender) {
  info!("Received inner item update");
  let channel = socket.extensions.get::<Arc<Channel>>().unwrap().clone();
  tokio::spawn(async move {
    let exchange_name = "amq.topic";
    let routing_key = "item.update";
    let args = BasicPublishArguments::new(exchange_name, routing_key);
    // broadcast_item_updates(data)
    channel
      .basic_publish(
        BasicProperties::default(),
        ItemResponse::encode_to_vec(&ItemResponse {
          id: data.id,
          x: data.x,
          y: data.y,
          w: data.w,
          h: data.h,
          name: data.name,
          schema: data.schema,
        }),
        args,
      )
      .await
      .unwrap();
  });
}

// async fn broadcast_item_updates(item, ) {
//   channel
//     .basic_publish(BasicProperties::default(), data.into_bytes(), args)
//     .await
//     .unwrap();
// }
