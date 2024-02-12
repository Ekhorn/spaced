#!/bin/bash

cleanup() {
  echo "Cleaning up..."
  pkill -P $$
}

trap 'cleanup' EXIT

echo "Running services..."
cargo run -p item_producer &
cargo run -p user_service &
wait
