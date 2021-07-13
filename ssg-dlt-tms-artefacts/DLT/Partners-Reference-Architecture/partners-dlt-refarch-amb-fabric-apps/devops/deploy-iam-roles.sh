#!/bin/bash

if test -f "./devops/setConfigVariables.sh"; then
    source ./devops/setConfigVariables.sh
fi

if test -f "./setConfigVariables.sh"; then
    source ./setConfigVariables.sh
fi

echo "Creating necessary IAM roles for APPS part of Jumpstart Kit:"
echo "AMB_APPS_REGION="$AMB_APPS_REGION
echo "AMB_APPS_IAM_ROLES_STACK_NAME="$AMB_APPS_IAM_ROLES_STACK_NAME
echo "AMB_APPS_SYNC_DYNAMO_TABLE_NAME="$AMB_APPS_SYNC_DYNAMO_TABLE_NAME
echo "AMB_APPS_SYNC_DYNAMO_TABLE_NAME_PREFIX="$AMB_APPS_SYNC_DYNAMO_TABLE_NAME_PREFIX
echo "AMB_APPS_IAM_PERMISSIONS_BOUNDARY="$AMB_APPS_IAM_PERMISSIONS_BOUNDARY

# CodeBuild roles
echo "AMB_APPS_CLOUDWATCH_IAM_ROLE_NAME="$AMB_APPS_CLOUDWATCH_IAM_ROLE_NAME
echo "AMB_APPS_CODEBUILD_IAM_ROLE_NAME="$AMB_APPS_CODEBUILD_IAM_ROLE_NAME

# SAM Application roles
echo "AMB_APPS_SAM_IAM_ROLE_NAME="$AMB_APPS_SAM_IAM_ROLE_NAME

# The Synchronizer task roles
echo "AMB_APPS_SYNC_ECS_TASK_ROLE_NAME="$AMB_APPS_SYNC_ECS_TASK_ROLE_NAME
echo "AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_NAME="$AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_NAME

# SQS Queue Name
echo "AMB_APPS_SQS_IN_QUEUE_NAME="$AMB_APPS_SQS_IN_QUEUE_NAME

echo "AMB_APPS_STACK_PREFIX="$AMB_APPS_STACK_PREFIX
echo "AMB_APPS_LAMBDA_PREFIX="$AMB_APPS_LAMBDA_PREFIX
echo "AMB_APPS_IAM_ROLES_PREFIX="$AMB_APPS_IAM_ROLES_PREFIX
echo "AMB_APPS_IAM_POLICIES_PREFIX="$AMB_APPS_IAM_POLICIES_PREFIX
echo "AMB_DEVOPS_CHANNEL_S3_BUCKET_NAME_PREFIX="$AMB_DEVOPS_CHANNEL_S3_BUCKET_NAME_PREFIX
echo "AMB_APPS_CODEBUILD_PROJECT_NAME="$AMB_APPS_CODEBUILD_PROJECT_NAME

# Encryption feature params


echo "AMB_APPS_DDB_ACCESS_ROLE_NAME"=$AMB_APPS_DDB_ACCESS_ROLE_NAME

aws cloudformation deploy --region $AMB_APPS_REGION --template-file ./devops/amb-apps-iam-roles-template.yaml --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME \
--parameter-overrides \
StackPrefix=$AMB_APPS_STACK_PREFIX \
LambdaPrefix=$AMB_APPS_LAMBDA_PREFIX \
RolesPrefix=$AMB_APPS_IAM_ROLES_PREFIX \
PoliciesPrefix=$AMB_APPS_IAM_POLICIES_PREFIX \
AMBAppsRegion=$AMB_APPS_REGION \
RepositoryName=$AMB_APPS_REPOSITORY_NAME \
AMBAppsSAMRoleName=$AMB_APPS_SAM_IAM_ROLE_NAME \
AMBAppsCloudWatchEventRoleName=$AMB_APPS_CLOUDWATCH_IAM_ROLE_NAME \
AMBAppsCodeBuildRoleName=$AMB_APPS_CODEBUILD_IAM_ROLE_NAME \
AMBAppsSyncTaskRoleName=$AMB_APPS_SYNC_ECS_TASK_ROLE_NAME \
AMBAppsSyncTaskExecRoleName=$AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_NAME \
AMBAppsECSClusterName=$AMB_APPS_SYNC_CLUSTER_NAME \
AMBSyncDynamoTableName=$AMB_APPS_SYNC_DYNAMO_TABLE_NAME \
AMBAppsSQSInQueueName=$AMB_APPS_SQS_IN_QUEUE_NAME \
AMBAppsSNSProcessingErrorTopicName=$AMB_APPS_SNS_PROCESSING_ERROR_TOPIC_NAME \
ChannelS3BucketPrefix=$AMB_DEVOPS_CHANNEL_S3_BUCKET_NAME_PREFIX \
SyncDynamoDBNamePrefix=$AMB_APPS_SYNC_DYNAMO_TABLE_NAME_PREFIX \
AMBAppsCodeBuildProjectNamePrefix=$AMB_APPS_CODEBUILD_PROJECT_NAME \
BoundaryPolicyARN=$AMB_APPS_AIM_PERMISSIONS_BOUNDARY \
AMBAppsBuildBucketPrefix=$AMB_APPS_BUILD_BUCKET_NAME_PREFIX \
--capabilities CAPABILITY_NAMED_IAM --no-fail-on-empty-changeset

export AMB_APPS_SAM_IAM_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsSAMRoleARN`].OutputValue' --output text)
echo "AMB_APPS_SAM_IAM_ROLE_ARN="$AMB_APPS_SAM_IAM_ROLE_ARN
export AMB_APPS_CLOUDWATCH_IAM_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsCloudWatchEventRoleARN`].OutputValue' --output text)
echo "AMB_APPS_CLOUDWATCH_IAM_ROLE_ARN="$AMB_APPS_CLOUDWATCH_IAM_ROLE_ARN
export AMB_APPS_CODEBUILD_IAM_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsCodeBuildRoleARN`].OutputValue' --output text)
echo "AMB_APPS_CODEBUILD_IAM_ROLE_ARN="$AMB_APPS_CODEBUILD_IAM_ROLE_ARN
export AMB_APPS_SYNC_ECS_TASK_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsSyncTaskRoleARN`].OutputValue' --output text)
echo "AMB_APPS_SYNC_ECS_TASK_ROLE_ARN="$AMB_APPS_SYNC_ECS_TASK_ROLE_ARN
export AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_IAM_ROLES_STACK_NAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsSyncTaskExecRoleARN`].OutputValue' --output text)
echo "AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_ARN="$AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_ARN