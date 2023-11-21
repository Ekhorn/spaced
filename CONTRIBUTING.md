## Development

### Updating migrations

The docker images during build-time do not have access to a database with migrations applied. To ensure the docker image can be built, the json files under the `.sqlx` directory must be up-to-date and committed.

```sh
cargo sqlx prepare --workspace -- --all-targets --all-features
```
