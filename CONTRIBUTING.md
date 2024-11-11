# Contributing

## Development

### Testing

**Rust**

> Note: The `DATABASE_URL` must be present as environment variable for the database tests. The `DATABASE_URL` is automatically set using the `build.rs` file if the build is not a release build.

Running all tests

```sh
cargo test
```

Running tests for a specific workspace member

```sh
cargo test -p item_producer
```

**Vitest**

Running unit/component tests

```sh
npm test
```

**Playwright**

Running End-to-End tests locally

```sh
npm run e2e
```

The following command is recommended when writing End-to-End tests.

```sh
npm run e2e -- --ui
```

To use Playwright codegen run the following command.

```sh
npm run codegen
```

### Updating migrations

> Note: `npm run sqlx:prepare` runs the `srcs/scripts/sqlx_prepare.sh` script, which by default runs `cargo sqlx prepare` on all crates individually. Available options are `all`, `item_producer`, `user_service`, and `tauri`.

The docker images do not have access to a database with migrations applied during build-time. To ensure the docker image can be built, the json files under the `.sqlx` directory must be up-to-date and committed.

The following script automatically sets-up each database and applies migrations using the `build.rs` config defined within each crate and then prepares the `.sqlx` cache directory.

```sh
docker compose up -d
npm run sqlx:prepare
```
