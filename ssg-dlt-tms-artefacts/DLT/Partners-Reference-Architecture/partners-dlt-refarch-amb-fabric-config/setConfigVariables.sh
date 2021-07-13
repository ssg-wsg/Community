#!/bin/bash

# Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# This file is licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License. A copy of
# the License is located at
#
# http://aws.amazon.com/apache2.0/
#
# This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.


#################### CHANGE THESE ###########################
#
# Change these variables to match your own configuration

export AMB_NETWORK_ID=n-XXX
export AMB_MEMBER_ID=m-XXX
export AMB_NODE_ID=nd-XXX
export AMB_REGION=ap-southeast-1

#################### END CHANGE THESE ###########################

#################### SETUP ###########################
export AMB_SETUP_STACK_NAME=Ssg-Tgs-Prn-Amb-setup-tools
export AMB_SETUP_REGION=$AMB_REGION

export AMB_SETUP_APPS_FOLDER=partners-dlt-refarch-amb-fabric-apps
export AMB_SETUP_CONFIG_FOLDER=partners-dlt-refarch-amb-fabric-config
export AMB_SETUP_DEVOPS_FOLDER=partners-dlt-refarch-amb-fabric-devops
export AMB_SETUP_LIBS_FOLDER=partners-dlt-refarch-amb-fabric-shared-libs
export AMB_SETUP_CC_FOLDER=partners-dlt-refarch-amb-fabric-cc-js

export AMB_DEVOPS_REPOSITORY_NAME=partners-dlt-refarch-amb-fabric-devops
export AMB_APPS_REPOSITORY_NAME=partners-dlt-refarch-amb-fabric-apps
export AMB_LIBS_REPOSITORY_NAME=partners-dlt-refarch-amb-fabric-shared-libs
export AMB_SETUP_REPOSITORY_NAME=partners-dlt-refarch-amb-fabric-config
export AMB_CC_REPOSITORY_NAME=partners-dlt-refarch-amb-fabric-cc-js


# Exporting repository URLs for code pipeline
# To be configured manually if skipping 1.create-codecommit-repos.sh
export AMB_LIBS_REPOSITORY_HTTP_URL="https://git-codecommit.ap-southeast-1.amazonaws.com/v1/repos/partners-dlt-refarch-amb-fabric-shared-libs"
export AMB_SETUP_REPOSITORY_HTTP_URL="https://git-codecommit.ap-southeast-1.amazonaws.com/v1/repos/partners-dlt-refarch-amb-fabric-config"

#################### APPS ###########################
# Naming prefixes
export AMB_APPS_STACK_PREFIX="Cfs-Ssg-Tgs-Prn-Apps" 
export AMB_APPS_IAM_ROLES_PREFIX="Role-Ssg-Tgs-Prn-Apps" 
export AMB_APPS_IAM_POLICIES_PREFIX="Policy-Ssg-Tgs-Prn-Apps"

# CodeBuild deployment config
export AMB_APPS_REGION=$AMB_REGION
export AMB_APPS_CODEBUILD_PROJECT_NAME="Cb-Ssg-Tgs-Prn-amb-apps-build"
export AMB_APPS_BRANCH_NAME=master

# IAM Roles for Apps deployment
export AMB_APPS_REGION=$AMB_REGION
export AMB_APPS_IAM_ROLES_STACK_NAME=$AMB_APPS_STACK_PREFIX-iam-roles
export AMB_APPS_CLOUDWATCH_IAM_ROLE_NAME=$AMB_APPS_IAM_ROLES_PREFIX-cloudwatch-role
export AMB_APPS_CODEBUILD_IAM_ROLE_NAME=$AMB_APPS_IAM_ROLES_PREFIX-codebuild-role
export AMB_APPS_IAM_PERMISSIONS_BOUNDARY=
# SAM Application roles
export AMB_APPS_SAM_IAM_ROLE_NAME=$AMB_APPS_IAM_ROLES_PREFIX-sam-role
export AMB_APPS_DDB_ACCESS_ROLE_NAME=$AMB_APPS_IAM_ROLES_PREFIX-ddb-access-role
# The Synchronizer task roles
export AMB_APPS_SYNC_ECS_TASK_ROLE_NAME=$AMB_APPS_IAM_ROLES_PREFIX-sync-ecs-task-role
export AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_NAME=$AMB_APPS_IAM_ROLES_PREFIX-sync-ecs-task-exec-role
# API Gateway roles
export AMB_APPS_APIGW_CLOUDWATCH_ROLE_NAME=$AMB_APPS_IAM_ROLES_PREFIX-apigw-cloudwatch-role

# Exporting IAM Roles if they exist. Replace with hardcoded values if deply manually
echo " "
echo "=== Checking if $AMB_APPS_IAM_ROLES_STACK_NAME stack exists ..."
if aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].StackStatus' --output text ; then
    echo "=== $AMB_APPS_IAM_ROLES_STACK_NAME stack exists. Initalizing"
    export AMB_APPS_SAM_IAM_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsSAMRoleARN`].OutputValue' --output text)
    export AMB_APPS_CLOUDWATCH_IAM_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsCloudWatchEventRoleARN`].OutputValue' --output text)
    export AMB_APPS_CODEBUILD_IAM_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsCodeBuildRoleARN`].OutputValue' --output text)
    export AMB_APPS_SYNC_ECS_TASK_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsSyncTaskRoleARN`].OutputValue' --output text)
    export AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsSyncTaskExecRoleARN`].OutputValue' --output text)
    export AMB_APPS_APIGW_CLOUDWATCH_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsAPIGWCloudWatchRoleARN`].OutputValue' --output text)
fi

# APPS VPC deployment config
export AMB_APPS_DEPLOY_VPC=false
AMB_NETWORK_ID_LC=$(echo $AMB_NETWORK_ID | tr '[:upper:]' '[:lower:]')
export AMB_APPS_AMB_ENDPOINT_NAME="com.amazonaws.${AMB_REGION}.managedblockchain.${AMB_NETWORK_ID_LC}"
export AMB_APPS_VPC_STACKNAME=$AMB_APPS_STACK_PREFIX-vpc

# Common networking config for all Apps
# Exporting networking. Replace with hardcoded values if deply manually
echo " "
echo "=== Checking if $AMB_APPS_VPC_STACKNAME stack exists ..."
if aws cloudformation describe-stacks --stack-name $AMB_APPS_VPC_STACKNAME --region $AMB_SETUP_REGION --query 'Stacks[0].StackStatus' --output text ; then
    echo "=== $AMB_APPS_VPC_STACKNAME stack exists. Initalizing"
    echo "########################################################################################################"
    echo "# Retrieving networking configuration for APPS. Please ignore access denied errors if deploying DEVOPS #"
    echo "########################################################################################################"
    # NOTE: In case you are skipping VPC deployment, pelase make sure you assigned 
    # existing values for Security Group Id and Private Subnets:
    export AMB_APPS_SECURITY_GROUP_ID=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_VPC_STACKNAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsSecurityGroupID`].OutputValue' --output text)
    export AMB_APPS_PRIVATE_SUBNET1_ID=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_VPC_STACKNAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsPrivateSubnet1ID`].OutputValue' --output text)
    export AMB_APPS_PRIVATE_SUBNET2_ID=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_VPC_STACKNAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsPrivateSubnet2ID`].OutputValue' --output text)
    export AMB_APPS_PRIVATE_SUBNET3_ID=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_VPC_STACKNAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsPrivateSubnet3ID`].OutputValue' --output text)
fi

# Manually overwrite VPC settings 
export AMB_APPS_SECURITY_GROUP_ID=sg-XXX            
export AMB_APPS_PRIVATE_SUBNET1_ID=subnet-XXX              
export AMB_APPS_PRIVATE_SUBNET2_ID=
export AMB_APPS_PRIVATE_SUBNET3_ID=

# Severless Applictions deployment config
export AMB_APPS_SAM_STACKNAME=$AMB_APPS_STACK_PREFIX-lambda
export AMB_APPS_LAMBDA_PREFIX="Lambda-Ssg-Tgs-Prn-Apps"
export AMB_APPS_INVOKE_QUERY_FCN_RESERVED_CONCURRENCY=34 # This way you can throttle transactions rate, sent to AMB service
export AMB_APPS_BUILD_BUCKET_NAME_PREFIX="sst-s3-ssg-tgs-prn-amb-apps-build"

# Set this to true if you are setting things up without code pipeline 
export AMB_APPS_DEPLOY_SAM_S3_BUCKET="true"

# Fargate with The Synchronizer app deployment config
export AMB_APPS_DEPLOY_SYNC=true
export AMB_APPS_SYNC_STACKNAME=$AMB_APPS_STACK_PREFIX-sychronizer
export AMB_APPS_SYNC_CLUSTER_NAME=$AMB_APPS_SYNC_STACKNAME
export AMB_APPS_SYNC_CONTAINER_NAME_PREFIX="Ecs-Ssg-Tgs-Prn"
export AMB_APPS_SYNC_IS_MASTER=false
export AMB_APPS_SYNC_LOG_LEVEL=debug
export AMB_APPS_SYNC_BC_NETWORK_ID=$AMB_NETWORK_ID
export AMB_APPS_SYNC_BC_MEMBER_ID=$AMB_MEMBER_ID
export AMB_APPS_SYNC_BC_USER_NAME=admin
export AMB_APPS_SYNC_BC_CHANNEL_NAME=testnet
export AMB_APPS_SYNC_BC_PEER_ID=$AMB_NODE_ID
export AMB_APPS_SYNC_BC_START_BLOCK=-1
export AMB_APPS_SYNC_BC_END_BLOCK=-1
export AMB_APPS_SYNC_BC_MAX_EVENT_HUB_RETRIES=10
export AMB_APPS_SYNC_DYNAMO_TABLE_NAME_PREFIX="Dbs-Dynamodb-Ssg-Tgs-Prndb"
export AMB_APPS_SYNC_DYNAMO_TABLE_NAME=$AMB_APPS_SYNC_DYNAMO_TABLE_NAME_PREFIX-$AMB_APPS_SYNC_BC_CHANNEL_NAME-WriteSet
export AMB_APPS_SYNC_DYNAMO_PROFILE_NAME=default
export AMB_APPS_SYNC_DYNAMO_REGION=$AMB_REGION
export AMB_APPS_SYNC_DYNAMO_PAGINATION_INDEX=docType-index

# Deploy SQS inbound and/or outbound
export AMB_APPS_DEPLOY_SQS_IN=true

export AMB_APPS_SQS_IN_QUEUE_NAME=Sqs-Ssg-Tgs-Prn-ambbcinqueue
export AMB_APPS_SQS_IN_QUEUE_STACKNAME=$AMB_APPS_STACK_PREFIX-inqueue-lambda
export AMB_APPS_SNS_PROCESSING_ERROR_TOPIC_NAME=Ssg-Tgs-Prn-Amb-ambprocesserror
export AMB_APPS_SNS_PROCESSING_ERROR_NOTIFICATION_EMAIL=

export AMB_APPS_INVALID_RECORD_CW_ALARM_INVALID_REC=Cwa-Ssg-Tgs-Prn-InvalidDltRecord
export AMB_APPS_INVALID_RECORD_CW_ALARM_RETRY=Cwa-Ssg-Tgs-Prn-DltRetry
export AMB_APPS_INVALID_RECORD_CW_NAMESPACE="custom/DltRecords"
export AMB_APPS_INVALID_RECORD_CW_METRIC="Metric-Ssg-Tgs-Prn-DltRecords"

#################### DEVOPS ###########################
# Naming prefixes
export AMB_DEVOPS_STACK_PREFIX="Cfs-Ssg-Tgs-Prn-DevOps"
export AMB_DEVOPS_CHANNEL_S3_BUCKET_NAME_PREFIX=

# CodeBuild deployment config
export AMB_DEVOPS_REGION=$AMB_REGION
export AMB_DEVOPS_BUILD_BUCKET_NAME_PREFIX="sst-s3-ssg-tgs-prn-amb-devops-build"
export AMB_DEVOPS_CODEBUILD_PROJECT_NAME="Cb-Ssg-Tgs-Prn-amb-devops-build"
export AMB_DEVOPS_BRANCH_NAME=master

# IAM Roles for DevOps deployment
export AMB_DEVOPS_IAM_ROLES_PREFIX="Role-Ssg-Tgs-Prn-DevOps"
export AMB_DEVOPS_IAM_POLICIES_PREFIX="Policy-Ssg-Tgs-Prn-DevOps"
export AMB_DEVOPS_IAM_ROLES_STACK_NAME=$AMB_DEVOPS_STACK_PREFIX-iam-roles
export AMB_DEVOPS_CLOUDWATCH_IAM_ROLE_NAME=$AMB_DEVOPS_IAM_ROLES_PREFIX-cloudwatch-role
export AMB_DEVOPS_CODEBUILD_IAM_ROLE_NAME=$AMB_DEVOPS_IAM_ROLES_PREFIX-codebuild-role
export AMB_DEVOPS_SAM_IAM_ROLE_NAME=$AMB_DEVOPS_IAM_ROLES_PREFIX-sam-role
export AMB_DEVOPS_CHANNEL_S3_IAM_JOINER_ROLE_NAME=$AMB_DEVOPS_IAM_ROLES_PREFIX-sam-role
export AMB_DEVOPS_IAM_PERMISSIONS_BOUNDARY=$AMB_APPS_IAM_PERMISSIONS_BOUNDARY

# IAM Roles ARNs Exported
# Exporting IAM Roles if they exist. Replace with hardcoded values if deply manually
echo " "
echo "=== Checking if $AMB_DEVOPS_IAM_ROLES_STACK_NAME stack exists ..."
if aws cloudformation describe-stacks --stack-name $AMB_DEVOPS_IAM_ROLES_STACK_NAME --region $AMB_DEVOPS_REGION --query 'Stacks[0].StackStatus' --output text ; then
    echo "=== $AMB_DEVOPS_IAM_ROLES_STACK_NAME stack exists. Initalizing"
    export AMB_DEVOPS_SAM_IAM_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_DEVOPS_IAM_ROLES_STACK_NAME --region $AMB_DEVOPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBDevOpsSAMRoleARN`].OutputValue' --output text)
    export AMB_DEVOPS_CLOUDWATCH_IAM_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_DEVOPS_IAM_ROLES_STACK_NAME --region $AMB_DEVOPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBDevOpsCloudWatchEventRoleARN`].OutputValue' --output text)
    export AMB_DEVOPS_CODEBUILD_IAM_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_DEVOPS_IAM_ROLES_STACK_NAME --region $AMB_DEVOPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBDevOpsCodeBuildRoleARN`].OutputValue' --output text)
fi

# VPC Endpoint deployment config
export AMB_DEVOPS_DEPLOY_VPC=false
export AMB_DEVOPS_AMB_ENDPOINT_NAME="com.amazonaws.${AMB_REGION}.managedblockchain.${AMB_NETWORK_ID_LC}"
export AMB_DEVOPS_VPC_STACKNAME=$AMB_DEVOPS_STACK_PREFIX-vpc

# Severless Applictions deployment config
# Exporting networking details if they exist. Replace with hardcoded values if deply manually
export AMB_DEVOPS_SAM_STACKNAME=$AMB_DEVOPS_STACK_PREFIX-lambda
export AMB_DEVOPS_LAMBDA_PREFIX="Lambda-Ssg-Tgs-Prn-DevOps"

# Set this to true if you are setting things up without code pipeline 
export AMB_DEVOPS_DEPLOY_SAM_S3_BUCKET="true"

# If regions for Lambda deployment is different, create a new bucket in the Lambda's region
if [ "$AMB_SETUP_REGION" != "$AMB_DEVOPS_REGION" ]
then
    echo " "
    echo "Looks like we are deploying SAM application into a different region. Creating an S3 bucket for that"
    export AMB_DEVOPS_DEPLOY_SAM_S3_BUCKET="true"
fi

echo " "
echo "=== Checking if $AMB_DEVOPS_VPC_STACKNAME stack exists ..."
if aws cloudformation describe-stacks --stack-name $AMB_DEVOPS_VPC_STACKNAME --region $AMB_SETUP_REGION --query 'Stacks[0].StackStatus' --output text ; then
    echo "=== $AMB_DEVOPS_VPC_STACKNAME stack exists. Initalizing"
    echo "########################################################################################################"
    echo "# Retrieving networking configuration for DEVOPS. Please ignore access denied errors if deploying APPS #"
    echo "########################################################################################################"
    # NOTE: In case you are skipping VPC deployment, pelase make sure you assigned 
    # existing values for Security Group Id and Private Subnets:
    export AMB_DEVOPS_SECURITY_GROUP_ID=$(aws cloudformation describe-stacks --stack-name $AMB_DEVOPS_VPC_STACKNAME --region $AMB_DEVOPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBDevOpsSecurityGroupID`].OutputValue' --output text)
    export AMB_DEVOPS_PRIVATE_SUBNET1_ID=$(aws cloudformation describe-stacks --stack-name $AMB_DEVOPS_VPC_STACKNAME --region $AMB_DEVOPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBDevOpsPrivateSubnet1ID`].OutputValue' --output text)
    export AMB_DEVOPS_PRIVATE_SUBNET2_ID=$(aws cloudformation describe-stacks --stack-name $AMB_DEVOPS_VPC_STACKNAME --region $AMB_DEVOPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBDevOpsPrivateSubnet2ID`].OutputValue' --output text)
    export AMB_DEVOPS_PRIVATE_SUBNET3_ID=$(aws cloudformation describe-stacks --stack-name $AMB_DEVOPS_VPC_STACKNAME --region $AMB_DEVOPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBDevOpsPrivateSubnet3ID`].OutputValue' --output text)
    #export AMB_DEVOPS_FCN_RESERVED_CONCURRENCY=1
fi

export AMB_DEVOPS_SECURITY_GROUP_ID=sg-XXX
export AMB_DEVOPS_PRIVATE_SUBNET1_ID=subnet-XXX
export AMB_DEVOPS_PRIVATE_SUBNET2_ID=
export AMB_DEVOPS_PRIVATE_SUBNET3_ID=

# Setting CloudWatch Alarm for a specific network
export AMB_DEVOPS_DEPLOY_CW=true
export AMB_DEVOPS_NETWORK_ID=$AMB_NETWORK_ID
export AMB_DEVOPS_MEMBER_ID=$AMB_MEMBER_ID
export AMB_DEVOPS_CW_STACKNAME_PREFIX=$AMB_DEVOPS_STACK_PREFIX
export AMB_DEVOPS_CW_STACKNAME=$AMB_DEVOPS_CW_STACKNAME_PREFIX-$AMB_DEVOPS_MEMBER_ID
export AMB_DEVOPS_CW_ALARM_NAME_PREFIX="Cwl-Ssg-Tgs-Prn"
export AMB_DEVOPS_SNS_CW_ALARM_TOPIC_NAME_PREFIX=$AMB_DEVOPS_STACK_PREFIX
export AMB_DEVOPS_SNS_CW_ALARM_TOPIC_NAME=$AMB_DEVOPS_SNS_CW_ALARM_TOPIC_NAME_PREFIX-cloudWatch-$AMB_DEVOPS_MEMBER_ID
# Allowed values: "CREATING, AVAILABLE, CREATE_FAILED, DELETING, DELETED, FAILED"
# You can specify multiple values, like this: "CREATE_FAILED,FAILED" (no spaces!).
export AMB_DEVOPS_PEER_ALARM_STATUS_LIST="CREATE_FAILED,FAILED"
export AMB_DEVOPS_NOTIFICATION_EMAIL=