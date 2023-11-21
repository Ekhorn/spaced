#!/bin/bash

cleanup() {
  echo "Cleaning up..."
  pkill -P $$
}

trap 'cleanup' EXIT

echo "Running services..."
# RUST_LOG=info cargo run -p item_consumer &
RUST_LOG=info cargo run -p item_producer &
wait
