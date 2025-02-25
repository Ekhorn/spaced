echo "${INPUT_SSH_KEY}" > /root/.ssh/id_rsa
chmod 0600 /root/.ssh/id_rsa
eval "$(ssh-agent -s)"
ssh-add /root/.ssh/id_rsa

docker context
docker context use

docker stack ${}
