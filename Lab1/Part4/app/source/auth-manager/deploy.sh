#!/bin/bash
#DEPLOYING TO ECS USING CLOUDFORMATION SERVICE SCRIPT
echo "DEPLOYING AUTH MANAGER SERVICE VIA CFN CLI"
aws cloudformation create-stack --stack-name AuthManagerService --template-body file://../../../templates/auth-manager.template --parameters ParameterKey=BaselineStackName,ParameterValue=${BASELINE_STACK} --capabilities CAPABILITY_IAM
aws cloudformation wait stack-create-complete --stack-name AuthManagerService
echo "STACK CREATE COMPLETE"