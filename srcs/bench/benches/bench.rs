use criterion::{criterion_group, criterion_main, Criterion};
use rust_socketio::{ClientBuilder, Payload};
use serde_json::json;
use std::{thread::sleep, time::Duration};

fn benchmark_throughput(c: &mut Criterion) {
  let server_url = "http://localhost:8080";
  let event_name = "item:get_nearby";
  let payload = r#"{"xmin": -1000, "ymin": -1000, "xmax": 1000, "ymax": 1000}"#;
  let socket = ClientBuilder::new(server_url)
    .auth(json!({"user": "1337"}))
    .namespace("/")
    .connect()
    .expect("Failed to connect");

  c.bench_function("throughput_sync", |b| {
    b.iter(|| {
      socket
        .emit_with_ack(
          event_name,
          payload,
          Duration::from_secs(1),
          |_message: Payload, _| {},
        )
        .unwrap();
      sleep(Duration::new(0, 1))
    });
  });
}

criterion_group!(benches, benchmark_throughput);
criterion_main!(benches);
