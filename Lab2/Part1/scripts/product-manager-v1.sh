#!/bin/bash
echo "BUILDING PRODUCT MANAGER V1 - SINGLE TENANT"
echo "--------------------------"
if ! [ -x "$(command -v jq)" ]; then
    sudo yum install -y jq
fi

echo "SETTING UP ENV VARIABLES"
export SERVICE_NAME="product-manager"
export BASELINE_STACK=$(aws cloudformation describe-stacks | jq -r '[.Stacks[] | select(.ParentId == null) | {CreationTime, StackName}] | sort_by(.CreationTime) | .[0].StackName')
export REPOSITORY_URI=$(aws ecr describe-repositories | jq -r '.repositories[0].repositoryUri')

echo 'MOVING TO SERVICE DIRECTORY'
cd ../app/source/"${SERVICE_NAME}"

echo 'BUILDING CONTAINER'
./build.sh