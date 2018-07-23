#!/bin/bash
echo "Exposing Metering Data from Streams"
echo "--------------------------"
echo "Installing scripts"
./install.sh
echo "Getting Data from Kinesis"
export AWS_DEFAULT_REGION="us-east-1"
export KINESIS_RECORDS_FILE_PATH="./../scripts/kinesis-records.json"
node ./../../../scripts/get-kinesis-records.js
echo "Getting Data from SQS"
export SQS_RECORDS_FILE_PATH="./../scripts/sqs-records.json"
node ./../../../scripts/get-sqs-records.js