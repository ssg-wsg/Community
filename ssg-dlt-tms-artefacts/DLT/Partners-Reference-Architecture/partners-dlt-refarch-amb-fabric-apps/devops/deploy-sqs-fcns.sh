#!/bin/bash

source ./devops/setConfigVariables.sh

echo "Running Inbound SQS queue and Lambda functions deployment script"

# Temp re-definition from setConfigVariables.sh
# export AMB_APPS_DEPLOY_SQS_IN=true
# export AMB_APPS_SQS_IN_QUEUE_NAME=ambbcinqueue
# export AMB_APPS_SQS_IN_QUEUE_STACKNAME=amb-apps-inqueue-lambda

# End Temp re-definition

cd amb-apps-sam/

# Deploying Inbound SQS queue and Lambda function
echo "AMB_APPS_DEPLOY_SQS_IN="$AMB_APPS_DEPLOY_SQS_IN
if [ "$AMB_APPS_DEPLOY_SQS_IN" = true ] ; then
    echo " "
    echo "Packaging and deploying APPS inbound SQS and lambda"
    echo "AMB_APPS_LAMBDA_PREFIX="$AMB_APPS_LAMBDA_PREFIX
    echo "AMB_APPS_SQS_IN_QUEUE_STACKNAME="$AMB_APPS_SQS_IN_QUEUE_STACKNAME
    echo "AMB_APPS_SQS_IN_QUEUE_NAME="$AMB_APPS_SQS_IN_QUEUE_NAME
    echo "AMB_APPS_SNS_PROCESSING_ERROR_TOPIC_NAME="$AMB_APPS_SNS_PROCESSING_ERROR_TOPIC_NAME
    echo "AMB_APPS_SNS_PROCESSING_ERROR_NOTIFICATION_EMAIL="$AMB_APPS_SNS_PROCESSING_ERROR_NOTIFICATION_EMAIL

    export AMB_APPS_INVOKE_QUERY_FCN_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_SAM_STACKNAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsInvokeQueryFunctionARN`].OutputValue' --output text)
    echo "AMB_APPS_INVOKE_QUERY_FCN_ARN="$AMB_APPS_INVOKE_QUERY_FCN_ARN

    export AMB_APPS_DEPENDENCIES_LAYER_ARN=$(aws cloudformation describe-stacks --stack-name $AMB_APPS_SAM_STACKNAME --region $AMB_APPS_REGION --query 'Stacks[0].Outputs[?OutputKey==`AMBAppsDepsLayerARN`].OutputValue' --output text)
    echo "AMB_APPS_DEPENDENCIES_LAYER_ARN="$AMB_APPS_DEPENDENCIES_LAYER_ARN
    

    sam package --template-file ./amb-apps-sam-inc-sqs-lambda-template.yaml --s3-bucket $SAM_BUCKET > ./template-sl-orig.yaml --kms-key-id $SAM_BUCKET_KMS_KEY
    cat ./template-sl-orig.yaml | sed 's/Uploading.*//' > ./template-incoming-sqs-lambda.yaml
    rm ./template-sl-orig.yaml
    #- pwd && ls -lah && cat ./template.yaml
    #- sam deploy --template-file ./template.yaml --stack-name $AMB_APPS_SAM_STACKNAME
    aws cloudformation deploy --region $AMB_APPS_REGION --template-file ./template-incoming-sqs-lambda.yaml --stack-name $AMB_APPS_SQS_IN_QUEUE_STACKNAME \
    --parameter-overrides \
    DepsLayerARN=$AMB_APPS_DEPENDENCIES_LAYER_ARN \
    AMBAppsLambdaNamePrefix=$AMB_APPS_LAMBDA_PREFIX \
    AMBAppsVPCStackName=$AMB_APPS_VPC_STACKNAME \
    AMBRegionName=$AMB_APPS_REGION \
    AMBAppsInQueueName=$AMB_APPS_SQS_IN_QUEUE_NAME \
    AMBAppsSNSProcessingErrorTopicName=$AMB_APPS_SNS_PROCESSING_ERROR_TOPIC_NAME \
    AMBAppsSNSProcessingErrorNotificationEmail=$AMB_APPS_SNS_PROCESSING_ERROR_NOTIFICATION_EMAIL \
    AMBAppsSAMRoleARN=$AMB_APPS_SAM_IAM_ROLE_ARN \
    AMBAppsInvalidRecordAlarmInvRec=$AMB_APPS_INVALID_RECORD_CW_ALARM_INVALID_REC \
    AMBAppsInvalidRecordAlarmRetry=$AMB_APPS_INVALID_RECORD_CW_ALARM_RETRY \
    AMBAppsInvalidRecordNamespace=$AMB_APPS_INVALID_RECORD_CW_NAMESPACE \
    AMBAppsInvalidRecordMetric=$AMB_APPS_INVALID_RECORD_CW_METRIC \
    InvokeQueryFunctionARN=$AMB_APPS_INVOKE_QUERY_FCN_ARN \
     --no-fail-on-empty-changeset
fi

cd ..