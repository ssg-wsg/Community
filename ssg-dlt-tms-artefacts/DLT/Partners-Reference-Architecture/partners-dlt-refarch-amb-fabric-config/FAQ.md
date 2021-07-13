# Deployment FAQs


## General

### Q: Can multiple system use the same Managed Blockchain set (Member ID, Peer ID) in configuration?
- There would be a conflict in the setup so it is recommended to use different sets.

### Q: Why am I seeing Validation Error messages of stacks when deployment scripts run? 
`ex. An error occurred (ValidationError) when calling the DescribeStacks operation: Stack with id Ssg-Tgs-PartnersArchi-Amb-Cfs-iam-roles does not exist`

- The configuration script (setConfigVariables.sh) does a check if the stacks to be deployed already exist. There are cases that you may ignore these messages when they only provide an information if the stacks have not yet been deployed. But in the case that the stack already exists and you still see this error message, you may need to double check from the CloudFormation if it has been deleted. <br/>

## Configuration Issues

### Q: How to resolve an invalid template path?
- The deployment scripts uses a cloud formation template file. You have to ensure that the template file its referring to exist in the correct directory. 

For ex. if you are running the deployment script ./devops/deploy-iam-roles.sh from partners-dlt-refarch-amb-fabric-devops directory, check if the deployment script ./devops/deploy-iam-roles.sh file is referencing to ./devops/amb-apps-iam-roles-template.yaml. 

### Q: Why do the deployment script retrieves empty values of parameters?
- Check if the variable has value in partners-dlt-refarch-amb-fabric-config/setConfigVariables.sh
- When you update the main configuration in partners-dlt-refarch-amb-fabric-config/setConfigVariables.sh make sure to create a copy to the devops folder before redeploying so the deployment script would retrieve the updated configuration.

### Q: Why does Fargate's task's status go back to Pending?
- Verify if the synchronizer was deployed correctly. You can check from CloudWatch logs the caused of the error by searching `/ecs/` from the log group. 
- Check the configuration as there could a mismatch of the channel name in the partners-dlt-refarch-amb-fabric-config/setConfigVariables.sh. 

If there is a mismatch, you need to update the configuration and redeploy the stacks by following the steps in partners-dlt-refarch-amb-fabric-config/README.md <br/>

### Q: Why does the Setup lambda function time out?
- This happens because the Setup function (not associated to a VPC) calls the Register and Enroll function (which is associated to a VPC)
- This typically happens when connectivity to the services for Systems Manager (Parameter store) or Secrets manager is not established within the VPC. This could be because of a number of reasons like endpoints not created, security groups configured incorrectly etc.
- See the partners-dlt-refarch-amb-fabric-config\Readme file for the list of endpoints and details on Security groups rules creation.

### Q: Why does the Share-certs function complain that S3 access is denied?
- This happens because the <Prefix>-DevOps-sam-role does not have access policies configured to read/write to the Shared S3 bucket. 
- See the partners-dlt-refarch-amb-fabric-devops\Readme file for updating the S3 bucket access policies before invoking this function.

### Q: This error is encountered in the apps deployment process:
```
Unzipped size must be smaller than 262144000 bytes (Service: AWSLambdaInternal; Status Code: 400; Error Code: InvalidParameterValueException; Request ID: 2bfc63b0-5bf7-4c6e-927f-887b5166cb30)	
```
- This typically happens due to the invalid lib structure in the dependencies lib folder:
`dependencies/nodejs/lib/lib`
 
The correct structure should be:
`dependencies/nodejs/lib`
 
The cp -R command works differently on Mac OS X than on Linux. Check that the copy command in `build.sh` is as below:
```
cp -r ./devops/lib/ ./dependencies/nodejs/lib
```

## Dependency Related Issues

### Q: How to resolve the failure of uploading dependencies when deploying lambda functions?
`ex. Error: Unable to upload artifact ../dependencies/ referenced by ContentUri parameter of devopsDependenciesLayer resource.`

- The dependencies require an S3 bucket for storage. Check if the S3 Bucket exists. If it does not, check the deploy.sh if it includes the execution of deploy-sam-s3-bucket.sh.

### Q: Why does creation of S3 bucket fails?
- Check if the S3 name conforms to the naming requirement. Please see the link for reference: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-s3-bucket-naming-requirements.html

If the naming requirement is met, check if the S3 bucket already exists. S3 Bucket names are globally unique. If it does exist, you would need to delete its resources and delete the bucket before proceeding to redeploy.

- Ensure that the deploy-sam-s3-bucket.sh has the correct parameter referenced to the S3 Cloud Formation file. 
For ex. the parameter AMBAppsSAMBucketName in amb-apps-sam-s3-template.yaml should exist in deploy-sam-s3-bucket.sh for apps
and the parameter AMBDevopsSAMBucketName in amb-devops-sam-s3-template.yaml should exist in deploy-sam-s3-bucket.sh for devops <br/>

## Role Permission Issues

### Q: apI: ec2:DescribeNetworkInterfaces You are not authorized to perform this operation.
- Check if the role you are using for deployment have access to elastic beanstalk.

## Logs

### Q: How do I check what caused the deployment failure?
- You may check the event logs from aws cli or from the CloudFormation by selecting the stack name and clicking the events.

### Q: How do I check the previous logs?
- You may go to CloudWatch Logs >> Log groups and search using the prefix. For ex. when searching for ECS logs, you may enter: `/ecs` in the search box. <br/>

## Issues encountered upon testing lambda functions

### Q: Why does a lambda dependency module not found even if the stack has been successfully deployed?
- The error could be caused by the grpc binary retrieved from your system during the deployment does not match the expected linux binary.

```ex. "Runtime.ImportModuleError: Error: Failed to load gRPC binary module because it was not installed for the current system", "Expected directory: node-v64-linux-x64-glibc", "Found: [node-v57-darwin-x64-unknown]"``` 

In order to solve this, you need to install the targeted grpc binary in the dependencies/package.json. 

For ex.

```"scripts": {"postinstall": "npm rebuild grpc --target=10.0.0 --target_platform=linux --target_arch=x64 --target_libc=glibc --update-binary"} ```

### Q: How to resolve the channel not found error encountered when testing invoke-query-function?
`ex. Failed to invoke due to error: Error: Channel not found`

- Check if the channel name from the setConfigVariables.sh is correct. If it is not, you need to update the configuration and redeploy the SAM apps. <br/>

## Deployment Updates

### Q: How do I update the lambda functions deployment?
- In case there are updates on the configuration file, shared libraries, roles(names or permission updates), or lambda functions you would need to empty out, delete the S3 bucket and redeploy the stacks by following the steps in partners-dlt-refarch-amb-fabric-config/README.md

### Q: Deletion of Cfs-Ssg-Tgs-Prn-DevOps-lambda stack is stuck in DELETE_IN_PROGRESS
- Check if you have deleted the other stack dependencies before deleting this stack. For ex. Delete the Cfs-Ssg-Tgs-Prn-Apps-lambda-s3 stack first before deleting the Cfs-Ssg-Tgs-Prn-DevOps-lambda
