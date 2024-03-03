#!/bin/bash

export DATABASE_URL=sqlite:$(pwd)/srcs/tauri/dev.db
touch $(pwd)/srcs/tauri/dev.db

if [ -z "$@" ] || [[ "$@" =~ "all" ]]; then
  echo "Creating sqlx cache for: all"
  (cd srcs/tauri && cargo sqlx prepare)
  (cd srcs/services/item_producer && cargo sqlx prepare)
  (cd srcs/services/user_service && cargo sqlx prepare)
else
  for arg in "$@"; do
    echo "Creating sqlx cache for: $arg"
    if [[ $arg =~ "tauri" ]]; then
      (cd srcs/tauri && cargo sqlx prepare)
    else
      (cd srcs/services/$arg && cargo sqlx prepare)
    fi
  done
fi
