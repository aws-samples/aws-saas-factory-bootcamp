#!/bin/bash

TASK_NAME=$1
ECS_TASKS=$(aws ecs list-tasks --cluster ${ECS_CLUSTER} | jq -r '.taskArns | .[]' | tr '\n' ' ')
TASK_ARN=$(aws ecs describe-tasks --cluster ${ECS_CLUSTER} --tasks ${ECS_TASKS} | jq -r --arg taskName "${TASK_NAME}" '.tasks[].containers[] | select(.name == "\($taskName)") | .taskArn')

echo "STOPPING EXISTING CONTAINER"
aws ecs stop-task --cluster $ECS_CLUSTER --task $TASK_ARN

echo "STARTING NEW CONTAINER"
aws ecs update-service --cluster $ECS_CLUSTER --service $TASK_NAME --task-definition $TASK_NAME

date
sleep 60
aws ecs list-tasks --cluster $ECS_CLUSTER --service-name $TASK_NAME --desired-status RUNNING
date
sleep 60
aws ecs list-tasks --cluster $ECS_CLUSTER --service-name $TASK_NAME --desired-status RUNNING
