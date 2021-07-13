# AMB-Apps

This repository contains source code for applications that are helping to interact with chaincode functions or data that is stored in the Hyperledger Fabric World State.

Below is a structure of this repository:

```
.
├── README.md                              <-- This file
├── amb-apps-sam                           <-- Folder with code for Serversless Application with core lambda-functions that will be exposed to the end user.
│   └── amb-apps-sam-template.yaml         <-- A Cloud Formation template for deploying SAM application with Invoke/Query function.
│   └── amb-apps-sam-inc-sqs-lambda-template.yaml <-- A Cloud Formation template for deploying inbound data flow: setting incoming SQS queue, DynamoDB for key storage and a lambda function for processing incoming messages from SQS.
│   └── amb-apps-sam-s3-template.yaml      <-- A Cloud Formation template for deploying S3 bucket that is used by the AWS `sam` cli to deploy SAM applications in this repository.
│   └── fcn-invoke-query-chaincode         <-- A folder with the code of Lambda function that allows to invoke or query any function of the chaincode on a certain channel using identity of a required user.
│       └── tests                          <-- Test data with list of sample event messages that can be submitted to the lambda function.
│          └── event-invoke.json           <-- Invoke a chaincode function with parameters
│          └── event-query.json            <-- Query a chaincode function with parameters
│       └── fcn.yaml                       <-- A SAM application template for testing on developers machine
│       └── index.js                       <-- Lambda function code
│       └── runLocal.sh                    <-- Script that helps to run current lambda locally using AWS `sam` cli
│       └── config.js                      <-- Class to manage configuration of Lambda function (parse event message)
│   └── fcn-poll-inc-sqs                   <-- A folder with the code of Lambda function that triggers the Invoke/Query lambda when a message is written to the Incoming SQS queue; this function also encrypts the message before triggering the lambda.
│       └── tests                          <-- Test data with list of sample event messages that can be submitted to the lambda function.
│          └── event-invoke-sf.json        <-- Invoke a chaincode function with parameters
│       └── fcn.yaml                       <-- A SAM application template for testing on developers machine
│       └── index.js                       <-- Lambda function code
│       └── runLocal.sh                    <-- Script that helps to run current lambda locally using AWS `sam` cli
├── app-the-synchronizer                   <-- Folder with code for The Synchronizer tool that syncs write set from the received blocks with DynamoDB table dedicated for a channel.
│   └── config                             <-- Folder with configuration files, used by config.js. Specified parameters can be overwritten by environment variables during deployment.
│       └── custom-environment-variables.json<-- Mapping configuration parameters with environment variable names.
│       └── default.json                    <-- Default configuration parameters
│       └── prod.json                       <-- Configuration parameters for production environment
│   └── test                                <-- Contains scripts with sample values for environment variables to set up and run The Synchronizer locally.
│       └── docker-env.list                 <-- Allows to configure The Synchronizer to build local Docker image with custom environment variables.
│       └── env.sh                          <-- Script that sets up local console with required environment variables.
│   └── amb-app-synchronizer-template.yaml  <-- A CloudFormation template which sets up ECS cluster and a Fargate task to run The Synchronizer as a container.
│   └── app.js                              <-- The main file of The Synchronizer application
│   └── block-parser.js                     <-- A class that performs operations related to parsing and extracting data from the block.
│   └── Dockerfile                          <-- A Dockerfile that helps to build an image to run The Synchronizer as a container
│   └── dynamodb.js                         <-- A driver for DynamoDB to perform Get/Put operations for write set and latestBlockSynced property.
│   └── package.json                        <-- A configuration file for NodeJS dependencies and scripts
│   └── README.md                           <-- A readme file for The Synchronizer app
│   └── start.sh                            <-- A script to run the application as a standalone node process
│   └── utils.js                            <-- A set of helper function for The Synchronizer app
├── dependencies/nodejs                     <-- Folder containing a package.json file with dependencies for all applications in this repository. During the build process it is deployed as a Lambda layer for SAM applications and just copied over to make it available within The Synchronizer container.
├── devops                             <-- Folder containing scripts building and deploying SAM and The Synchronizer apps as well as CloudFormation template for setting up a VPC and delivery pipeline
│   └── build.sh                       <-- Script for building SAM and The Synchronizer apps
│   └── deploy-iam-roles.sh            <-- Script for deploying IAM Roles
│   └── deploy.sh                      <-- Script for deploying SAM and The Synchronizer apps
│   └── deploy-sam-s3-bucket.sh        <-- Script for deploying S3 Bucket for apps
│   └── deploy-sqs-fcns.sh             <-- Script for deploying SQS 
│   └── deploy-the-synchronizer.sh     <-- Script for deploying Syncrhonizer
│   └── amb-apps-iam-roles-template.yaml <-- A Cloud Formation template for deploying IAM Roles.
│   └── template.yaml                  <-- Empty SAM template 
│   └── setConfigVariables.sh          <-- Central script to set all required environmental variables 
├── amb-apps-vpc-template.yaml         <-- A CloudFormation template to create a VPC and subnets to run all applications from this repository. 
├── buildspec.yaml                     <-- Build specification file to automate build and deployment of this SAM application 
├── template.yaml                      <-- Empty SAM template
```
## Services used and resource naming conventions
This repository contains a number of applications, which are using the following services:
- **System Manager Parameter Store**
  
  Stores:
  - **Fabric Connection Profile** under the name `/amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/connection-profile`
  - **Fabric User Object** under the name `amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/users/<USER_ID>`

- **Secrets Manager**

    Stores:
    - **Fabric Admin User** username and password under the name `amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/users/adminCreds`. 
    - **Fabric User Private Key** under the name `amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/users/<USER_SIGNING_IDENTITY>-priv`. 
    
    **PLEASE NOTE** that `USER_SIGNING_IDENTITY` is auto-generated by the Hyperledger Fabric Client SDK (HFC) during user enrollment process and should match with the value of `signingIdentity` property of Fabric User Object**

- **DynamoDB**
  - There is only one table in the DynamoDB service which is used by The Synchronizer to synchronize the data from the World State.

- **Simple Queuing Service (SQS)**
  - Solution is using a queue to receive data for distribution through DLT. 

- **Simple Storage Service (S3)**
  - Mainly used by CodeBuild to build and deploy SAM applications from this repository. Can be periodically cleared to save space.

- **Elastic Container Registry (ECR)**
  - Is used to publish images for The Sunchronizer container to run it later in an Fargate for Elastic Container Service (see next).

- **Fargate for Elastic Container Service (Fargate for ECS)**
  - Runs The Synchronizer container.

- **Lambda**
  - Hosts and runs all Lambda functions in this repository.

## Glossary of terms
- **Fabric Connection Profile** - Configuration in YAML format that holds important information about Fabric network components including peers, channels, organizations, orderers, etc. This configuration is used to setup Hyperledger Fabric Client (HFC) as well as by the devops Lambda functions. Current application is using an extended version of original [Connection Profile of HFC](https://fabric-sdk-node.github.io/release-1.3/tutorial-network-config.html).
- **Fabric Admin User** - When you create an organization in Amazon Managed Blockchain service, you specify the username and password for the Fabric Admin User that is registered in the Certificate Authority. Once this user is enrolled with CLI or HFC, it's credentials can be used to setup new channels, install and instantiate chanicodes on the peers and create new Fabric Users. 
- **Fabric User** - A user, registered and enrolled in organization's Certificate Authority.
- **Fabric User Object** - An object, generated by HFC during user enrollment process. Contains important information like user's X.509 certificate with public key, signing identity id, etc. 
- **Fabric User Private Key** - PEM encoded private key of the user, used by HFC to sign transactions from the name of the user.
- **HFC**, **Hyperledger Fabric Client** - A client software development kit for Hyperledger Fabric that is used to interact with peers, orderers and certificate authorities. In version 1.2 (currently supported in AMB) it uses two npm modules: `fabric-ca-client` to interact with Certificate Authorities and `fabric-client` to interact with the rest of the components. 
- **KVS**, **Key-Value Store Driver** - An implementation of GetValue and SetValue methods for various storage services allowing HFC to manage user credentials in those storages.
- **Lambda Invoke Event** - An event that is sent to the Lambda function to trigger it's operation.

## Setting up

### Pre-requisites:

Deploy the SAM application and the Synchronizer(Optional). Please refer to (`partners-dlt-refarch-amb-fabric-config/README.md`) for the deployment steps.

### Process:

Once the SAM application and The Synchronizer(Optional) are deployed, you may start using them.

1. Initialize The Synchronizer task in Elastic Container Service (ECS):
   - Navigate to Services > ECS
   - On `Clusters` section, select the cluster name e.g. `Cfs-Ssg-Tgs-Prn-Apps-sychronizer`.
   - On cluster page, tab `Services`, click on the service name, e.g. `Cfs-Ssg-Tgs-Prn-Apps-sychronizer-FargateService-*`
   - On the service page, on the upper-right corner, click the `Update` button.
   - Change the value of `Number of tasks` parameter from `0` to `1`.
   - On the lower-right corner keep clicking `Next step` button utill you will get to the summary page with `Update Service` button at the bottom right.
   - Click the `Update Service` button.
   - Navigate back to the service page and choose `Tasks` tab.
   - You should see one task changing states from `PROVISIONING` to `PENDING` and finally to `RUNNING`. If task got stuck on `PENDING` state and never switched to `RUNNING`, please make sure the cloud formation stack for VPC setup was installed correctly. 

### Testing:

To test writing/reading to the blockchain directly:
1. Trigger `amb-apps-sam/fcn-invoke-query-chaincode` function to test invoke and query operations.
   - From the list of Lambda functions in the (Lambda Console)[https://console.aws.amazon.com/lambda/home].
   - Choose the lambda function starting with name `<YOUR_PREFIX>-invoke-query-chaincode`
   - Configure a test event in the upper right corner with examples from `./amb-apps-sam/fcn-invoke-query-chaincode/tests/`.

2. After you invoked the function that created or updated a value in the World State, it will trigger creation of a new block containing a write set. If you deployed and started the Synchronizer, this data should be automatically synchronized to the target DynamoDB table.
   - The simplest way to check if data arrived to the target table is open it in the AWS console: 
     - Navigate to [DynamoDB Tables List](https://console.aws.amazon.com/dynamodb/home#tables:)
     - Click on the table name
     - Select the `Items` tab
     - You should see the data there
  In case your channel is not new and contains older blocks that you want to sync, you may do the following:
    - Navigate to [DynamoDB console](https://console.aws.amazon.com/dynamodb/home) and select the target database.
    - Switch to the `Items` tab and find the item with id `latestBlockNumber`.
    - Inside `latestBlockNumber` record, edit the value of property `number` to `0` (if you would like to synchronize from the beginning).
    - Navigate to [ECS console](https://console.aws.amazon.com/ecs/home/)
    - Select the cluster where The Synchronizer container is running. E.g. `Cfs-Ssg-Tgs-Prn-Apps-sychronizer`
    - Select `Tasks` tab
    - Find the task containing `amb-app-the-synchronizer`, select and stop it.
    - The task will re-start automatically and will start synchronization process from block `0`.

## SQS - Incoming queue
The TGS architecture relies on submitting requests into the Incoming queue; the poll-inc-sqs lambda picks up the message and triggers the Invoke/Query chaincode lambda. This lambda invokes a transaction to write the data into Fabric.
This raises an event on Fabric, which triggers the synchronizer to register an event record in the DynamoDB table. 
It is to be noted that the poll-inc-sqs lambda typically attempts to capture all exceptions and send them along to the next part of the stack.

To test the queue-based events generation:
- First, write the sample data from the Invoke/Query example into the Incoming queue
- Wait for the result to appear on the DynamoDB table (This typically takes up to 10 seconds for simple payloads)
- If the result does not appear, inspect CloudWatch logs for the point of failure


## Changing the logging level

You can edit logging level configuration to `debug` or `info` in `./libs/logging.js`, push the code through the pipeline.   

## Limitations (TBA)
- 
