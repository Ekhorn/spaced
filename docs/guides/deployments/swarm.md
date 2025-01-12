# Deploy Spaced on Docker Swarm <!-- omit in toc -->

The guide describes how to deploy Spaced using Docker Swarm in production.

## Contents <!-- omit in toc -->

<div class="toc">
  <style>
    .toc > ul { padding-left: 1em; }
    .toc > * * ul { padding-left: 1em; }
    .toc > * > li { list-style-type: none; }
    .toc > * * > li { list-style-type: none; }
  </style>

- [1. Why Docker Swarm](#1-why-docker-swarm)
- [2. Setup](#2-setup)
  - [2.1. Docker Context](#21-docker-context)
  - [2.2. Configurations and secrets management](#22-configurations-and-secrets-management)
  - [2.3. Deploying](#23-deploying)

</div>

## 1. Why Docker Swarm

Docker Swarm allows for [rolling updates](https://docs.docker.com/engine/swarm/#rolling-updates) and [blue/green deployments](https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment) allowing updates without down-time unlike docker compose which stops previous containers. Secondly secrets can be managed securely with the [`docker secret`](https://docs.docker.com/engine/swarm/secrets/) command, and [additional configurations](https://docs.docker.com/engine/swarm/configs/) can be included as well.

## 2. Setup

### 2.1. Docker Context

Once Docker is installed it's useful to configure a docker context, so you can easily switch to your VPS to update the deployment.

```sh
docker context create spaced --docker host=ssh://spaced@<ip-address>
```

Then you can switch to it with the following command.

```sh
docker context use spaced
```

To list all contexts use the following command. You should see the context being used is "spaced". If not you might have seen a warning about the `DOCKER_HOST` environment variables you can use `unset DOCKER_HOST` to resolve this, then try again.

```sh
docker context ls
```

Now you can enable docker swarm to allow secrets, configs and spaced to be deployed.

```sh
docker swarm init
```

### 2.2. Configurations and secrets management

> Note: You must be connected to the remote server either directly over SSH or using Docker Context. See [2.1. Docker Context](#21-docker-context).

> Note: You may remove the cAdvisor, and Prometheus services in case you do not need further observability and want to spare some of the server resources.

Now to secure certain features within Spaced you'll want to add a couple secrets manually. This can be done using the `docker secret create` command.

These secrets are `TRAEFIK_USERS` (for the Traefik dashboard accessible at `/dashboard`), `PROM_PASSWORD` (for the Prometheus dashboard at `/prometheus`). See the example below for how to configure these secrets.

Depending on the provider any number of `DNS_PROVIDER_API_SECRET`'s required for TLS certificate renewals. Find the secrets required for your provider at: https://doc.traefik.io/traefik/https/acme/#providers

> Important: Make sure to configure the right domain name.

```yaml
configs:
  prometheus:
    contents: |
      scrape_configs:
        - job_name: cadvisor
          scrape_interval: 5s
          static_configs:
            - targets: [cadvisor:8080]
        - job_name: traefik
          scrape_interval: 5s
          static_configs:
            - targets: [traefik:8080]
        - job_name: item_socket
          scrape_interval: 5s
          static_configs:
            - targets: [item_socket:8081]

secrets:
  # https://doc.traefik.io/traefik/middlewares/http/basicauth/#usersfile
  # Create a `users` file with a hashed password (use `htpasswd -nB admin`) inside like this:
  # admin:$2b$12$hNf2lSsxfm0.i4a.1kVpSOVyBCfIB51VRjgBUyv6kdnyTlgWj81Ay
  #
  # Then run `docker secret create TRAEFIK_USERS users`
  TRAEFIK_USERS:
    external: true
  # https://prometheus.io/docs/guides/basic-auth/
  # Create a `web.yaml` file with a hashed password (use `htpasswd -nB admin`) inside like this:
  # basic_auth_users:
  #   admin: $2b$12$hNf2lSsxfm0.i4a.1kVpSOVyBCfIB51VRjgBUyv6kdnyTlgWj81Ay
  #
  # Then run `docker secret create PROM_PASSWORD web.yaml`
  PROM_PASSWORD:
    external: true
  # Put your DNS provider credentials inside a file
  # and add them one-by-one using `cat secret | docker secret create DNS_PROVIDER_API_SECRET -`
  DNS_PROVIDER_API_SECRET:
    external: true

services:
  # Reverse-proxy for Spaced services
  traefik:
    image: traefik:v3.2
    deploy:
      labels:
        - traefik.enable=true
        - traefik.http.routers.dashboard.rule=Host(`example.com`) && (PathPrefix(`/api`) || PathPrefix(`/dashboard`))
        - traefik.http.routers.dashboard.service=api@internal
        - traefik.http.routers.dashboard.middlewares=auth
        - traefik.http.services.dashboard.loadbalancer.server.port=8080
        - traefik.http.middlewares.auth.basicauth.usersfile=/run/secrets/TRAEFIK_USERS
      placement:
        constraints:
          - node.role == manager
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # - /home/spaced/:/logs
    secrets:
      - DNS_PROVIDER_API_SECRET
      - TRAEFIK_USERS
    environment:
      - DNS_PROVIDER_API_SECRET=/run/secrets/DNS_PROVIDER_API_SECRET
    command:
      # - --log.level=DEBUG
      # - --log.filePath=/logs/traefik.log
      # - --api.insecure=true
      - --api.dashboard=true
      - --metrics.prometheus=true
      - --providers.swarm=true
      - --providers.swarm.exposedByDefault=false
      - --entrypoints.web.address=:80
    ports:
      - 80:80
  # Metrics
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.49.1
    deploy:
      labels:
        - traefik.enable=false
        - traefik.http.routers.cadvisor.rule=Host(`example.com`) && PathPrefix(`/cadvisor`)
        - traefik.http.services.cadvisor.loadbalancer.server.port=8080
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /sys/fs/cgroup:/sys/fs/cgroup:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    command:
      - --docker_only=true
  prometheus:
    image: prom/prometheus
    deploy:
      labels:
        - traefik.enable=true
        - traefik.http.routers.prometheus.rule=Host(`example.com`) && PathPrefix(`/prometheus`)
        - traefik.http.services.prometheus.loadbalancer.server.port=9090
    secrets:
      - PROM_PASSWORD
    configs:
      - source: prometheus
        target: /etc/prometheus/swarm.yml
    command:
      - --config.file=/etc/prometheus/swarm.yml
      - --web.config.file=/run/secrets/PROM_PASSWORD
      - --web.external-url=/prometheus/
    depends_on:
      - cadvisor
  # Static file server
  nginx:
    image: ghcr.io/ekhorn/spaced/nginx:${COMMIT_SHA:-latest}
    deploy:
      labels:
        - traefik.enable=true
        - traefik.http.routers.nginx.rule=Host(`example.com`) && PathPrefix(`/`)
        - traefik.http.services.nginx.loadbalancer.server.port=80
  # Spaced services
  item_socket:
    image: ghcr.io/ekhorn/spaced/item_socket:${COMMIT_SHA:-latest}
    deploy:
      labels:
        - traefik.enable=true
        - traefik.http.routers.item_socket.rule=Host(`example.com`) && PathPrefix(`/socket.io`)
        - traefik.http.services.item_socket.loadbalancer.server.port=8081
        - traefik.http.services.item_socket.loadBalancer.sticky.cookie.name=server_id
        - traefik.http.services.item_socket.loadBalancer.sticky.cookie.httpOnly=true
    environment:
      - HOST=0.0.0.0
```

### 2.3. Deploying

> Note: You must be connected to the remote server either directly over SSH or using Docker Context. See [2.1. Docker Context](#21-docker-context).

Now all that's needed is running `docker stack deploy`, to start the containers.

```sh
docker stack deploy path/to/my-spaced-stack.yaml
```
