# Spaced

### Prerequisites

In order to run Spaced in development the following must be installed.

- [Rust](https://www.rust-lang.org/learn/get-started)
- [sqlx-cli](https://github.com/launchbadge/sqlx/blob/HEAD/sqlx-cli/README.md#install)
- [NodeJS 18](https://nodejs.org/)
- [Docker](https://docker.com/)
- [Docker Compose](https://docs.docker.com/compose)
- [Docker Buildx](https://github.com/docker/buildx)
- [Tauri](https://tauri.app/v1/guides/getting-started/prerequisites)
<!-- - Protoc -->

If you're using Nix, you can run `nix-shell`, or configure [`direnv`](https://nixos.wiki/wiki/Development_environment_with_nix-shell#direnv) to install
the required Tauri dependencies.

## Getting started

Install dependencies for web-frontend.

```sh
npm i
```

The project requires at least a PostgreSQL database to be run and uses RabbitMQ as message broker. Both can be started using docker compose.

```sh
docker compose up -d
```

Prepare the databases with migrations.

```sh
npm run sqlx:prepare
```

The services can be started with the following script.

```sh
npm run services
```

The web-frontend can be started with the following script.

```sh
npm run dev
```

The web-frontend can also be displayed from a desktop application with the following command.

```sh
npm run tauri dev
```

## Building

The web-frontend can be built using the following script.

```sh
npm run build
```

The docker images for each service can be built using the following command.

```sh
docker buildx bake
```

Use the following environment variable to change the image tag.

```sh
IMAGE_TAG=1.0 docker buildx bake # result = spaced/<service_name>:1.0
```

Use the following environment variable to change the distroless image tag. The default is `nonroot` to debug with a shell use `debug` or `debug-nonroot`.

```sh
DISTROLESS_TAG=debug docker buildx bake
```

_The [docker-compose.yaml](./docker-compose.yaml) file is used as [build definition](https://docs.docker.com/engine/reference/commandline/buildx_bake/#file). `docker buildx bake` ignores profiles and builds the services anyway._

## Contributing

Please read the [contributing guidelines](CONTRIBUTING.md).
