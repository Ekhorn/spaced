#!/usr/bin/env bash
set -e

mkdir -p /root/.ssh
chmod 0700 /root/.ssh
ssh-keyscan -H "${INPUT_HOST}" >> /root/.ssh/known_hosts

echo "${INPUT_SSH_KEY}" > /root/.ssh/id_rsa
chmod 0600 /root/.ssh/id_rsa
eval "$(ssh-agent -s)"
ssh-add /root/.ssh/id_rsa

docker context create remote --docker "host=ssh://${INPUT_USER}@${INPUT_HOST}"
docker context use remote

if [ -n "${INPUT_ENV_FILE}" ]; then
  set -a
  source "${INPUT_ENV_FILE}"
fi

echo "$INPUT_ARGS" | while IFS= read -r ARGS; do
  echo "Running \`docker stack ${ARGS}\`"
  docker stack "${ARGS}"
done
