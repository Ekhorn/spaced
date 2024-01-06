# Contributing

## Development

### Environment

An environment variable with the database url is required for sqlx to connect.

```sh
echo DATABASE_URL=postgres://admin:password@localhost:5432/spaced > .env
```

### Testing

> Note: the DATABASE_URL must be present in the environment for the database tests.

Running all tests

```sh
cargo test
```

Running tests for a specific workspace member

```sh
cargo test -p item_producer
```

### Updating migrations

> Note: the DATABASE_URL must be present in the environment for the sqlx-cli.

The docker images during build-time do not have access to a database with migrations applied. To ensure the docker image can be built, the json files under the `.sqlx` directory must be up-to-date and committed.

```sh
cargo sqlx prepare --workspace -- --all-targets --all-features
```
