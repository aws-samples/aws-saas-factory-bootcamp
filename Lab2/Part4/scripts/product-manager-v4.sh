#!/bin/bash
echo "BUILDING PRODUCT MANAGER V4 - MULTI-TENANT WITH TENANT CONTEXT IN TOKEN AND METERING"
echo "--------------------------"
echo "Installing scripts"
./install.sh
#CREATE STREAMING SERVICES USING CLOUDFORMATION
echo "Creating SQS Queue, Kinesis Stream, and CloudWatch Event Rule and Function"
aws cloudformation create-stack --stack-name StreamingServices --template-body file://../templates/StreamingDataServices.template --capabilities CAPABILITY_IAM
aws cloudformation wait stack-create-complete --stack-name StreamingServices
echo "STACK CREATE COMPLETE"
echo 'SETTING UP ENV VARIABLES'
export AWS_DEFAULT_REGION="us-east-1"
export BUILD_FILE_PATH="./../app/source/product-manager/build.sh"
export SERVICE_NAME="product-manager"
node ./../../../scripts/expose-region.js
node ./../../../scripts/expose-repository.js
node ./../../../scripts/expose-service-name.js
echo 'MOVING TO SERVICE DIRECTORY'
cd ../app/source/"${SERVICE_NAME}"
echo 'BUILDING CONTAINER'
./build.sh