#! /bin/bash

# Install postgres
helm install debug-postgres oci://registry-1.docker.io/bitnamicharts/postgresql \
  --set "global.postgresql.auth.secretKeys.adminPasswordKey=password" \
  --set "global.postgresql.auth.secretKeys.userPasswordKey=password" \
  --set "global.postgresql.auth.username=admin" \
  --set "global.postgresql.auth.password=password" \
  --set "global.postgresql.auth.database=spaced" \
  --set "global.postgresql.service.ports.postgresql=5432" \
  --set "postgresql.fullnameOverride=debug-postgres"

# Install rabbitmq
helm install debug-rabbitmq oci://registry-1.docker.io/bitnamicharts/rabbitmq \
  --set replicaCount=1 \
  --set auth.username=admin \
  --set auth.password=password \
  --set auth.erlangCookie=ERLANG_COOKIE \
  --set "postgresql.fullnameOverride=debug-rabbitmq"
  # --set podManagementPolicy=Parallel

# Setup ingress controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --set controller.ingressClass=nginx \
  --set controller.allowSnippetAnnotations=true
echo "Waiting for Ingress controller to be ready..."
until kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=controller; do
  sleep 5
done

# Apply manifests
kubectl apply -f config/manifests/ingress.yaml
kubectl apply -f config/manifests/service.yaml
kubectl apply -f config/manifests/item-producer-deployment.yaml

echo "URL: http://localhost:8888/"
