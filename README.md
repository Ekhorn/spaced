# Spaced

### Prequisites

- Docker
- Rustc & Cargo
- sqlx-cli
- Node 18 + NPM

### Usage

```sh
npm i
```

```sh
docker compose up -d
```

```sh
npm run tauri dev
```

**Reset DB**

```sh
docker compose down
docker compose up -d
```

```sh
cd tauri
sqlx migrate run
```
