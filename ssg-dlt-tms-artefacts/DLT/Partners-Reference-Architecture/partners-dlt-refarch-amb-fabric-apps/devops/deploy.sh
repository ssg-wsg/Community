#!/bin/bash

# export AMB_APPS_AMB_ENDPOINT_NAME="com.amazonaws.us-east-1.managedblockchain.n-VOL3PLTK2NHZXJXN5QVLARD6RM"
# export AMB_APPS_VPC_STACKNAME=amb-apps-vpc
# export AMB_APPS_SAM_STACKNAME=amb-apps-lambda


# # Configuration parameters for The Synchronizer app
# export AMB_APPS_SYNC_STACKNAME=amb-apps-sychronizer
# export AMB_APPS_SYNC_IS_MASTER=false
# export AMB_APPS_SYNC_LOG_LEVEL=debug
# export AMB_APPS_SYNC_BC_NETWORK_ID=n-VOL3PLTK2NHZXJXN5QVLARD6RM
# export AMB_APPS_SYNC_BC_MEMBER_ID=m-27RM4CBVDFFC5DDZYJ534LXUPA
# export AMB_APPS_SYNC_BC_USER_NAME=admin
# export AMB_APPS_SYNC_BC_CHANNEL_NAME=testnet
# export AMB_APPS_SYNC_BC_PEER_ID=nd-3GG4GQ3ZIBBWHMDKYDGD6QEGZA
# export AMB_APPS_SYNC_BC_START_BLOCK=-1
# export AMB_APPS_SYNC_BC_END_BLOCK=-1
# export AMB_APPS_SYNC_BC_MAX_EVENT_HUB_RETRIES=10
# export AMB_APPS_SYNC_DYNAMO_TABLE_NAME=amb-blockchainWriteSet
# export AMB_APPS_SYNC_DYNAMO_PROFILE_NAME=default
# export AMB_APPS_SYNC_DYNAMO_REGION=us-east-1
# export AMB_APPS_SYNC_DYNAMO_PAGINATION_INDEX=docType-index

source ./devops/setConfigVariables.sh

echo " "
echo "Deploying APPS"
echo "AMB_APPS_DEPLOY_VPC="$AMB_APPS_DEPLOY_VPC
echo "AMB_APPS_REGION="$AMB_APPS_REGION
echo "AMB_SETUP_REGION="$AMB_SETUP_REGION

if [ "$AMB_APPS_DEPLOY_VPC" = true ] ; then
    echo " "
    echo "Deploying APPS VPC"
    echo "AMB_APPS_AMB_ENDPOINT_NAME="$AMB_APPS_AMB_ENDPOINT_NAME
    echo "AMB_APPS_VPC_STACKNAME="$AMB_APPS_VPC_STACKNAME

    aws cloudformation deploy --region $AMB_APPS_REGION --template-file ./amb-apps-vpc-template.yaml --stack-name $AMB_APPS_VPC_STACKNAME \
    --parameter-overrides AMBEndpointName=$AMB_APPS_AMB_ENDPOINT_NAME \
    AMBECRRegionName=$AMB_SETUP_REGION \
    --no-fail-on-empty-changeset

    # Reloading config
    source ./devops/setConfigVariables.sh
fi

# If regions for Lambda deployment are different, create a new bucket in the Lambda's region
if [ "$AMB_SETUP_REGION" != "$AMB_APPS_REGION" ]
then
    echo " "
    echo "Looks like we are deploying SAM application into a differnt region. Creating an S3 bucket for that"
    echo "AMB_APPS_BUILD_BUCKET_NAME_PREFIX="$AMB_APPS_BUILD_BUCKET_NAME_PREFIX
    
    aws cloudformation deploy --region $AMB_APPS_REGION --template-file ./amb-apps-sam-s3-template.yaml --stack-name "$AMB_APPS_SAM_STACKNAME-s3" \
    --parameter-overrides AMBAppsSAMBucketName=$AMB_APPS_BUILD_BUCKET_NAME_PREFIX \
    --no-fail-on-empty-changeset
fi

./devops/deploy-sam-s3-bucket.sh

export SAM_BUCKET=$AMB_APPS_BUILD_BUCKET_NAME_PREFIX-$AMB_SETUP_REGION-$(aws sts get-caller-identity --query 'Account' --output text)
export SAM_BUCKET_KMS_KEY=arn:aws:kms:$AMB_APPS_REGION:$(aws sts get-caller-identity --query 'Account' --output text):alias/aws/s3

cd amb-apps-sam/

echo " "
echo "Packaging and deploying APPS SAM application"
echo "SAM_BUCKET="$SAM_BUCKET
echo "SAM_BUCKET_KMS_KEY="$SAM_BUCKET_KMS_KEY
echo "AMB_APPS_SAM_STACKNAME="$AMB_APPS_SAM_STACKNAME
echo "AMB_APPS_LAMBDA_PREFIX="$AMB_APPS_LAMBDA_PREFIX
echo "AMB_APPS_SQS_IN_QUEUE_STACKNAME="$AMB_APPS_SQS_IN_QUEUE_STACKNAME
echo "AMB_APPS_INVOKE_QUERY_FCN_RESERVED_CONCURRENCY="$AMB_APPS_INVOKE_QUERY_FCN_RESERVED_CONCURRENCY
echo "AMB_APPS_REGION="$AMB_APPS_REGION
echo "AMB_APPS_SECURITY_GROUP_ID="$AMB_APPS_SECURITY_GROUP_ID
echo "AMB_APPS_PRIVATE_SUBNET1_ID="$AMB_APPS_PRIVATE_SUBNET1_ID
echo "AMB_APPS_PRIVATE_SUBNET2_ID="$AMB_APPS_PRIVATE_SUBNET2_ID
echo "AMB_APPS_PRIVATE_SUBNET3_ID="$AMB_APPS_PRIVATE_SUBNET3_ID
echo "AMB_APPS_SAM_IAM_ROLE_ARN="$AMB_APPS_SAM_IAM_ROLE_ARN

sam package --template-file ./amb-apps-sam-template.yaml --s3-bucket $SAM_BUCKET > ./template-orig.yaml --kms-key-id $SAM_BUCKET_KMS_KEY
cat ./template-orig.yaml | sed 's/Uploading.*//' > ./template.yaml
rm ./template-orig.yaml
#- pwd && ls -lah && cat ./template.yaml
#- sam deploy --template-file ./template.yaml --stack-name $AMB_APPS_SAM_STACKNAME

aws cloudformation deploy --region $AMB_APPS_REGION --template-file ./template.yaml --stack-name $AMB_APPS_SAM_STACKNAME \
--parameter-overrides \
AMBAppsLambdaNamePrefix=$AMB_APPS_LAMBDA_PREFIX \
AMBAppsInvokeQueryFcnReservedConcurrency=$AMB_APPS_INVOKE_QUERY_FCN_RESERVED_CONCURRENCY \
AMBAppsSecurityGroupID=$AMB_APPS_SECURITY_GROUP_ID \
AMBAppsPrivateSubnet1ID=$AMB_APPS_PRIVATE_SUBNET1_ID \
AMBAppsPrivateSubnet2ID=$AMB_APPS_PRIVATE_SUBNET2_ID \
AMBAppsPrivateSubnet3ID=$AMB_APPS_PRIVATE_SUBNET3_ID \
AMBAppsSAMRoleARN=$AMB_APPS_SAM_IAM_ROLE_ARN \
 --no-fail-on-empty-changeset

cd ..

 # Deploying The Synchronizer
./devops/deploy-the-synchronizer.sh

 # Deploying Inbound SQS queue and Lambda function
./devops/deploy-sqs-fcns.sh
