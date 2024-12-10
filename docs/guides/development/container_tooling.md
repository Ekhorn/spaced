# Container tooling

### Compose build comparison

Docker seems slightly faster on cache misses. Cache hits (no code changes, or reverting code) seems to behave similar.

The test is building an image with a single Rust application. Also tried once with a second copy of the same application. _System wasn't at full idle so take it with a grain of salt._

**Docker**

```sh
time docker compose build
docker compose --profile services build  0,84s user 0,54s system 1% cpu 2:07,44 total
docker compose --profile services build  0,70s user 0,46s system 1% cpu 1:52,54 total
docker compose --profile services build  0,30s user 0,22s system 1% cpu 47,259 total
docker compose --profile services build  0,30s user 0,24s system 1% cpu 45,780 total
# 2 services
docker compose --profile services build  0,76s user 0,53s system 0% cpu 2:15,54 total
```

**Podman**

```sh
time podman compose build
podman compose --profile services build  278,17s user 23,41s system 209% cpu 2:23,76 total
podman compose --profile services build  282,20s user 21,39s system 557% cpu 54,496 total
podman compose --profile services build  285,43s user 22,32s system 417% cpu 1:13,66 total
podman compose --profile services build  289,89s user 21,56s system 572% cpu 54,371 total
# 2 services
podman compose --profile services build  611,27s user 51,11s system 279% cpu 3:56,58 total
```
