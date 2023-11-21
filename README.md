# Spaced

### Prerequisites

In order to run Spaced in development the following must be installed.

- [Rust](https://www.rust-lang.org/learn/get-started)
- [sqlx-cli](https://github.com/launchbadge/sqlx/blob/HEAD/sqlx-cli/README.md#install)
- [NodeJS 18](https://nodejs.org/)
- [Docker](https://docker.com/)
- [Docker Compose](https://docs.docker.com/compose)
- [Docker Buildx](https://github.com/docker/buildx)
<!-- - Protoc -->

## Getting started

Install dependencies for web-frontend.

```sh
npm i
```

The project requires at least a PostgreSQL database to be run and uses RabbitMQ as message broker. Both can be started using docker compose.

```sh
docker compose up -d
```

The services can be started by running the following script.

```sh
npm run services
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

To allow a shell to be attached for debugging use the following argument.

```sh
IMAGE_TAG=debug-nonroot docker buildx bake
```

_The [docker-compose.yaml](./docker-compose.yaml) file is used as [build definition](https://docs.docker.com/engine/reference/commandline/buildx_bake/#file). `docker buildx bake` ignores profiles and builds the services anway._

## Contributing

Please read the [contributing guidelines](CONTRIBUTING.md).
