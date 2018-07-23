#!/bin/bash
echo "Installing scripts"
./install.sh
echo "BUILDING TENANT MANAGER"
echo "--------------------------"
echo 'SETTING UP ENV VARIABLES'
export AWS_DEFAULT_REGION="us-east-1"
export BUILD_FILE_PATH="./../app/source/tenant-manager/build.sh"
export SERVICE_NAME="tenant-manager"
node ./../../../scripts/expose-region.js
echo 'BACKING UP CLOUD9 DEFAULT CREDS'
cp /home/ec2-user/.aws/credentials /home/ec2-user/.aws/credentials-bak
echo 'SETTING ADMIN CLOUD9 CREDS'
rm -rf /home/ec2-user/.aws/credentials-new
touch /home/ec2-user/.aws/credentials-new
node ./../../../scripts/expose-secrets.js
echo 'REMOVING DEFAULT CLOUD9 CREDS'
rm -rf /home/ec2-user/.aws/credentials
echo 'OVERWRITING CREDS'
cp /home/ec2-user/.aws/credentials-new /home/ec2-user/.aws/credentials
node ./../../../scripts/expose-repository.js
node ./../../../scripts/expose-service-name.js
echo 'MOVING TO SERVICE DIRECTORY'
cd ../app/source/"${SERVICE_NAME}"
echo 'BUILDING CONTAINER'
./build.sh