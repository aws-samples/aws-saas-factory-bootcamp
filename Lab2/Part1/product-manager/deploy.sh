#!/bin/bash

if ! [ -x "$(command -v jq)" ]; then
    echo "Installing jq..."
    echo
    sudo yum install -y jq > /dev/null
fi

print_dots () {
    local COUNTDOWN=$1
    if [ -z "$COUNTDOWN" ]; then
        COUNTDOWN=60
    fi
    while [ "$COUNTDOWN" -gt 0 ]; do
        echo -ne "."
        sleep 1
        let COUNTDOWN--
    done
    echo
}

AWS_REGION=$(aws configure list | grep region | awk '{print $2}')
CODEBUILD_PROJECT="saas-bootcamp-product-svc"
CODE_PIPELINE="saas-bootcamp-product-svc"
BOOTCAMP_BUCKET=$(aws ssm get-parameter --name "saas-bootcamp-bucket-${AWS_REGION}" | jq -r '.Parameter.Value')
DEPLOY_MONITOR_QUEUE=$(aws ssm get-parameter --name "saas-bootcamp-ci-cd-queue-${AWS_REGION}" | jq -r '.Parameter.Value')

if [ -z "$BOOTCAMP_BUCKET" ]; then
    echo "Error: Can't determine SaaS Bootcamp S3 bucket name"
    exit 1
fi
if [ -z "$DEPLOY_MONITOR_QUEUE" ]; then
    echo "Error: Can't determine SaaS Bootcamp SQS queue URL"
    exit 1
fi

echo "SaaS Bootcamp S3 bucket: $BOOTCAMP_BUCKET"
echo "SaaS Bootcamp SQS queue: $DEPLOY_MONITOR_QUEUE"
echo

# Make sure the queue is empty before we start
aws sqs purge-queue --queue-url "$DEPLOY_MONITOR_QUEUE" > /dev/null

# Upload the updated code to S3
echo "Uploading code to S3"
aws s3 cp server.js s3://${BOOTCAMP_BUCKET}/source/product-manager/

# Trigger a new build to create a fresh docker image with the updated code
BUILD_PROJECT=$(aws codebuild start-build --project-name ${CODEBUILD_PROJECT})
BUILD_ID=$(echo $BUILD_PROJECT | jq -r '.build.id')

# Now, wait for CodePipeline to finish deploying everything to ECS
echo
echo "Rebuilding and deploying the Product Manager service. This can take a few minutes."
echo "You can view the details of the CI/CD process in the AWS console for CodeBuild and CodePipeline."
echo

# CodeBuild will take at least 1 minute
echo "Building a new docker image."
print_dots 60

BUILD_RUNNING=true
while [ "$BUILD_RUNNING" = true ]; do
    BUILD_PHASE=$(aws codebuild batch-get-builds --ids $BUILD_ID | jq -r '.builds[].currentPhase')
    if [ "$BUILD_PHASE" = "COMPLETED" ]; then
        BUILD_RUNNING=false
    else
        # After a minute, we'll check on the build every 5 seconds
        print_dots 5
    fi
done

echo
echo "Docker image built. Waiting for deployment to finish."

# CodePipeline will take 2+ minutes
LOOP=0
while true; do
    let LOOP++
    if [ "$LOOP" -gt 15 ]; then
        echo "This is taking too long. Please check the AWS CodePipeline console for unexpected errors."
        exit 1
    fi
    # Long poll SQS for 10 seconds
    SQS=$(aws sqs receive-message --queue-url "$DEPLOY_MONITOR_QUEUE" --wait-time-seconds 10 --max-number-of-messages 1)
    if ! [ -z "$SQS" ]; then
        #echo $SQS
        MESSAGE=$(echo $SQS | jq -r '.Messages[]')
        RECEIPT=$(echo $MESSAGE | jq -r '.ReceiptHandle')
        
        # Clean up SQS
        aws sqs delete-message --queue-url "$DEPLOY_MONITOR_QUEUE" --receipt-handle "$RECEIPT"
        echo
        echo "Deployment finished."
        exit
    else
        # The first couple of times pause for another minute before trying again
        # then check every 10 seconds
        if [ "$LOOP" -lt 3 ]; then
            print_dots 60
        else
            print_dots 10
        fi
    fi
done
