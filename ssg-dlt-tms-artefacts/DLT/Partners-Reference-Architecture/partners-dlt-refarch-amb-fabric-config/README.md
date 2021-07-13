# AMB-Config

This repository contains configuration for devops and applications deployment.

```
.
├── README.md                              <-- This file
├── setConfigVariables.sh                  <-- Script for setting the configuration environment variables for devops and apps deployment.
├── FAQ.md                                 <-- Deployment FAQs.
├── vpc-endpoints                          <-- Folder with vpc endpoint template and script.
│   └── amb-apps-vpc-endpoints-template.yaml <-- A sample Cloud Formation template for deploying VPC Endpoints.
│   └── deploy-vpc-endpoints-STAGING.sh <-- A sample script for deploying vpc endpoints.
```
DEPLOYMENT WITHOUT CODEPIPELINE

There are situations when you might need to deploy Devops components on AWS without provisioning CodeCommit repositories and setting up CodePipelines.

## Prerequisites

1. You will need a Setup Machine with Amazon Linux 2 (recommended to use Amazon EC2 t3.micro and above instance with Amazon Linux 2 AMI) with the following:
   - User with Admin rights and SSH access
   - Internet connectivity (should work in the Default VPC)
   - AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/install-linux-al2017.html
   - SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-linux.html
   - NodeJS version 10.x (recommended to install with nvm: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html )
   - (Optional) Git CLI (in case you will clone the code from this repo directly to the setup machine): https://git-scm.com/downloads
   - (Optional) Docker version 18.06+ (if you are planning to install The Synchronizer):
        ```
        $ sudo yum update -y
        $ sudo yum install -y docker
        $ sudo service docker start
        ```
2. Please make sure the Amazon Managed Blockchain service for Hyperledger Fabric is provisioned in your account. For guidance, please refer to this document: https://docs.aws.amazon.com/managed-blockchain/latest/managementguide/create-network.html and note down:
   - Network Id
   - Member Id
   - AMB VPC endpoint service name
3. Please login to AWS CLI on your Setup Machine with admin credentials by running `aws configure`

### I. General Setup

1. Copy or clone the following repositories to your Setup Machine:
   - partners-dlt-refarch-amb-fabric-shared-libs
   - partners-dlt-refarch-amb-fabric-config
   - partners-dlt-refarch-amb-fabric-devops
   - partners-dlt-refarch-amb-fabric-apps
2. Modify the following minimal set of parameters to suite your environment in `partners-dlt-refarch-amb-fabric-config/setConfigVariables.sh` file:
   - For DevOps:
    - `AMB_DEVOPS_REGION` set to the AWS region where you have provisioned Amazon Managed Blockchain service
    - `AMB_DEVOPS_AMB_ENDPOINT_NAME`
  - For Apps:
    - `AMB_APPS_REGION` set to the AWS region where you have provisioned Amazon Managed Blockchain service
    - `AMB_APPS_AMB_ENDPOINT_NAME`
    - (Optional, for The Synchronizer):
      - `AMB_APPS_DEPLOY_SYNC`  set to `true`
      - `AMB_APPS_SYNC_BC_NETWORK_ID`
      - `AMB_APPS_SYNC_BC_MEMBER_ID`
      - `AMB_APPS_SYNC_BC_CHANNEL_NAME`
    - (Optional, to deploy SQS InQueue)
      - `AMB_APPS_DEPLOY_SQS_IN`  set to `true`
  - In case you would like to deploy a standard VPC, set the following variable:
    - `AMB_DEVOPS_DEPLOY_VPC=true`
    - `AMB_DEVOPS_AMB_ENDPOINT_NAME` holds a string value with the name of the Amazon Managed Blockchain VPC Endpoint Service. You can find the VPC Endpoint Service name in the [Amazon Managed Blockchain Service console](https://console.aws.amazon.com/managedblockchain/home) under `Networks > NETWORK_NAME > Details tab > VPC endpoint service name`
  - If you would like to deploy into an existing VPC, check that the following requirements are met:
    - VPC has DNS resolution and DNS hostnames enabled
    - Endpoints for the following services are available from the VPC Subnets:
      - Amazon Managed Blockchain Service (see instructions in https://docs.aws.amazon.com/managed-blockchain/latest/managementguide/get-started-create-endpoint.html )
      - Secrets Manager (`com.amazonaws.${AWS::Region}.secretsmanager`)
      - Systems Manager (`com.amazonaws.${AWS::Region}.ssm`)
      - S3 (`com.amazonaws.${AWS::Region}.s3`)
      - CloudWatch (`com.amazonaws.${AWS::Region}.logs`)
        - If you are deploying the synchronizer, you would need to create endpoints for the following:
          - Dynamo DB (`com.amazonaws.${AWS::Region}.ssm`)
          - ECR (`com.amazonaws.${AWS::Region}.ecr.dkr, com.amazonaws.${AWS::Region}.ecr.api`)
          - EC2 (`com.amazonaws.${AWS::Region}.ec2`)
    - If all good, set the following variables:
      - `AMB_DEVOPS_DEPLOY_VPC=false`
      - `AMB_DEVOPS_SECURITY_GROUP_ID=<YOUR_SECURITY_GROUP_ID>`
      - `AMB_DEVOPS_PRIVATE_SUBNET1_ID=<YOUR_SUBNET1_ID>`  
      - `AMB_DEVOPS_PRIVATE_SUBNET2_ID=<YOUR_SUBNET2_ID>`
      - `AMB_DEVOPS_PRIVATE_SUBNET3_ID=<YOUR_SUBNET3_ID>`

> Currently, we only support High availability with 2 subnets.
> The template file to create a new VPC will automatically provision the endpoints as well. 
> However, if an existing VPC is re-used, the above endpoints have to be created manually. 

### Security Groups:
There are 2 security groups required for the entire setup: 
   - Security Group 1: specific to the AMB network's VPC endpoint which only allows ports 30000 - 34000 (as explained here: https://docs.aws.amazon.com/managed-blockchain/latest/managementguide/managed-blockchain-security-sgs.html)
   - Security Group 2: specific to the other endpoints used within the VPC housing the components used in the apps and devops stacks 

Security Group 1 allows for communication between the Invoke-Query lambda and the Managed blockchain components like CA, Orderer, Peers etc.
Security Group 2 allows for communication between all the components in the apps and devops stacks; denoted as `AMB_APPS_SECURITY_GROUP_ID` and `AMB_DEVOPS_SECURITY_GROUP_ID`.

```
Security Group 2 Inbound rules:
Type            Protocol    Port range  Source          Description - optional
All traffic	    All	        All	        Sec-grp-2	    Ingress from other containers in the same security group

Security Group 2 Outbound rules:
Type            Protocol    Port range  Source          Description - optional
All traffic	    All	        All	        0.0.0.0/0       -
```


3. Copy `partners-dlt-refarch-amb-fabric-config/setConfigVariables.sh` file to `devops` folder of respective repository:
   - For Apps: `cp ./setConfigVariables.sh ../partners-dlt-refarch-amb-fabric-apps/devops`
   - For Devops: `cp ./setConfigVariables.sh ../partners-dlt-refarch-amb-fabric-devops/devops`

4. The `partners-dlt-refarch-amb-fabric-shared-libs/lib/hlf-cli` folder contains binaries and the `partners-dlt-refarch-amb-fabric-devops/devops` and `partners-dlt-refarch-amb-fabric-apps/devops/` folders contain Sh files. 
   Before executing the next steps, make sure to enable the execution rights for these files (chmod + x). 

### II. Deploying DevOps

1. To set up DevOps, change directory to `cd ../partners-dlt-refarch-amb-fabric-devops/`
2. Copy  directory from `partners-dlt-refarch-amb-fabric-shared-libs/lib/` to the following two paths: 
     - `cp ../partners-dlt-refarch-amb-fabric-shared-libs/lib .`
     - `cp -r ../partners-dlt-refarch-amb-fabric-shared-libs/lib ./devops` 
3. Run `./devops/deploy-iam-roles.sh` to create IAM roles
4. Run `./devops/build.sh` to build devops Lambda functions
5.  Run `./devops/deploy.sh` to deploy a DevOps VPC and all necessary Lambda functions


### III. Deploying Apps

9. To set up Apps, change directory to `cd ../partners-dlt-refarch-amb-fabric-apps/`
10. Copy  directory from `partners-dlt-refarch-amb-fabric-shared-libs/lib/` to the following two paths: 
     - `cp ../partners-dlt-refarch-amb-fabric-shared-libs/lib .`
     - `cp -r ../partners-dlt-refarch-amb-fabric-shared-libs/lib ./devops`
11. Run `./devops/deploy-iam-roles.sh` to create IAM roles
12. Run `./devops/build.sh` to build devops Lambda functions
13. Run `./devops/deploy.sh` to deploy a DevOps VPC and all necessary Lambda functions