#!/bin/bash
#DEPLOYING TO ECS USING CLOUDFORMATION SERVICE SCRIPT
echo "DEPLOYING TENANT REGISTRATION SERVICE VIA CFN CLI"
aws cloudformation create-stack --stack-name TenantRegistrationService --template-body file://../../../templates/tenant-registration.template --parameters ParameterKey=BaselineStackName,ParameterValue=${BASELINE_STACK} --capabilities CAPABILITY_IAM
aws cloudformation wait stack-create-complete --stack-name TenantRegistrationService
echo "STACK CREATE COMPLETE"