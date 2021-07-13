#!/bin/bash

# export AMB_DEVOPS_CW_STACKNAME=amb-devops-cloudWatch-TestNet
# export AMB_DEVOPS_NETWORK_ID=n-VOL3PLTK2NHZXJXN5QVLARD6RM
# export AMB_DEVOPS_MEMBER_ID=m-27RM4CBVDFFC5DDZYJ534LXUPA

# # Allowed values: "CREATING, AVAILABLE, CREATE_FAILED, DELETING, DELETED, FAILED"
# # You can specify multiple values, like this: "CREATE_FAILED,FAILED" (no spaces!).
# export AMB_DEVOPS_PEER_ALARM_STATUS_LIST="CREATE_FAILED,FAILED"
                                                 
# export AMB_DEVOPS_NOTIFICATION_EMAIL=your@email.com

export AMB_APPS_SAM_S3_TEMPLATE_PATH="../amb-apps-sam-s3-template.yaml"

if test -f "./amb-apps-sam-s3-template.yaml"; then
    export AMB_APPS_SAM_S3_TEMPLATE_PATH="./amb-apps-sam-s3-template.yaml"
fi

echo "AMB_APPS_SAM_STACKNAME"=$AMB_APPS_SAM_STACKNAME

if [ -z "$AMB_APPS_SAM_STACKNAME" ]
then
      export AMB_APPS_SAM_STACKNAME=amb-apps-lambda
fi

echo " "
echo "Deploying deploying S3 bucket for SAM application deployment."
echo "AMB_APPS_REGION="$AMB_APPS_REGION
echo "AMB_APPS_BUILD_BUCKET_NAME_PREFIX="$AMB_APPS_BUILD_BUCKET_NAME_PREFIX


if [ "$AMB_APPS_DEPLOY_SAM_S3_BUCKET" = true ] ; then
    
    aws cloudformation deploy --region $AMB_APPS_REGION --template-file ./amb-apps-sam/amb-apps-sam-s3-template.yaml --stack-name "$AMB_APPS_SAM_STACKNAME-s3" \
    --parameter-overrides AMBAppsSAMBucketName=$AMB_APPS_BUILD_BUCKET_NAME_PREFIX \
    --no-fail-on-empty-changeset

    # Reloading config
    source ./devops/setConfigVariables.sh

fi