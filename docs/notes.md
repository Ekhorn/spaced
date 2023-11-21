> Note: these commands may not be up-to-date with the source

**Reset database**

```sh
docker compose down postgres-dev
docker compose up -d
```

```sh
sqlx migrate run
```

**List dymically linked libraries**

```sh
lld target/build/release/service-name
```

**Create a user using curl**

```sh
curl --header "Content-Type: application/json" -X POST http://127.0.0.1:8080/register --data '{"email":"test@example.com", "username": "test", "password": "test"}'
```

**Create an item using psql**

```sh
psql postgres://admin:password@localhost:5432/spaced
```

```sql
INSERT INTO item (id, x, y, w, h, name, stylesheet, schema, user_id) VALUES (DEFAULT, 5, 5, 50, 50, 'test', NULL, 'test', 1);
```

**Generate certificates for expiremental WebTransport support**

```sh
openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 -keyout key.pem -out cert.pem
```

**Resolving kafka container**

Ensure to add the kafka container id to `/etc/hosts`, so services can resolve it.

_See <https://stackoverflow.com/questions/43103167/failed-to-resolve-kafka9092-name-or-service-not-known-docker-php-rdkafka>_
