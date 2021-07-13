#!/bin/bash

#export SAM_BUCKET=lambda-chaincode-devops
#export SAM_BUCKET=amb-devops-codepipeline-codepipelineartifactstore-t35gc228u5i2
#export SAM_BUCKET_KMS_KEY="arn:aws:kms:us-east-1:${AWS::AccountId}:alias/aws/s3"
# export AMB_DEVOPS_AMB_ENDPOINT_NAME="com.amazonaws.us-east-1.managedblockchain.n-jmrtzfi43bcnhc7dsxs7t5matu"
# export AMB_DEVOPS_VPC_STACKNAME=amb-devops-vpc
# export AMB_DEVOPS_SAM_STACKNAME=amb-devops-lambda

source ./devops/setConfigVariables.sh

echo " "
echo "Executing DEPLOY script"
echo "SAM_BUCKET="$SAM_BUCKET
echo "AMB_DEVOPS_REGION="$AMB_DEVOPS_REGION
echo "AMB_SETUP_REGION="$AMB_SETUP_REGION

# Deploying DevOps VPC
if [ "$AMB_DEVOPS_DEPLOY_VPC" = true ] ; then
    echo " "
    echo "Deploying DevOps VPC"
    echo "AMB_DEVOPS_DEPLOY_VPC="$AMB_DEVOPS_DEPLOY_VPC
    echo "AMB_DEVOPS_AMB_ENDPOINT_NAME="$AMB_DEVOPS_AMB_ENDPOINT_NAME
    echo "AMB_DEVOPS_VPC_STACKNAME="$AMB_DEVOPS_VPC_STACKNAME

    aws cloudformation deploy --region $AMB_DEVOPS_REGION --template-file ./amb-devops-vpc-template.yaml \
    --stack-name $AMB_DEVOPS_VPC_STACKNAME --parameter-overrides \
    AMBEndpointName=$AMB_DEVOPS_AMB_ENDPOINT_NAME \
    --no-fail-on-empty-changeset

    # Reloading config
    source ./devops/setConfigVariables.sh
fi

./devops/deploy-sam-s3-bucket.sh

export SAM_BUCKET=$AMB_DEVOPS_BUILD_BUCKET_NAME_PREFIX-$AMB_DEVOPS_REGION-$(aws sts get-caller-identity --query 'Account' --output text)
export SAM_BUCKET_KMS_KEY=arn:aws:kms:$AMB_DEVOPS_REGION:$(aws sts get-caller-identity --query 'Account' --output text):alias/aws/s3

echo " "
echo "Packaging SAM Application for DevOps"
echo "SAM_BUCKET="$SAM_BUCKET
echo "SAM_BUCKET_KMS_KEY="$SAM_BUCKET_KMS_KEY

sam package --template-file ./amb-devops-sam-template.yaml --s3-bucket $SAM_BUCKET > ./template-orig.yaml --kms-key-id $SAM_BUCKET_KMS_KEY
cat ./template-orig.yaml | sed 's/Uploading.*//' > ./template.yaml
rm ./template-orig.yaml
#- pwd && ls -lah && cat ./template.yaml
#- sam deploy --template-file ./template.yaml --stack-name $AMB_DEVOPS_SAM_STACKNAME

echo " "
echo "Deploying SAM Application for DevOps"
echo "AMB_DEVOPS_SAM_STACKNAME="$AMB_DEVOPS_SAM_STACKNAME
echo "AMB_DEVOPS_SECURITY_GROUP_ID="$AMB_DEVOPS_SECURITY_GROUP_ID
echo "AMB_DEVOPS_PRIVATE_SUBNET1_ID="$AMB_DEVOPS_PRIVATE_SUBNET1_ID
echo "AMB_DEVOPS_PRIVATE_SUBNET2_ID="$AMB_DEVOPS_PRIVATE_SUBNET2_ID
echo "AMB_DEVOPS_PRIVATE_SUBNET3_ID="$AMB_DEVOPS_PRIVATE_SUBNET3_ID
echo "AMB_DEVOPS_IAM_ROLES_STACK_NAME="$AMB_DEVOPS_IAM_ROLES_STACK_NAME
echo "AMB_DEVOPS_SAM_IAM_ROLE_ARN="$AMB_DEVOPS_SAM_IAM_ROLE_ARN
echo "AMB_DEVOPS_CHANNEL_S3_IAM_JOINER_ROLE_NAME"=$AMB_DEVOPS_CHANNEL_S3_IAM_JOINER_ROLE_NAME
echo "AMB_DEVOPS_LAMBDA_PREFIX"=$AMB_DEVOPS_LAMBDA_PREFIX

aws cloudformation deploy --region $AMB_DEVOPS_REGION --template-file ./template.yaml \
--stack-name $AMB_DEVOPS_SAM_STACKNAME --parameter-overrides \
AMBDevOpsLambdaNamePrefix=$AMB_DEVOPS_LAMBDA_PREFIX \
AMBDevOpsSAMIamRoleARN=$AMB_DEVOPS_SAM_IAM_ROLE_ARN \
AMBDevOpsChannelJoinerIAMRoleName=$AMB_DEVOPS_CHANNEL_S3_IAM_JOINER_ROLE_NAME \
AMBDevOpsSecurityGroupID=$AMB_DEVOPS_SECURITY_GROUP_ID \
AMBDevOpsPrivateSubnet1ID=$AMB_DEVOPS_PRIVATE_SUBNET1_ID \
AMBDevOpsPrivateSubnet2ID=$AMB_DEVOPS_PRIVATE_SUBNET2_ID \
AMBDevOpsPrivateSubnet3ID=$AMB_DEVOPS_PRIVATE_SUBNET3_ID \
--capabilities CAPABILITY_NAMED_IAM --no-fail-on-empty-changeset
#- aws cloudformation package --template-file template.yml --s3-bucket $SAM_BUCKET --output-template-file outputtemplate.yml

# Deploying CloudWatch if necessary
./devops/deploy-cloud-watch-alarm.sh