Once the SAM application is deployed, it needs to be configured. Please follow the blow steps to configure this SAM application to work with your new AMB network.

Run `fcn-setup` function to generate Connection Profile configuration and enroll your Admin user.
   - From the list of Lambda functions in the (Lambda Console)[https://console.aws.amazon.com/lambda/home].
   - Choose the lambda function starting with name `amb-devops-lambda-setup-*`
   - Configure a test event in the upper right corner with the following format:
   ```
   {
        "networkId": "<AMB_NETWORK_ID>",
        "adminName": "<AMB_ADMIN_USER_NAME>",
        "adminPassword": "<AMB_ADMIN_USER_PASSWORD>"
    }
   ```
  You may find an example in `fcn-setup/tests/event.json` .
  - Once function will finish, you can find new artifacts:
     - In System Manager's Parameter Store: a new Fabric Connection Profile under the name `/amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/connection-profile` 
     - In System Manager's Parameter Store: a new Fabric User Object for Admin user under the name `amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/users/<ADMIN_USER_ID>` 
     - In Secrets Manager: Fabric Admin User username and password under the name `amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/users/adminCreds`.
     - In Secrets Manager: Fabric Admin User private key under the name `amb/<AMB_NETWORK_ID>/<AMB_NETWORK_MEMBER_ID>/users/<ADMIN_USER_SIGNING_IDENTITY>-priv`.

Now you are ready to create new channel.