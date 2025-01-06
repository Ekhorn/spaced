#!/bin/bash

services=$(docker service ls --format "{{.Name}}")

all_healthy=true

for service in $services; do
  health_status=$(docker service ps $service --format "{{.CurrentState}}")

  if [[ $health_status == *"Running"* ]]; then
    echo "$service is healthy."
  else
    echo "$service is not healthy."
    all_healthy=false
  fi
done

if [ "$all_healthy" = true ]; then
  exit 0
else
  exit 1
fi
