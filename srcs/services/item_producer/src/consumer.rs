use std::sync::Arc;

use amqprs::{
  channel::{BasicConsumeArguments, Channel, QueueBindArguments, QueueDeclareArguments},
  consumer::AsyncConsumer,
  BasicProperties, Deliver,
};
use anyhow::{Ok, Result};
use async_trait::async_trait;
use bytes::Bytes;
use prost::Message;
use socketioxide::SocketIo;
use tokio::sync::Notify;
use tracing::info;

use crate::handlers::{item::ItemResponse, Item};

struct ItemConsumer {
  socket: SocketIo,
}

impl ItemConsumer {
  pub fn new(socket: SocketIo) -> Self {
    Self { socket }
  }
}

#[async_trait]
impl AsyncConsumer for ItemConsumer {
  async fn consume(
    &mut self,
    _channel: &Channel,
    _deliver: Deliver,
    _basic_properties: BasicProperties,
    content: Vec<u8>,
  ) {
    info!("Consuming incoming message: {:?}", content);
    let item = ItemResponse::decode(Bytes::from(content)).unwrap();

    self
      .socket
      .emit(
        "item:updates",
        Item {
          id: item.id,
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          name: item.name,
          schema: item.schema,
        }
      )
      .unwrap();
  }
}

pub async fn background_task(socket: SocketIo, channel: Arc<Channel>) -> Result<()> {
  info!("Connect AMQP consumer");

  let (queue_name, _, _) = channel
    .queue_declare(QueueDeclareArguments::default())
    .await?
    .unwrap();

  let exchange_name = "amq.topic";
  let routing_key = "item.update";
  channel
    .queue_bind(QueueBindArguments::new(
      &queue_name,
      exchange_name,
      routing_key,
    ))
    .await?;

  let args = BasicConsumeArguments::new(&queue_name, "example_basic_pub_sub");

  tokio::spawn(async move {
    channel
      .basic_consume(ItemConsumer::new(socket), args)
      .await
      .unwrap();
    let guard = Notify::new();
    guard.notified().await;
  });
  let guard = Notify::new();
  guard.notified().await;
  Ok(())
}
