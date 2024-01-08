create cluster & registry

```sh
k3d registry create spaced --port 5001
k3d cluster create spaced --api-port 6550 --port "8888:80@loadbalancer" --registry-use spaced:5001
```

delete cluster & registry

```sh
k3d registry delete spaced
k3d cluster delete spaced
```

setup nginx

```sh
kubectl create deployment nginx --image=nginx
kubectl create service clusterip nginx --tcp=80:80
kubectl apply -f config/manifests/nginx.yaml
```

install postgres (for debugging)

```sh
helm install debug-postgres oci://registry-1.docker.io/bitnamicharts/postgresql \
  --set "global.postgresql.auth.secretKeys.userPasswordKey=password" \
  --set "global.postgresql.auth.username=spaced" \
  --set "global.postgresql.auth.database=spaced" \
  --set "global.postgresql.service.ports.postgresql=5432" \
  --set "postgresql.fullnameOverride=debug-postgres" \
  --set "postgresql.enabled=false"
```

install rabbitmq (for debugging)

```sh
helm install debug-rabbitmq oci://registry-1.docker.io/bitnamicharts/rabbitmq \
  --set replicaCount=1 \
  --set auth.username=admin \
  --set auth.password=password \
  --set auth.erlangCookie=ERLANG_COOKIE
```

build services (as debug)

```sh
IMAGE_TAG=debug DISTROLESS_TAG=debug docker buildx bake
```

tag services (as debug)

```sh
docker tag spaced/item_producer:debug localhost:5001/item-producer:debug
```

push services (as debug)

```sh
docker push localhost:5001/item-producer:debug
```

deploy services (as debug)

```sh
kubectl create service clusterip nginx --tcp=80:80
kubectl apply -f config/manifests/item-producer-deployment.yaml
```

debug with executor

```sh
kubectl exec -it pod_name -- ls
```

PORT forwarding

```sh
kubectl port-forward --namespace default svc/debug-postgresql 5432:5432
```

Get password

```sh
export POSTGRES_ADMIN_PASSWORD=$(kubectl get secret --namespace default debug-postgresql -o jsonpath="{.data.postgres-password}" | base64 -d)
```

Then connect with psql

```sh
PGPASSWORD="$POSTGRES_ADMIN_PASSWORD" psql --host 127.0.0.1 -U admin -d spaced -p 5432
```

or simply create a pod with

```sh
kubectl run debug-postgresql-client --rm --tty -i \
  --restart='Never' --namespace default \
  --image docker.io/bitnami/postgresql:16.1.0-debian-11-r15 \
  --env="PGPASSWORD=password" \
  --command -- psql --host debug-postgresql -U admin -d spaced -p 5432
```
