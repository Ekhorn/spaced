# Available tags: latest, nonroot, debug, debug-nonroot
# For more, see https://github.com/GoogleContainerTools/distroless#how-do-i-use-distroless-images
ARG DISTROLESS_TAG=nonroot

# TODO: bind to the rust-version from Cargo.toml intead or latest
FROM rust:1 AS build
WORKDIR /app
COPY srcs srcs
COPY Cargo.toml Cargo.lock ./

RUN cargo build -p item_socket --release

# TODO: use static and copy dynamically linked libraries or build with static linking
FROM gcr.io/distroless/cc-debian12:$DISTROLESS_TAG
COPY --from=build --chown=nonroot:nonroot --chmod=544 /app/target/release/item_socket /usr/bin

WORKDIR /home/nonroot
ENTRYPOINT ["item_socket"]

LABEL org.opencontainers.image.title="Spaced Item Socket"
LABEL org.opencontainers.image.licenses=MIT
LABEL org.opencontainers.image.source=https://github.com/Ekhorn/spaced.git
