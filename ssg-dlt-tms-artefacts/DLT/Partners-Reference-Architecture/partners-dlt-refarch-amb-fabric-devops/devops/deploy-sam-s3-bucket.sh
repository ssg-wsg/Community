#!/bin/bash

# export AMB_DEVOPS_CW_STACKNAME=amb-devops-cloudWatch-TestNet
# export AMB_DEVOPS_NETWORK_ID=n-VOL3PLTK2NHZXJXN5QVLARD6RM
# export AMB_DEVOPS_MEMBER_ID=m-27RM4CBVDFFC5DDZYJ534LXUPA

# # Allowed values: "CREATING, AVAILABLE, CREATE_FAILED, DELETING, DELETED, FAILED"
# # You can specify multiple values, like this: "CREATE_FAILED,FAILED" (no spaces!).
# export AMB_DEVOPS_PEER_ALARM_STATUS_LIST="CREATE_FAILED,FAILED"
                                                 
# export AMB_DEVOPS_NOTIFICATION_EMAIL=your@email.com

export AMB_DEVOPS_SAM_S3_TEMPLATE_PATH="../amb-devops-sam-s3-template.yaml"

if test -f "./amb-devops-sam-s3-template.yaml"; then
    export AMB_DEVOPS_SAM_S3_TEMPLATE_PATH="./amb-devops-sam-s3-template.yaml"
fi

if [ -z "$AMB_DEVOPS_SAM_STACKNAME" ]
then
      export AMB_DEVOPS_SAM_STACKNAME=amb-devops-lambda
fi

echo " "
echo "Deploying deploying S3 bucket for SAM application deployment."
echo "AMB_DEVOPS_REGION="$AMB_DEVOPS_REGION
echo "AMB_DEVOPS_BUILD_BUCKET_NAME_PREFIX="$AMB_DEVOPS_BUILD_BUCKET_NAME_PREFIX


if [ "$AMB_DEVOPS_DEPLOY_SAM_S3_BUCKET" = true ] ; then
    
    aws cloudformation deploy --region $AMB_DEVOPS_REGION --template-file ./devops/amb-devops-sam-s3-template.yaml --stack-name "$AMB_DEVOPS_SAM_STACKNAME-s3" \
    --parameter-overrides AMBDevopsSAMBucketName=$AMB_DEVOPS_BUILD_BUCKET_NAME_PREFIX \
    --no-fail-on-empty-changeset

    # Reloading config
    source ./devops/setConfigVariables.sh

fi