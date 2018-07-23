#!/bin/bash
echo "INSTALLING CONFIG HELPER"
cd shared-modules/config-helper/
npm install
echo "INSTALLING DYNAMO MANAGER"
cd ../dynamodb-helper/
npm install
echo "INSTALLING METERING MANAGER"
cd ../metering-helper/
npm install
echo "INSTALLING TOKEN MANAGER"
cd ../token-manager/
npm install
echo "INSTALLING APP"
cd ../../src
npm install
echo "SETTING ENV"
export NODE_CONFIG_DIR=../shared-modules/config-helper/config/
node server.js