#! /bin/bash
k3d registry delete spaced || true
k3d cluster delete spaced || true

k3d registry create spaced --port 5001
k3d cluster create spaced --api-port 6550 --port "8888:80@loadbalancer" \
 --servers 1 --agents 1 --registry-use spaced:5001 \
 --k3s-arg "--disable=traefik@server:0"

helm install debug-postgres oci://registry-1.docker.io/bitnamicharts/postgresql \
  --set "global.postgresql.auth.secretKeys.adminPasswordKey=password" \
  --set "global.postgresql.auth.secretKeys.userPasswordKey=password" \
  --set "global.postgresql.auth.username=admin" \
  --set "global.postgresql.auth.password=password" \
  --set "global.postgresql.auth.database=spaced" \
  --set "global.postgresql.service.ports.postgresql=5432" \
  --set "postgresql.fullnameOverride=debug-postgres"

helm install debug-rabbitmq oci://registry-1.docker.io/bitnamicharts/rabbitmq \
  --set replicaCount=1 \
  --set auth.username=admin \
  --set auth.password=password \
  --set auth.erlangCookie=ERLANG_COOKIE \
  --set "postgresql.fullnameOverride=debug-rabbitmq"
  # --set podManagementPolicy=Parallel

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --set controller.ingressClass=nginx \
  --set controller.allowSnippetAnnotations=true

echo "Waiting for Ingress controller to be ready..."
until kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=controller; do
  sleep 5
done

kubectl apply -f config/manifests/ingress.yaml

docker push localhost:5001/item-producer
kubectl apply -f config/manifests/service.yaml
kubectl apply -f config/manifests/item-producer-deployment.yaml
