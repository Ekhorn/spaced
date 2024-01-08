## Local kubernetes setup

This guide explain how to setup a local development cluster.

### Build and push services

Build services (with debugging enabled)

```sh
IMAGE_TAG=debug DISTROLESS_TAG=debug docker buildx bake
```

Tag services

```sh
docker tag spaced/item_producer:debug localhost:5001/item-producer:debug
```

Create / reset cluster and registry

```sh
k3d registry delete spaced || true
k3d cluster delete spaced || true
k3d registry create spaced --port 5001
k3d cluster create spaced --api-port 6550 --port "8888:80@loadbalancer" \
 --servers 1 --agents 1 --registry-use spaced:5001 \
 --k3s-arg "--disable=traefik@server:0"
```

Push services to registry

```sh
docker push localhost:5001/item-producer:debug
```

Finally deploy everything with the following script

```sh
npm run deploy
```

### Monitoring

Access RabbitMQ Management interface

```sh
echo "URL : http://localhost:15672/"
kubectl port-forward --namespace default svc/debug-rabbitmq 15672:15672
```

### Debugging

Execute a command inside a pod

```sh
kubectl exec -it pod_name -- ls # lists files in current working directory
```

Port forward a service (or pod)

```sh
kubectl port-forward --namespace default svc/debug-postgresql 5432:5432
```

Connecting with psql to Postgres

Grab Postgres password

```sh
export POSTGRES_ADMIN_PASSWORD=$(kubectl get secret --namespace default debug-postgresql -o jsonpath="{.data.postgres-password}" | base64 -d)
```

Then connect to Postgres by port forwarding

```sh
kubectl port-forward --namespace default svc/debug-postgresql 54321:5432
PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" psql --host 127.0.0.1 -U admin -d spaced -p 54321
```

Or create a pod with psql installed.

```sh
kubectl run debug-postgresql-client --rm --tty -i \
  --restart='Never' --namespace default \
  --image docker.io/bitnami/postgresql:16 \
  --env="PGPASSWORD=password" \
  --command -- psql --host debug-postgresql -U admin -d spaced -p 5432
```
