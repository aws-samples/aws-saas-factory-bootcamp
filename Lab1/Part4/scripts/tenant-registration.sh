#!/bin/bash
echo "BUILDING TENANT REGISTRATION SERVICE"
echo "--------------------------"
sudo yum install -y jq

echo "SETTING UP ENV VARIABLES"
export SERVICE_NAME="tenant-registration"
export BASELINE_STACK=$(aws cloudformation describe-stacks | jq -r '[.Stacks[] | select(.ParentId == null) | {CreationTime, StackName}] | sort_by(.CreationTime) | .[0].StackName')
export REPOSITORY_URI=$(aws ecr describe-repositories | jq -r '.repositories[0].repositoryUri')

echo 'MOVING TO SERVICE DIRECTORY'
cd ../app/source/"${SERVICE_NAME}"

echo 'BUILDING CONTAINER'
./build.sh