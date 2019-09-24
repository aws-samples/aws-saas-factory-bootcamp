#!/bin/bash
$(aws ecr get-login --no-include-email)
TAG="${SERVICE_NAME}"
docker build --tag "${REPOSITORY_URI}:${TAG}" .
docker push "${REPOSITORY_URI}:${TAG}"
printf '{"tag":"%s"}' ${TAG} > ../build.json
./deploy.sh ${SERVICE_NAME}