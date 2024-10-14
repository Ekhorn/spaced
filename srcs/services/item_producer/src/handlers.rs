// use amqprs::{channel::BasicPublishArguments, BasicProperties};
use serde::{Deserialize, Serialize};
use socketioxide::extract::{AckSender, Data, State};

pub mod item {
  include!(concat!(env!("OUT_DIR"), "/item.rs"));
}
// use item::ItemResponse;
// use prost::Message as ProtoMessage;
use uuid::Uuid;

use crate::{
  item::{Asset, Descendant, Item},
  GlobalState,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct ItemWithAssets {
  pub x: i64,
  pub y: i64,
  pub w: i64,
  pub h: i64,
  pub schema: String,
  pub assets: Vec<Vec<u8>>,
}

#[derive(Debug, Deserialize)]
pub struct BoundingBox {
  xmin: i32,
  ymin: i32,
  xmax: i32,
  ymax: i32,
}

#[tracing::instrument(skip_all)]
pub async fn get_nearby(
  ack: AckSender,
  State(GlobalState {
    db_pool,
    shared_amqp_channel: _,
  }): State<GlobalState>,
) {
  let records: Vec<Item> = sqlx::query_as!(Item, "SELECT * FROM item;")
    .fetch_all(db_pool)
    .await
    .unwrap();

  ack.send(records).ok();
}

#[tracing::instrument(skip_all)]
pub async fn create(
  ack: AckSender,
  Data(data): Data<ItemWithAssets>,
  State(GlobalState {
    db_pool,
    shared_amqp_channel: _,
  }): State<GlobalState>,
) {
  let mut assets = data.assets;

  let mut transaction = db_pool.begin().await.unwrap();

  let decendants = serde_json::from_str::<Vec<Descendant>>(&data.schema).unwrap();
  let mut assets = assets
    .iter_mut()
    .map(|asset| Asset {
      id: Uuid::new_v4().to_string(),
      name: "".to_string(),
      mime: "".to_string(),
      data: Some(asset.to_vec()),
    })
    .collect::<Vec<Asset>>();
  let mut output_descendants: Vec<Descendant> = vec![];
  let mut prepared_assets: Vec<Asset> = vec![];

  for descendant in decendants {
    let (d, a) = descendant.process_refs(&mut assets);
    output_descendants.push(d);
    for a in a {
      prepared_assets.push(a.clone());
    }
  }

  for asset in &prepared_assets {
    sqlx::query!(
      r#"
INSERT INTO asset ( id, name, mime, data )
VALUES ( $1, $2, $3, $4 )
      "#,
      asset.id,
      asset.name,
      asset.mime,
      asset.data,
    )
    .execute(&mut *transaction)
    .await
    .unwrap();
  }

  let schema = serde_json::to_string::<Vec<Descendant>>(&output_descendants).unwrap();

  let item = sqlx::query_as!(
    Item,
    r#"
INSERT INTO item ( x, y, w, h, schema )
VALUES ( $1, $2, $3, $4, $5 ) RETURNING *
      "#,
    data.x as i32,
    data.y as i32,
    data.w as i32,
    data.h as i32,
    schema,
  )
  .fetch_one(&mut *transaction)
  .await
  .unwrap();

  for asset in prepared_assets {
    sqlx::query!(
      r#"
  INSERT INTO item_assets ( item_id, asset_id )
  VALUES ( $1, $2 )
        "#,
      item.id as i32,
      asset.id,
    )
    .execute(&mut *transaction)
    .await
    .unwrap();
  }

  transaction.commit().await.unwrap();

  ack.send(item).ok();
}

// pub async fn update_outer(
//   Data(data): Data<ItemWithAssets>,
//   State(GlobalState {
//     db_pool: _,
//     shared_amqp_channel,
//   }): State<GlobalState>,
// ) {
//   let exchange_name = "amq.topic";
//   let routing_key = "item.update";
//   let args = BasicPublishArguments::new(exchange_name, routing_key);
//   shared_amqp_channel
//     .basic_publish(
//       BasicProperties::default(),
//       ItemResponse::encode_to_vec(&ItemResponse {
//         id: data.id,
//         x: data.x,
//         y: data.y,
//         w: data.w,
//         h: data.h,
//         name: data.name,
//         schema: data.schema,
//       }),
//       args,
//     )
//     .await
//     .unwrap();
// }

// pub async fn update_inner(
//   Data(data): Data<ItemWithAssets>,
//   State(GlobalState {
//     db_pool: _,
//     shared_amqp_channel,
//   }): State<GlobalState>,
// ) {
//   let exchange_name = "amq.topic";
//   let routing_key = "item.update";
//   let args = BasicPublishArguments::new(exchange_name, routing_key);
//   // broadcast_item_updates(data)
//   shared_amqp_channel
//     .basic_publish(
//       BasicProperties::default(),
//       ItemResponse::encode_to_vec(&ItemResponse {
//         id: data.id,
//         x: data.x,
//         y: data.y,
//         w: data.w,
//         h: data.h,
//         name: data.name,
//         schema: data.schema,
//       }),
//       args,
//     )
//     .await
//     .unwrap();
// }

// async fn broadcast_item_updates(item, ) {
//   channel
//     .basic_publish(BasicProperties::default(), data.into_bytes(), args)
//     .await
//     .unwrap();
// }
