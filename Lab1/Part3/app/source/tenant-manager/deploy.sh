#!/bin/bash
#DEPLOYING TO ECS USING CLOUDFORMATION SERVICE SCRIPT
echo "DEPLOYING TENANT MANAGER SERVICE VIA CFN CLI"
aws cloudformation create-stack --stack-name TenantManagerService --template-body file://../../../templates/tenant-manager.template --parameters ParameterKey=BaselineStackName,ParameterValue=${BASELINE_STACK} --capabilities CAPABILITY_IAM
aws cloudformation wait stack-create-complete --stack-name TenantManagerService
echo "STACK CREATE COMPLETE"