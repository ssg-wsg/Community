#!/bin/bash

source ./devops/setConfigVariables.sh

echo " "
echo "Running The Synchronizer deployment script"

cd app-the-synchronizer/

if [ "$AMB_APPS_DEPLOY_SYNC" = true ] ; then
    echo " "
    echo "Deploying The Synchronizer with the following configuration parameters:"
    echo "AMB_APPS_SYNC_STACKNAME="$AMB_APPS_SYNC_STACKNAME
    echo "AMB_APPS_SYNC_CONTAINER_NAME_PREFIX="$AMB_APPS_SYNC_CONTAINER_NAME_PREFIX
    echo "AMB_APPS_SYNC_CLUSTER_NAME="$AMB_APPS_SYNC_CLUSTER_NAME
    echo "AMB_APPS_SYNC_IS_MASTER="$AMB_APPS_SYNC_IS_MASTER
    echo "AMB_APPS_SYNC_LOG_LEVEL="$AMB_APPS_SYNC_LOG_LEVEL
    echo "AMB_APPS_SYNC_BC_NETWORK_ID="$AMB_APPS_SYNC_BC_NETWORK_ID
    echo "AMB_APPS_SYNC_BC_MEMBER_ID="$AMB_APPS_SYNC_BC_MEMBER_ID
    echo "AMB_APPS_SYNC_BC_USER_NAME="$AMB_APPS_SYNC_BC_USER_NAME
    echo "AMB_APPS_SYNC_BC_CHANNEL_NAME="$AMB_APPS_SYNC_BC_CHANNEL_NAME
    echo "AMB_APPS_SYNC_BC_PEER_ID="$AMB_APPS_SYNC_BC_PEER_ID
    echo "AMB_APPS_SYNC_BC_START_BLOCK="$AMB_APPS_SYNC_BC_START_BLOCK
    echo "AMB_APPS_SYNC_BC_END_BLOCK="$AMB_APPS_SYNC_BC_END_BLOCK
    echo "AMB_APPS_SYNC_BC_MAX_EVENT_HUB_RETRIES="$AMB_APPS_SYNC_BC_MAX_EVENT_HUB_RETRIES
    echo "AMB_APPS_SYNC_DYNAMO_TABLE_NAME="$AMB_APPS_SYNC_DYNAMO_TABLE_NAME
    echo "AMB_APPS_SYNC_DYNAMO_PROFILE_NAME="$AMB_APPS_SYNC_DYNAMO_PROFILE_NAME
    echo "AMB_APPS_SYNC_DYNAMO_REGION="$AMB_APPS_SYNC_DYNAMO_REGION
    echo "AMB_APPS_SYNC_DYNAMO_PAGINATION_INDEX="$AMB_APPS_SYNC_DYNAMO_PAGINATION_INDEX
    echo "ECR_REPOSITORY_ARN="$ECR_REPOSITORY_ARN
    echo "AMB_APPS_REGION="$AMB_APPS_REGION
    echo "AMB_APPS_SECURITY_GROUP_ID="$AMB_APPS_SECURITY_GROUP_ID
    echo "AMB_APPS_PRIVATE_SUBNET1_ID="$AMB_APPS_PRIVATE_SUBNET1_ID
    echo "AMB_APPS_PRIVATE_SUBNET2_ID="$AMB_APPS_PRIVATE_SUBNET2_ID
    echo "AMB_APPS_PRIVATE_SUBNET3_ID="$AMB_APPS_PRIVATE_SUBNET3_ID
    echo "AMB_APPS_SYNC_ECS_TASK_ROLE_ARN="$AMB_APPS_SYNC_ECS_TASK_ROLE_ARN
    echo "AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_ARN="$AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_ARN


    aws cloudformation deploy --region $AMB_APPS_REGION --template-file ./amb-app-synchronizer-template.yaml --stack-name $AMB_APPS_SYNC_STACKNAME \
    --parameter-overrides \
    AMBAppsECSClusterName=$AMB_APPS_SYNC_CLUSTER_NAME \
    AMBAppsContainerNamePrefix=$AMB_APPS_SYNC_CONTAINER_NAME_PREFIX \
    AMBAppsSecurityGroupID=$AMB_APPS_SECURITY_GROUP_ID \
    AMBAppsPrivateSubnet1ID=$AMB_APPS_PRIVATE_SUBNET1_ID \
    AMBAppsPrivateSubnet2ID=$AMB_APPS_PRIVATE_SUBNET2_ID \
    AMBAppsPrivateSubnet3ID=$AMB_APPS_PRIVATE_SUBNET3_ID \
    AMBAppsECRRepositoryARN=$ECR_REPOSITORY_ARN \
    AMBSyncIsMaster=$AMB_APPS_SYNC_IS_MASTER \
    AMBSyncLogLevel=$AMB_APPS_SYNC_LOG_LEVEL \
    AMBSyncNetworkId=$AMB_APPS_SYNC_BC_NETWORK_ID \
    AMBSyncMemberId=$AMB_APPS_SYNC_BC_MEMBER_ID \
    AMBSyncUserName=$AMB_APPS_SYNC_BC_USER_NAME \
    AMBSyncChannelName=$AMB_APPS_SYNC_BC_CHANNEL_NAME \
    AMBSyncPeerId=$AMB_APPS_SYNC_BC_PEER_ID \
    AMBSyncStartBlock=$AMB_APPS_SYNC_BC_START_BLOCK \
    AMBSyncEndBlock=$AMB_APPS_SYNC_BC_END_BLOCK \
    AMBSyncMaxHubRetries=$AMB_APPS_SYNC_BC_MAX_EVENT_HUB_RETRIES \
    AMBSyncDynamoTableName=$AMB_APPS_SYNC_DYNAMO_TABLE_NAME \
    AMBSyncDynamoProfileName=$AMB_APPS_SYNC_DYNAMO_PROFILE_NAME \
    AMBSyncDynamoRegion=$AMB_APPS_SYNC_DYNAMO_REGION \
    AMBSyncDynamoPaginationIndex=$AMB_APPS_SYNC_DYNAMO_PAGINATION_INDEX \
    AMBAppsECRRepositoryRegion=$AMB_APPS_REGION \
    AMBAppsSyncTaskRoleARN=$AMB_APPS_SYNC_ECS_TASK_ROLE_ARN \
    AMBAppsSyncTaskExecRoleARN=$AMB_APPS_SYNC_ECS_TASK_EXEC_ROLE_ARN \
    --capabilities CAPABILITY_NAMED_IAM --no-fail-on-empty-changeset

    echo " "
    echo "Building The Synchronizer app image"
    $(aws ecr get-login --no-include-email --region $AMB_APPS_REGION)

    # Enabling on-push image scanning for ECR repository
    export ECR_REPOSITORY_NAME=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_SYNC_STACKNAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsECRRepositoryName`].OutputValue' --output text)
    aws ecr put-image-scanning-configuration --repository-name $ECR_REPOSITORY_NAME --image-scanning-configuration scanOnPush=true --region $AMB_APPS_REGION

    export ECR_REPOSITORY_URI=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_SYNC_STACKNAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsECRRepositoryURL`].OutputValue' --output text)

    export TAG="synch$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | head -c 8)"
    export IMAGE_URI="${ECR_REPOSITORY_URI}:${TAG}"

    echo "TAG="$TAG
    echo "IMAGE_URI="$IMAGE_URI

    cp -r ../dependencies/nodejs/lib .
    ls -lah
    docker build --tag "$IMAGE_URI" .

    echo " "
    echo "Pushing the Synchronizer app image to: $ECR_REPOSITORY_URI:latest"
    docker push "$IMAGE_URI"
    docker tag "$IMAGE_URI" "${ECR_REPOSITORY_URI}:latest"
    docker push "${ECR_REPOSITORY_URI}:latest"
    printf '[{"name":"amb-app-the-synchronizer-container","imageUri":"%s"}]' "$IMAGE_URI" > images.json
fi

cd ..