#!/usr/bin/env bash

set -e

if [ -z "${INPUT_SSH_KEY}" ]; then
  echo "ERROR: INPUT_SSH_KEY is required but not provided."
  exit 1
fi

mkdir -p /root/.ssh
chmod 0700 /root/.ssh
echo "${INPUT_SSH_KEY}" > /root/.ssh/id_rsa
chmod 0600 /root/.ssh/id_rsa

eval "$(ssh-agent -s)"
ssh-add /root/.ssh/id_rsa

ssh-keyscan -p "${INPUT_PORT}" -H "${INPUT_HOST}" >> /root/.ssh/known_hosts
