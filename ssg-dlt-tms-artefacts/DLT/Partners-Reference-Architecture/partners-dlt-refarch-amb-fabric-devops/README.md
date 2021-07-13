#AMB-DEVOPS

This is a serverless application for DevOps, which helps to manage your Hyperledger Fabric blockchain network managed by Amazon Managed Blockchain service.

Current use cases are:
- Peer replacement to delete faulty peer and create a new one, joining it to the same channels and installing the same chaincodes.
- Chaincode installation
- Retrieving extended configuration information about peers and channels
- Registering and enrolling new users with Fabric Certificate Authority

Below is code structure in the current repository:

```
.
├── README.MD                          <-- This file
├── config                             <-- Folder containing sample Fabric network Connection Profile
│   └── sample-connection-profile.yaml <-- Sample Connection Profile
├── dependencies/nodejs                <-- Folder containing a package.json file with dependencies for all applications in this repository. During the build process it is deployed as a Lambda layer for SAM application.
├── devops                             <-- Folder containing scripts building and deploying this SAM app and CloudFormation template for setting up delivery pipeline
│   └── build.sh                       <-- Script for building this SAM application
│   └── deploy.sh                      <-- Script for deploying this this SAM application
│   └── deploy-sam-s3-bucket.sh        <-- Script for deploying S3 Bucket for devops
│   └── amb-devops-iam-roles-template.yaml <-- A Cloud Formation template for deploying IAM Roles.
│   └── amb-devops-sam-s3-template.yaml <-- A Cloud Formation template for deploying S3 bucket that is used by the AWS `sam` cli to deploy SAM applications in this repository.
│   └── template.yaml                  <-- Empty SAM template
├── fcn-create-amb-node                <-- Lambda function creating a Fabric peer in the AMB network
├── fcn-delete-amb-node                <-- Lambda function deleting a Fabric peer from the AMB network
├── fcn-get-channel-config             <-- Lambda function to retrieve details of Hyperledger Fabric channel configuration
├── fcn-get-peer-info                  <-- Lambda function displaying peer configuration, joined channels and installed chaincodes
├── fcn-install-chaincode              <-- Lambda function that helps to install chaincode 
├── fcn-join-channels                  <-- Lambda function to join peers to channels 
├── fcn-peer-cli                       <-- Test code for triggering Fabric CLI. Used for testing only.
├── fcn-peer-recovery                  <-- Lambda function to coordinate peer recovery process
├── fcn-peer-status-check              <-- Lambda function to test the status of the peer
├── fcn-register-enroll-user           <-- Lambda function to register and enroll new users
├── fcn-setup                          <-- Lambda function to set up environment for the rest of the applications. Creates Connection Profile, enrolls Admin User.
├── fcn-share-certs                    <-- Lambda function for the new channel member to share certificates that needs to be added to the channel configuration.
├── amb-devops-peer-healthcheck-alarm-template.yaml   <-- A CloudFormation template for setting up peer healthcheck rule in CloudWatch and trigger peer recovery process in case of failure.
├── amb-devops-sam-template.yaml       <-- A CloudFormation template for deploying all Lambda functions as a single Serverless application.
├── amb-devops-vpc-template.yaml       <-- A CloudFormation template to optionally deploy a VPC for DevOps lambdas.
├── buildspec.yaml                     <-- Build specification file to automate build and deployment of this SAM application 
├── template.yaml                      <-- Empty SAM template

Each Lambda function source code has a structure similar to the following: 
├── fcn-create-amb-node                <-- Source code of Lambda function creating a Fabric peer in the AMB network
│   └── tests                          <-- Test data
│       └── event.json                 <-- Sample event object expected by Lambda function
│   └── index.js                       <-- Lambda function code
│   └── package.json                   <-- NodeJS dependencies and scripts
│   └── config.js                      <-- Class to manage configuration of Lambda function (parse event message and other configuration parameters)
```

## Requirements and resource naming conventions
Application is using the following services:
- **System Manager Parameter Store**
  
  Stores:
  - **Fabric Connection Profile** under the name `/amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/connection-profile`
  - **Fabric User Object** under the name `amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/users/<USER_ID>`

- **Secrets Manager**

    Stores:
    - **Fabric Admin User** username and password under the name `amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/users/adminCreds`. 
    - **Fabric User Private Key** under the name `amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/users/<USER_SIGNING_IDENTITY>-priv`. 
    
    **PLEASE NOTE** that `USER_SIGNING_IDENTITY` is auto-generated by the Hyperledger Fabric Client SDK (HFC) during user enrollment process and should match with the value of `signingIdentity` property of Fabric User Object**

- **S3**
  
  Stores:
  - **Chaincode Deployment Package** and it's respective **amb-deployspec.yaml** file for every channel. The name S3 bucket is specified in channel configuration of Connection Profile and full path to respective Chaincode Deployment Package has the following naming convention: `channels/<CHANNEL_NAME>/chaincodes/<CHANICODE_NAME>/`.
  - This SAM application deployment package. Used by `sam` and `aws cloudformation` cli command during the build and deployment process (see the details inside `buildspec.yaml`)


- **CodeCommit**
  - This SAM application Git repository.
  - Chaincode Git repository.

## Glossary of terms
- **Fabric Connection Profile** - Configuration in YAML format that holds important information about Fabric network components including peers, channels, organizations, orderers, etc. This configuration is used to setup Hyperledger Fabric Client (HFC) as well as by the devops Lambda functions. Current application is using an extended version of original [Connection Profile of HFC](https://fabric-sdk-node.github.io/release-1.3/tutorial-network-config.html).
- **Fabric Admin User** - When you create an organization in Amazon Managed Blockchain service, you specify the username and password for the Fabric Admin User that is registered in the Certificate Authority. Once this user is enrolled with CLI or HFC, it's credentials can be used to setup new channels, install and instantiate chanicodes on the peers and create new Fabric Users. 
- **Fabric User** - A user, registered and enrolled in organization's Certificate Authority.
- **Fabric User Object** - An object, generated by HFC during user enrollment process. Contains important information like user's X.509 certificate with public key, signing identity id, etc. 
- **Fabric User Private Key** - PEM encoded private key of the user, used by HFC to sign transactions from the name of the user.
- **HFC**, **Hyperledger Fabric Client** - A client software development kit for Hyperledger Fabric that is used to interact with peers, orderers and certificate authorities. In version 1.2 (currently supported in AMB) it uses two npm modules: `fabric-ca-client` to interact with Certificate Authorities and `fabric-client` to interact with the rest of the components. 
- **KVS**, **Key-Value Store Driver** - An implementation of GetValue and SetValue methods for various storage services allowing HFC to manage user credentials in those storages.
- **Lambda Invoke Event** - An event that is sent to the Lambda function to trigger it's operation.
- **Chaincode Deployment Package** - is a zip file containing the source code of the chaincode with extension `.car` (Chaincode ARchive).
- **amb-buildspec.yaml** - A configuration file with deployment instructions for chaincode build and deployment Lambda functions. Provided by chaincode developer as a part of the source code.

## Setup process 

### Pre-requisites:

Deploy the SAM application. Please refer to (`partners-dlt-refarch-amb-fabric-config/README.md`) for the deployment steps.

### The Process:

Once the SAM application is deployed, it needs to be configured. Please follow the below steps to configure this SAM application to work with your new AMB network.

1. Run `fcn-setup` function to generate Connection Profile configuration and enroll your Admin user with your DL member.
   Detailed instructions at [SETUP](./docs/SETUP.md)

2. Wait for the Channel admin to share channel information with your AWS account. This would typically be a setup object as shown below:
   ```
   "{\"channelProfile\":{\"name\":\"testnet\",\"s3BucketName\":\"xxx-yyy-dltsharedbucket\",\"orderers\":[\"orderer1\"],\"peers\":{\"nd-MHRCZ5XVTVFVTLCKJACFQ6JF3M\":{\"endorsingPeer\":true,\"chaincodeQuery\":true,\"ledgerQuery\":true,\"eventSource\":true}}},\"endorsingPeerProfiles\":[{\"name\":\"nd-MHRCZ5XVTVFVTLCKJACFQ6JF3M\",\"url\":\"grpcs://nd-mhrcz5xvtvfvtlckjacfq6jf3m.m-7nkrwurtgjgardbloz4573ymcu.n-iiwomrvd7jadvapehk7mwkvmwy.managedblockchain.us-east-1.amazonaws.com:30003\",\"eventUrl\":\"grpcs://nd-mhrcz5xvtvfvtlckjacfq6jf3m.m-7nkrwurtgjgardbloz4573ymcu.n-iiwomrvd7jadvapehk7mwkvmwy.managedblockchain.us-east-1.amazonaws.com:30004\",\"grpcOptions\":{\"ssl-target-name-override\":\"nd-mhrcz5xvtvfvtlckjacfq6jf3m.m-7nkrwurtgjgardbloz4573ymcu.n-iiwomrvd7jadvapehk7mwkvmwy.managedblockchain.us-east-1.amazonaws.com\"},\"tlsCACerts\":{\"path\":\"/tmp/managedblockchain-tls-chain.pem\"}}],\"organizationProfile\":{\"name\":\"m-7NKRWURTGJGARDBLOZ4573YMCU\",\"mspid\":\"m-7NKRWURTGJGARDBLOZ4573YMCU\",\"peers\":[\"nd-MHRCZ5XVTVFVTLCKJACFQ6JF3M\"],\"certificateAuthorities\":[\"m-7NKRWURTGJGARDBLOZ4573YMCU\"]}}"
   ```
   After this info is shared, the partner needs to update lambda execution role (xxxx-devops-sam-role) with s3 read & write object access to the s3 bucket represented by channelProfile.s3BucketName.
   ```
   {
        "Action": [
            ...
            "s3:GetObject",
            "s3:PutObject",
            ...
        ],
        "Resource": [
            ...
            "arn:aws:s3:::xxx-yyy-dltsharedbucket/*",
            ...
        ],
        "Effect": "Allow"
   }
   ```
   Following the role update, the partner needs to run the `fcn-share-certs` function to share certs info with the channel admin.
   Detailed instructions at [SHARING CERTS WITH CHANNEL ADMIN](./docs/SHARING_CERTS_WITH_CHANNEL_ADMIN.md)
   
   Once this is done, wait for the Channel admin to add your DL member into the channel. Once the channel admin confirms that this has been proceed to the next step.
   
3. Run `fcn-join-channels` to join peer to the channel
   See detailed instructions at [JOIN PEER TO CHANNEL](./docs/JOIN_PEER_TO_CHANNEL.md)

4. To install a chaincode: 
  - Trigger Lambda function:
     - Open list of Lambda functions in the [Lambda Console](https://console.aws.amazon.com/lambda/home).
     - Choose the lambda function starting with name `<YOUR_PREFIX>-install-chaincode`
     - Configure a test event in the upper right corner with the following format:
     ```
      {
          "networkId": "<AMB_NETWORK_ID>",
          "memberId": "<AMB_MEMBER_ID>",
          "peerId": "<AMB_NODE_ID>"
      }
     ```
     This function reads the latest chaincode src and version from the S3 bucket shared by the SSG member via the `Role-xxx-DevOps-sam-role`
     You may find an example in `fcn-install-chaincode/tests/event.json` .

5. To check the peer information and see which channels it is a member of and which chaincodes are installed on it.
  - Trigger Lambda function:
     - Open the list of Lambda functions in the [Lambda Console](https://console.aws.amazon.com/lambda/home).
     - Choose the lambda function starting with name `<YOUR_PREFIX>-peer-info`
     - Configure a test event in the upper right corner with the following format:
     ```
      {
          "networkId": "<AMB_NETWORK_ID>",
          "memberId": "<AMB_MEMBER_ID>",
          "peerId": "<AMB_NODE_ID>"
      }
     ```
     You may find an example in `fcn-get-peer-info/tests/event.json` .

6. (Optional) To change a setup for automatic peer health check and recovery:
   - Edit file `<CONFIG_REPOSITORY_FOLDER_NAME>/setConfigVariables.sh`:
     - `AMB_DEVOPS_CW_STACKNAME` you may choose the name of the stack that will be unique to the current network
     - `AMB_DEVOPS_NETWORK_ID` the ID of the network you would like to monitor. (Please note that currently you will be able to check availability of the peers that belong only to the member you own).
     - `AMB_DEVOPS_MEMBER_ID` the ID of the member you own.
     - `AMB_DEVOPS_PEER_ALARM_STATUS_LIST` a list of peer statuses that will rise an alarm in CloudWatch. For failing peers you may choose to use `"CREATE_FAILED, FAILED"` . Allowed values are: `"CREATING, AVAILABLE, CREATE_FAILED, DELETING, DELETED, FAILED"`
     - `AMB_DEVOPS_NOTIFICATION_EMAIL` the email to be used for notifications on the alarm trigger
     - `AMB_DEVOPS_SAM_STACKNAME` refers to the name of the Cloud Formation stack for SAM application. You may find it in `./devops/deploy.sh` as a value assigned to `AMB_DEVOPS_SAM_STACKNAME` environmental variable.
   - Copy `<CONFIG_REPOSITORY_FOLDER_NAME>/setConfigVariables.sh` to the local devops folder:
  
  ```
  cp <CONFIG_REPOSITORY_FOLDER_NAME>/setConfigVariables.sh ./devops
  ```

     - Trigger a re-deployment of the the CloudWatch artifacts from your CLI:
    
   ```
   cd ./devops
   ./deploy-cloud-watch-alarm.sh
   ```

7.  (Optional) To trigger replacement of a peer belonging to your member:
    - Make sure that the peer id you are planning to replace is configured correctly in `channels`, `chaincodes`  and `peers` sections fo Configuration Profile.
    - Open the list of Lambda functions in the [Lambda Console](https://console.aws.amazon.com/lambda/home).
    - Choose the lambda function starting with name `<YOUR_PREFIX>-peer-recovery-*`
    - Configure a test event in the upper right corner with the following format:
   ```
   {
        "networkId": "<AMB_NETWORK_ID>",
        "memberId": "<AMB_MEMBER_ID>",
        "peerId": "<PEER_ID_TO_REPLACE>",
        "availabilityZone": "<NEW_PEER_AVAILABILITY_ZONE>",
        "instanceType": "<NEW_PEER_INSTANCE_TYPE>"
        }
   ```
   You may find an example in `fcn-peer-recovery/tests/event.json` .

Peer replacement might take upto ~6 minutes.

## Changing the logging level

You can edit logging level configuration to `debug` or `info` in `./libs/logging.js`, push the code through the pipeline.   

## Limitations
- `fcn-peer-recovery` will be able to perform one peer replacement at a time to avoid update conflicts to the Connection Profile configuration. Because of that if more than one peer falls to the failed state, only the first one will be recovered automatically. The rest of the peers can be recovered by manually triggering `fcn-peer-recovery` based on the alarms risen in CloudWatch.
- If `fcn-peer-recovery` function is interrupted it will not be able to re-start from the point where it has stopped. Continuing the process will require manual intervention.
- `fcn-peer-recovery` function will deploy the latest chaincode version available for all channels. If a new version of the chaincode was shared to the channel's S3 bucket but was not yet instantiated on that channel, the new peer will not be able to produce correct endorsements and will have to wait till instantiation happens.
- All functions except `fcn-get-peer-info`, `fcn-peer-status-check`, `fcn-register-enroll-user` are updating Connection Profile in different ways and because locking mechanism is implemented only for `fcn-peer-recovery`, it is not safe to run the rest of the functions in parallel. Otherwise you might end up fixing connection profile manually. Please make sure the function has finished the execution before re-trying it again.