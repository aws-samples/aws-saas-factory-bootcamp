#!/bin/bash
ECS_CLUSTER=PLACEHOLDER
echo "STOPPING EXISTING CONTAINER"
node ../../../../../scripts/restart-ecs-task.js
echo "STARTING NEW CONTAINER"
node ../../../../../scripts/check-ecs-task-status.sh
date
sleep 60
aws ecs list-tasks --cluster $ECS_CLUSTER --service-name product-manager --desired-status RUNNING
date
sleep 60
aws ecs list-tasks --cluster $ECS_CLUSTER --service-name product-manager --desired-status RUNNING
