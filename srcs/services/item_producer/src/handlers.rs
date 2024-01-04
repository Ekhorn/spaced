use amqprs::{channel::BasicPublishArguments, BasicProperties};
use serde::{Deserialize, Serialize};
use socketioxide::extract::{AckSender, Data, State};

pub mod item {
  include!(concat!(env!("OUT_DIR"), "/item.rs"));
}
use item::ItemResponse;
use prost::Message as ProtoMessage;

use crate::GlobalState;

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

pub async fn get_nearby(
  ack: AckSender,
  Data(data): Data<BoundingBox>,
  State(GlobalState {
    db_pool,
    shared_amqp_channel: _,
  }): State<GlobalState>,
) {
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
  .fetch_all(db_pool)
  .await
  .unwrap();

  ack.send(records).ok();
}

pub async fn create(
  ack: AckSender,
  Data(data): Data<Item>,
  State(GlobalState {
    db_pool,
    shared_amqp_channel: _,
  }): State<GlobalState>,
) {
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
  .fetch_one(db_pool)
  .await
  .unwrap();

  ack.send(record).ok();
}

pub async fn update_outer(
  Data(data): Data<Item>,
  State(GlobalState {
    db_pool: _,
    shared_amqp_channel,
  }): State<GlobalState>,
) {
  let exchange_name = "amq.topic";
  let routing_key = "item.update";
  let args = BasicPublishArguments::new(exchange_name, routing_key);
  shared_amqp_channel
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
}

pub async fn update_inner(
  Data(data): Data<Item>,
  State(GlobalState {
    db_pool: _,
    shared_amqp_channel,
  }): State<GlobalState>,
) {
  let exchange_name = "amq.topic";
  let routing_key = "item.update";
  let args = BasicPublishArguments::new(exchange_name, routing_key);
  // broadcast_item_updates(data)
  shared_amqp_channel
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
}

// async fn broadcast_item_updates(item, ) {
//   channel
//     .basic_publish(BasicProperties::default(), data.into_bytes(), args)
//     .await
//     .unwrap();
// }
