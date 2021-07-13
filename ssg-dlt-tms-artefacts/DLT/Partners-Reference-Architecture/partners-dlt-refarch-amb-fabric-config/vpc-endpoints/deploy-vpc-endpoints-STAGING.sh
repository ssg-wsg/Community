#!/bin/bash
#################
# Subnets and routing

# Region where the endpoints should be created
export AMB_APPS_REGION="ap-southeast-1"
# CloudFormaiton Stack name to use during creation
export AMB_APPS_ENDPOINTS_STACK_NAME="amb-apps-vpc-endpoints-staging"
# An ID of the VPC where the endpoints should be created
export AMB_APPS_VPC_ID=""
# An ID of the Security Group, which the end points should be associated with 
# (you may use default as for CodeCommit and CloudFormation endpoints before)
export AMB_APPS_SECURITY_GROUP_ID=""
# IDs of up to three subnets, where the endpoints will be connected to. (Minimum 1)
export AMB_APPS_SUBNET_1_ID=""
export AMB_APPS_SUBNET_2_ID=""
export AMB_APPS_SUBNET_3_ID=""
# IDs of up to three routing tables, that should be used by S3 and DynamoDB endpoints (Minimum 1)
export AMB_APPS_ROUTE_TABLE_1_ID=""
export AMB_APPS_ROUTE_TABLE_2_ID=""
export AMB_APPS_ROUTE_TABLE_3_ID=""


echo " "
echo "Deploying endpoints to APPS VPC"
echo "AMB_APPS_REGION="$AMB_APPS_REGION
echo "AMB_APPS_ENDPOINTS_STACK_NAME="$AMB_APPS_ENDPOINTS_STACK_NAME
echo "AMB_APPS_VPC_ID="$AMB_APPS_VPC_ID
echo "AMB_APPS_SECURITY_GROUP_ID="$AMB_APPS_SECURITY_GROUP_ID
echo "AMB_APPS_SUBNET_1_ID="$AMB_APPS_SUBNET_1_ID
echo "AMB_APPS_SUBNET_2_ID="$AMB_APPS_SUBNET_2_ID
echo "AMB_APPS_SUBNET_3_ID="$AMB_APPS_SUBNET_3_ID
echo "AMB_APPS_ROUTE_TABLE_1_ID="$AMB_APPS_ROUTE_TABLE_1_ID
echo "AMB_APPS_ROUTE_TABLE_2_ID="$AMB_APPS_ROUTE_TABLE_2_ID
echo "AMB_APPS_ROUTE_TABLE_3_ID="$AMB_APPS_ROUTE_TABLE_3_ID


aws cloudformation deploy --region $AMB_APPS_REGION --template-file ./amb-apps-vpc-endpoints-template.yaml --stack-name $AMB_APPS_ENDPOINTS_STACK_NAME \
--parameter-overrides \
AMBAppsVPCId=$AMB_APPS_VPC_ID \
AMBAppsSecurityGroupId=$AMB_APPS_SECURITY_GROUP_ID \
AMBAppsPrivateSubnet1Id=$AMB_APPS_SUBNET_1_ID \
AMBAppsPrivateSubnet2Id=$AMB_APPS_SUBNET_2_ID \
AMBAppsPrivateRouteTable1Id=$AMB_APPS_ROUTE_TABLE_1_ID \
AMBAppsPrivateRouteTable2Id=$AMB_APPS_ROUTE_TABLE_2_ID \
--no-fail-on-empty-changeset