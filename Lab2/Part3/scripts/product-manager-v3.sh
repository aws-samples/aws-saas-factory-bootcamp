#!/bin/bash
echo "BUILDING PRODUCT MANAGER V3 - MULTI-TENANT WITH TENANT CONTEXT IN TOKEN"
echo "--------------------------"
if ! [ -x "$(command -v jq)" ]; then
    sudo yum install -y jq
fi

echo "SETTING UP ENV VARIABLES"
export SERVICE_NAME="product-manager"
export BASELINE_STACK=$(aws cloudformation describe-stacks | jq -r '[.Stacks[] | select(.ParentId == null) | {CreationTime, StackName}] | sort_by(.CreationTime) | .[0].StackName')
export REPOSITORY_URI=$(aws ecr describe-repositories | jq -r '.repositories[0].repositoryUri')
export ECS_CLUSTER=$(aws cloudformation describe-stacks --stack-name ${BASELINE_STACK} | jq -r '.Stacks[].Outputs[] | select(.OutputKey == "ECSCLUSTER") | .OutputValue')

echo 'MOVING TO SERVICE DIRECTORY'
cd ../app/source/"${SERVICE_NAME}"

echo 'BUILDING CONTAINER'
./build.sh