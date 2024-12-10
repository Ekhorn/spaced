#!/usr/bin/env bash

cleanup() {
  echo "Cleaning up..."
  pkill -P $$
}

trap 'cleanup' EXIT

echo "Starting services..."
if [ "$#" -gt 0 ]; then
  args=("$@")
else
  args=($(ls srcs/services))
fi

for arg in "${args[@]}"; do
  if [ "$arg" == "migrations" ]; then continue
  fi
  cargo run -p $arg || true &
done

wait
