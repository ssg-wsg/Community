#!/bin/bash

# export AMB_DEVOPS_CW_STACKNAME=amb-devops-cloudWatch-TestNet
# export AMB_DEVOPS_NETWORK_ID=n-VOL3PLTK2NHZXJXN5QVLARD6RM
# export AMB_DEVOPS_MEMBER_ID=m-27RM4CBVDFFC5DDZYJ534LXUPA

# # Allowed values: "CREATING, AVAILABLE, CREATE_FAILED, DELETING, DELETED, FAILED"
# # You can specify multiple values, like this: "CREATE_FAILED,FAILED" (no spaces!).
# export AMB_DEVOPS_PEER_ALARM_STATUS_LIST="CREATE_FAILED,FAILED"
                                                 
# export AMB_DEVOPS_NOTIFICATION_EMAIL=your@email.com

export AMB_DEVOPS_CW_CF_TEMPLATE_PATH="../amb-devops-peer-healthcheck-alarm-template.yaml"

if test -f "./amb-devops-peer-healthcheck-alarm-template.yaml"; then
    export AMB_DEVOPS_CW_CF_TEMPLATE_PATH="./amb-devops-peer-healthcheck-alarm-template.yaml"
fi

if [ -z "$AMB_DEVOPS_SAM_STACKNAME" ]
then
      export AMB_DEVOPS_SAM_STACKNAME=amb-devops-lambda
fi

echo " "
echo "Deploying CloudWatch alarm for peer healthcheck"
echo "AMB_DEVOPS_SNS_CW_ALARM_TOPIC_NAME="$AMB_DEVOPS_SNS_CW_ALARM_TOPIC_NAME
echo "AMB_DEVOPS_DEPLOY_CW="$AMB_DEVOPS_DEPLOY_CW
echo "AMB_DEVOPS_CW_STACKNAME="$AMB_DEVOPS_CW_STACKNAME
echo "AMB_DEVOPS_NETWORK_ID="$AMB_DEVOPS_NETWORK_ID
echo "AMB_DEVOPS_MEMBER_ID="$AMB_DEVOPS_MEMBER_ID
echo "AMB_DEVOPS_PEER_ALARM_STATUS_LIST="$AMB_DEVOPS_PEER_ALARM_STATUS_LIST
echo "AMB_DEVOPS_NOTIFICATION_EMAIL="$AMB_DEVOPS_NOTIFICATION_EMAIL
echo "AMB_DEVOPS_SAM_STACKNAME="$AMB_DEVOPS_SAM_STACKNAME
echo "AMB_DEVOPS_REGION="$AMB_DEVOPS_REGION
echo "AMB_DEVOPS_CW_CF_TEMPLATE_PATH="$AMB_DEVOPS_CW_CF_TEMPLATE_PATH

if [ "$AMB_DEVOPS_DEPLOY_CW" = true ] ; then

    aws cloudformation deploy --region $AMB_DEVOPS_REGION --template-file $AMB_DEVOPS_CW_CF_TEMPLATE_PATH --stack-name $AMB_DEVOPS_CW_STACKNAME \
    --parameter-overrides AlarmSNSTopicName=$AMB_DEVOPS_SNS_CW_ALARM_TOPIC_NAME \
    AMBDevOpsLambdaFunctionsStackName=$AMB_DEVOPS_SAM_STACKNAME \
    NetworkId=$AMB_DEVOPS_NETWORK_ID \
    MemberId=$AMB_DEVOPS_MEMBER_ID \
    PeerStatus="$AMB_DEVOPS_PEER_ALARM_STATUS_LIST" \
    NotificationEmail=$AMB_DEVOPS_NOTIFICATION_EMAIL \
    --capabilities CAPABILITY_NAMED_IAM --no-fail-on-empty-changeset

fi