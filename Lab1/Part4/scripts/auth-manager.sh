#!/bin/bash
echo "BUILDING AUTH MANAGER"
echo "--------------------------"
echo 'SETTING UP ENV VARIABLES'
export AWS_DEFAULT_REGION="us-east-1"
export BUILD_FILE_PATH="./../app/source/auth-manager/build.sh"
export SERVICE_NAME="auth-manager"
node ./../../../scripts/expose-region.js
node ./../../../scripts/expose-repository.js
node ./../../../scripts/expose-service-name.js
echo 'MOVING TO SERVICE DIRECTORY'
cd ../app/source/"${SERVICE_NAME}"
echo 'BUILDING CONTAINER'
./build.sh