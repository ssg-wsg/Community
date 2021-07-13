# Shared Libs

This is a repository with shared libraries used by all other applications and lambda functions of a Jumpstart Kit.

Below is code structure in the current repository:

```
.
├── README.MD                          <-- This file
├── lib                                <-- Re-usable classes used by lambda functions and The Synchronizer
│   └── hfl-cli                        <-- Contains binaries and base configuration file for Fabric CLI
│   └── amb-client.js                  <-- Class to interact with AMB API to manage peers and retrieve necessary info 
│   └── chaincode-config-manager.js    <-- Chaincode configuration manager class
│   └── cloud-watch-client.js          <-- Wrapper around AWS SDK to interact with CloudWatch
│   └── codepipeline.js                <-- Wrapper around AWS SDK to interact with CodePipeline
│   └── connection-profile.js          <-- Class to retrieve or update parameters of Fabric network Connection Profile
│   └── hfc-cli-client.js              <-- Wrapper around Hyperledger Fabric CLI Clients
│   └── hfc-client.js                  <-- Wrapper around Hyperledger Fabric Clients
│   └── lambda-client.js               <-- Wrapper around AWS SDK to interact with Lambda from another Lambda function
│   └── logging.js                     <-- Class to unify logs management for the app
│   └── parameterstore-kvs.js          <-- HFC-compatible Key-Value store driver class to store user data in System Manager Parameter Store
│   └── run-cmd.js                     <-- Class that simplifies interaction with Linux command line interface within Lambda function
│   └── s3-client.js                   <-- Wrapper around AWS SDK to interact with S3 service
│   └── secretsmanager-kvs.js          <-- HFC-compatible Key-Value store driver class to store user private key in Secrets Manager service.
│   └── utils.js                       <-- Various helper classes.