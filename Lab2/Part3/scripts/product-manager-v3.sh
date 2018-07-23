#!/bin/bash
echo "BUILDING PRODUCT MANAGER V3 - MULTI-TENANT WITH TENANT CONTEXT IN TOKEN"
echo "--------------------------"
echo "Installing scripts"
./install.sh
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