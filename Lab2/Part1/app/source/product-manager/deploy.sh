#!/bin/bash
#DEPLOYING TO ECS USING CLOUDFORMATION SERVICE SCRIPT
echo "DEPLOYING PRODUCT MANAGER SERVICE VIA CFN CLI"
aws cloudformation create-stack --stack-name ProductManagerService --template-body file://../../../templates/product-manager-v1.template --parameters ParameterKey=BaselineStackName,ParameterValue=${BASELINE_STACK} --capabilities CAPABILITY_IAM
aws cloudformation wait stack-create-complete --stack-name ProductManagerService
echo "STACK CREATE COMPLETE"