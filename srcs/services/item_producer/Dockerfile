# Available tags: latest, nonroot, debug, debug-nonroot
# For more, see https://github.com/GoogleContainerTools/distroless#how-do-i-use-distroless-images
ARG DISTROLESS_TAG=nonroot

# TODO: bind to the rust-version from Cargo.toml intead or latest
FROM rust:1.76.0 AS build
WORKDIR /app
COPY srcs srcs
COPY .sqlx .sqlx
COPY migrations migrations
COPY Cargo.toml Cargo.lock ./

RUN apt-get update && apt-get install -y protobuf-compiler libprotobuf-dev
RUN cargo build -p item_producer --release

# TODO: use static and copy dynamically linked libraries or build with static linking
FROM gcr.io/distroless/cc:$DISTROLESS_TAG
WORKDIR /home/nonroot
COPY --from=build --chown=nonroot:nonroot --chmod=544 /app/target/release/item_producer /usr/bin
ENTRYPOINT ["item_producer"]
