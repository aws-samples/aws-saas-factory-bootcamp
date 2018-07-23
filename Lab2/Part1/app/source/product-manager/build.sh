#!/bin/bash
export AWS_DEFAULT_REGION=PLACEHOLDER
export SERVICE_NAME=PLACEHOLDER
export REPOSITORY_URI=PLACEHOLDER
$(aws ecr get-login --region $AWS_DEFAULT_REGION | sed -e 's/-e none//g')
TAG="$SERVICE_NAME"
docker build --tag "${REPOSITORY_URI}:${TAG}" .
docker push "${REPOSITORY_URI}:${TAG}"
printf '{"tag":"%s"}' $TAG > ../build.json
./deploy.sh