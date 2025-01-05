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

- [1. Docker Context](#1-docker-context)
- [2. Deploying](#2-deploying)

</div>

## 1. Docker Context

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

## 2. Deploying

Then simply run docker stack, to start the containers.

```sh
docker stack config/docker/stack-traefik.yaml
```
