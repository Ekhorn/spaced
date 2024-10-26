# Spaced

> DISCLAIMER: Spaced is under active development. Security and privacy have been self-audited. I currently do not recommend using Spaced in production. Use Spaced at your own risk.
>
> See [privacy_audit.md](docs/archive/2024-2025/privacy_audit.md) and [security_audit.md](docs/archive/2024-2025/privacy_audit.md) documents.

## Introduction

For more details see [architecture.md](docs/guides/architecture.md)

## Getting started

### Prerequisites

In order to run Spaced in development the following must be installed.

- [NodeJS 18](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/learn/get-started)
- [Tauri](https://tauri.app/v1/guides/getting-started/prerequisites)
- [sqlx-cli](https://github.com/launchbadge/sqlx/blob/HEAD/sqlx-cli/README.md#install)

If you're using Nix, you can run `nix-shell`, or configure [`direnv`](https://nixos.wiki/wiki/Development_environment_with_nix-shell#direnv) to install
the required Tauri dependencies (and Playwright browsers).

You can choose either **Docker** or **Podman**. _Docker is used in the pipeline and deployments as it provides Swarm support with the `docker stack` command._

| Docker                                            | Podman                                                         |
| ------------------------------------------------- | -------------------------------------------------------------- |
| [Docker => v20.10](https://docker.com/)           | [Podman](https://podman.io)                                    |
| [Docker Compose](https://docs.docker.com/compose) | [Podman Compose](https://github.com/containers/podman-compose) |

<!-- - Protoc -->

Install dependencies for web-frontend.

```sh
npm ci
```

Prepare the database with migrations.

```sh
npm run sqlx:prepare -- --tauri
# Or for all databases at the same time with:
# npm run sqlx:prepare
```

The services can be started with the following commands.

```sh
cargo run -i item_socket
# cargo run -i item_producer # Not used atm
# cargo run -i user_service  # Not used atm
```

The web-frontend can be started with the following script.

```sh
npm run dev
```

The web-frontend can also be displayed from a desktop application with the following command.

```sh
npm run tauri dev
```

<!--
The project requires at least a PostgreSQL database to be run and uses RabbitMQ as message broker. Both can be started using docker compose.

```sh
docker compose up -d
``` -->

## Building

The web-frontend can be built using the following script.

```sh
npm run build
```

The docker images for each service can be built using the following command.

```sh
docker compose --profile services build
# Or also directly started with:
# docker compose --profile services up -d --build
```

Use the following environment variable to change the image tag.

```sh
IMAGE_TAG=1.0 docker compose --profile services build
```

Use the following environment variable to change the distroless image tag. The default is `nonroot`, to debug with a shell use `debug` or `debug-nonroot`.

```sh
DISTROLESS_TAG=debug docker compose --profile services build
```

## Security

Please read the [security policy](SECURITY.md), before reporting a security vulnerability.

## Contributing

Please read the [contributing guidelines](CONTRIBUTING.md).

## License

The project is licensed under a [MIT license](LICENSE).

Some workspace members (or files) contain their own MIT License copies, as they are derivative works (packages).
