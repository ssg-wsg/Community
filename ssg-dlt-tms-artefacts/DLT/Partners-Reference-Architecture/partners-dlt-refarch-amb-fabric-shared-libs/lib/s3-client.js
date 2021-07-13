/*
# Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# 
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# or in the "license" file accompanying this file. This file is distributed 
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either 
# express or implied. See the License for the specific language governing 
# permissions and limitations under the License.
#
*/

const logger = require("./logging").getLogger("s3-client");
const fs = require('fs');
const AWS = require('aws-sdk');
const Util = require('util');

const S3_READ_ACCESS_POLICY_SID = "ReadPermissions";
const S3_WRITE_ACCESS_POLICY_SID = "WritePermissions";
const S3_READ_POLICY_ACTIONS = ["s3:GetObject", "s3:GetObjectAcl", "s3:ListBucket"];
const S3_WRITE_POLICY_ACTIONS = ["s3:PutObject", "s3:PutObjectAcl"];
const S3_OWNER_POLICY_ACTIONS = ["s3:Delete*", "s3:Get*", "s3:Put*"];

const __setS3Access = (bucketPolicy, rolesArray, resourcesArray, policySid) => {
    const fcnName = "[S3Client __setS3Access]";

    return new Promise((resolve, reject) => {
        // Don't ask why...
        let newBucketPolicy = JSON.parse(JSON.stringify(bucketPolicy));
        logger.debug(`${fcnName} Copying current bucket policy to a new object: ${JSON.stringify(newBucketPolicy)}`);
        let policySet = false;
        for (let i = 0; i < bucketPolicy.Statement.length; i++) {
            logger.debug(`${fcnName} Iterating through policy statements. Iteration #${i}`)
            if (bucketPolicy.Statement[i].Sid === policySid) {
                policySet = true;
                // Adjusting role principals  
                if (bucketPolicy.Statement[i].Principal.AWS) {
                    rolesArray.forEach((role) => {
                        if (newBucketPolicy.Statement[i].Principal.AWS.indexOf(role) < 0) {
                            if (typeof newBucketPolicy.Statement[i].Principal.AWS === "string" &&
                                newBucketPolicy.Statement[i].Principal.AWS !== role) {
                                let principalsArray = [newBucketPolicy.Statement[i].Principal.AWS]
                                newBucketPolicy.Statement[i].Principal.AWS = principalsArray;
                            }
                            newBucketPolicy.Statement[i].Principal.AWS.push(role)
                        }
                    })
                } else {
                    newBucketPolicy.Statement[i].Principal.AWS = rolesArray;
                }
                // Adjusting resources
                if (bucketPolicy.Statement[i].Resource) {
                    resourcesArray.forEach((resource) => {
                        if (newBucketPolicy.Statement[i].Resource.indexOf(resource) < 0) {
                            if (typeof newBucketPolicy.Statement[i].Resource === "string" &&
                                newBucketPolicy.Statement[i].Resource !== resource) {
                                let principalsArray = [newBucketPolicy.Statement[i].Resource]
                                newBucketPolicy.Statement[i].Resource = principalsArray;
                            }
                            newBucketPolicy.Statement[i].Resource.push(resource)
                        }
                    })
                } else {
                    newBucketPolicy.Statement[i].Resource = resourcesArray;
                }
            }
        }
        // Seems like there is no policy with specified Sid, so creating a new one
        if (!policySet) {
            // Policy Actions are read by default
            let policyActions = S3_READ_POLICY_ACTIONS;
            if (policySid.includes(S3_WRITE_ACCESS_POLICY_SID)) {
                policyActions = S3_WRITE_POLICY_ACTIONS;
            }
            const newBucketPolicyStatement = `{
                            "Sid": "${policySid}",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": ${JSON.stringify(rolesArray)}
                            },
                            "Action": ${JSON.stringify(policyActions)},
                            "Resource": ${JSON.stringify(resourcesArray)}
                        }`
            newBucketPolicy.Statement.push(JSON.parse(newBucketPolicyStatement));
        }
        resolve(newBucketPolicy);
    })
}
const __revokeS3Access = (bucketPolicy, rolesArray, resourcesArray, policySid) => {
    const fcnName = "[S3Client __revokeS3Access]";

    return new Promise((resolve, reject) => {
        // Don't ask why...
        let newBucketPolicy = JSON.parse(JSON.stringify(bucketPolicy));
        logger.debug(`${fcnName} Copying current bucket policy to a new object: ${JSON.stringify(newBucketPolicy)}`);

        for (let i = 0; i < newBucketPolicy.Statement.length; i++) {
            if (newBucketPolicy.Statement[i].Sid === policySid) {
                // Adjusting role principals  
                if (newBucketPolicy.Statement[i].Principal.AWS) {
                    rolesArray.forEach((role) => {
                        const index = newBucketPolicy.Statement[i].Principal.AWS.indexOf(role)
                        if (index < 0) {
                            newBucketPolicy.Statement[i].Principal.AWS.splice(index, 1);
                        }
                    })
                }
                // Adjusting resources
                if (newBucketPolicy.Statement[i].Resource) {
                    resourcesArray.forEach((resource) => {
                        const index = newBucketPolicy.Statement[i].Resource.indexOf(resource)
                        if (index < 0) {
                            newBucketPolicy.Statement[i].Resource.splice(index, 1);
                        }
                    })
                }
            }
        }
        resolve(newBucketPolicy);
    })

}

module.exports = class S3Client {
    constructor() {
        this.__s3 = new AWS.S3();
    }

    // Helper function to get something like source code from S3.
    download(sourceBucketName, sourceObjectKey, localFilePath) {
        const fcnName = "[S3Client.download]";
        const self = this;
        const s3 = self.__s3;

        if (!sourceBucketName) {
            throw new Error(`${fcnName}: Please specify sourceBucketName`);
        }
        const bucketName = sourceBucketName;

        if (!sourceObjectKey) {
            throw new Error(`${fcnName}: Please specify sourceObjectKey`);
        }
        const objectKey = sourceObjectKey;

        if (!localFilePath) {
            throw new Error(`${fcnName}: Please specify localFilePath`);
        }
        const filePath = localFilePath;

        logger.debug(`${fcnName} Start downloading file ${filePath} from ${bucketName}/${objectKey}`);
        const file = fs.createWriteStream(filePath);

        let params = {
            Bucket: bucketName,
            Key: objectKey
        }

        return new Promise((resolve, reject) => {
            s3.getObject(params).on('error', (err) => {
                    reject(`${fcnName}: Error downloading file ${filePath} from S3: ${err}`);
                    throw new Error(`${fcnName}: Error downloading file ${filePath} from S3: ${err}`);
                })
                .on('httpData', (chunk) => {
                    file.write(chunk, (err) => {
                        if (err) {
                            reject(`${fcnName}: Error writing file: ${err}`);
                            throw new Error(`${fcnName}: Error writing file: ${err}`);
                        }
                    });
                })
                .on('httpDone', () => {
                    file.end();
                    resolve(filePath);
                    logger.log(`${fcnName} Finished downloading file to ${filePath}`);
                })
                .send();
        });
    };


    // Helper function to put data in a S3 bucket
    uploadDataWithoutSSE(targetBucketName, targetObjectKey, data) {
        const fcnName = "[S3Client.uploadDataWithoutSSE]";
        const self = this;
        const s3 = self.__s3;

        if (!targetBucketName) {
            throw new Error(`${fcnName}: Please specify targetBucketName`);
        }
        const bucketName = targetBucketName;

        if (!targetObjectKey) {
            throw new Error(`${fcnName}: Please specify targetObjectKey`);
        }
        const objectKey = targetObjectKey;

        if (!data) {
            throw new Error(`${fcnName}: Please specify data for upload`);
        }

        //logger.debug(`${fcnName} Start putting data ${data} to ${bucketName}/${objectKey}`);

        let params = {
            ACL: "bucket-owner-full-control",
            Bucket: bucketName,
            Key: objectKey,
            Body: data
        }
        return s3.putObject(params).promise();
    };

    // Helper function to upload something like certificates to S3 bucket of network operator
    uploadFileWithoutSSE(targetBucketName, targetObjectKey, localFilePath) {
        const fcnName = "[S3Client.uploadFileWithoutSSE]";
        const self = this;
        const s3 = self.__s3;

        if (!targetBucketName) {
            throw new Error(`${fcnName}: Please specify targetBucketName`);
        }
        const bucketName = targetBucketName;

        if (!targetObjectKey) {
            throw new Error(`${fcnName}: Please specify targetObjectKey`);
        }
        const objectKey = targetObjectKey;

        if (!localFilePath) {
            throw new Error(`${fcnName}: Please specify localFilePath`);
        }
        const filePath = localFilePath;

        //    logger.debug(`${fcnName} Start uploading file ${filePath} to ${bucketName}/${objectKey}`);

        let params = {
            ACL: "bucket-owner-full-control",
            Bucket: bucketName,
            Key: objectKey,
            Body: fs.createReadStream(localFilePath, (err) => {
                if (err) {
                    reject(`${fcnName}: Error reading the file ${localFilePath}: ${err}`);
                    throw new Error(`${fcnName}: Error reading the file ${localFilePath}: ${err}`);
                }
            })
        }
        return s3.putObject(params).promise();
    };


    // Helper function to upload something like packaged chaincode to S3.
    upload(targetBucketName, targetObjectKey, localFilePath) {
        const fcnName = "[S3Client.upload]";
        const self = this;
        const s3 = self.__s3;

        if (!targetBucketName) {
            throw new Error(`${fcnName}: Please specify targetBucketName`);
        }
        const bucketName = targetBucketName;

        if (!targetObjectKey) {
            throw new Error(`${fcnName}: Please specify targetObjectKey`);
        }
        const objectKey = targetObjectKey;

        if (!localFilePath) {
            throw new Error(`${fcnName}: Please specify localFilePath`);
        }
        const filePath = localFilePath;

        logger.debug(`${fcnName} Start uploading file ${filePath} to ${bucketName}/${objectKey}`);

        let params = {
            //ACL: "authenticated-read",
            Bucket: bucketName,
            Key: objectKey,
            ServerSideEncryption: "aws:kms",
            Body: fs.createReadStream(localFilePath, (err) => {
                if (err) {
                    reject(`${fcnName}: Error reading the file ${localFilePath}: ${err}`);
                    throw new Error(`${fcnName}: Error reading the file ${localFilePath}: ${err}`);
                }
            })
        }
        return s3.putObject(params).promise();
    };

    // Helper function to test if object exists in s3 bucket
    head(targetBucketName, targetObjectKey) {
        const fcnName = "[S3Client.head]";
        const self = this;
        const s3 = self.__s3;

        if (!targetBucketName) {
            throw new Error(`${fcnName}: Please specify targetBucketName`);
        }
        const bucketName = targetBucketName;

        if (!targetObjectKey) {
            throw new Error(`${fcnName}: Please specify targetObjectKey`);
        }
        const objectKey = targetObjectKey;

        logger.debug(`${fcnName} Start testing object existence: ${bucketName}/${objectKey}`);

        let params = {
            Bucket: bucketName,
            Key: objectKey
        }
        return new Promise(async (resolve, reject) => {
            try {
                let result = await s3.headObject(params).promise();
                resolve(result)
            } catch (err) {
                resolve(null)
            }
        })
    };

    //Helper function to set read and write access to objects in S3.
    setReadWriteBucketPolicy(channelS3BucketName, newMemberAccountId, newMemberIAMRoleName, ownerIAMRoleARN, readObjectPrefix, writeObjectPrefix) {
        const fcnName = "[S3Client.setReadWriteBucketPolicy]";
        const self = this;
        const s3 = self.__s3;

        return new Promise(async (resolve, reject) => {
            try {
                if (!channelS3BucketName) {
                    throw new Error(`${fcnName}: Please specify value for "channelS3BucketName" parameter`);
                }
                if (!newMemberAccountId) {
                    throw new Error(`${fcnName}: Please specify value for "newMemberAccountId" parameter`);
                }
                if (!newMemberIAMRoleName) {
                    throw new Error(`${fcnName}: Please specify value for "newMemberIAMRoleName" parameter`);
                }
                const readObjectPfx = readObjectPrefix ? readObjectPrefix : "";
                const writeObjectPfx = writeObjectPrefix ? writeObjectPrefix : "";

                const bucketPolicyProperties = {
                    Bucket: channelS3BucketName
                }

                const currentBucketPolicy = await this.getBucketPolicy(channelS3BucketName);
                logger.debug(`${fcnName} Retrieved bucket policy: ${JSON.stringify(currentBucketPolicy)}`);

                if (currentBucketPolicy) {

                    let newBucketPolicy = await __setS3Access(currentBucketPolicy,
                        [`arn:aws:iam::${newMemberAccountId}:role/${newMemberIAMRoleName}`],
                        [`arn:aws:s3:::${channelS3BucketName}`, `arn:aws:s3:::${channelS3BucketName}/${readObjectPrefix}*`],
                        S3_READ_ACCESS_POLICY_SID)

                    newBucketPolicy = await __setS3Access(newBucketPolicy,
                        [`arn:aws:iam::${newMemberAccountId}:role/${newMemberIAMRoleName}`],
                        [`arn:aws:s3:::${channelS3BucketName}`, `arn:aws:s3:::${channelS3BucketName}/${writeObjectPrefix}*`],
                        `${S3_WRITE_ACCESS_POLICY_SID}-${newMemberAccountId}`)

                    logger.debug(`${fcnName} New bucket policy object: ${JSON.stringify(newBucketPolicy)}`);
                    bucketPolicyProperties.Policy = JSON.stringify(newBucketPolicy)
                } else {
                    if (!ownerIAMRoleARN) {
                        throw new Error(`${fcnName}: Bucket Policy is not defined yet. Please specify ownerIAMRoleARN in the environment variable called AMB_DEVOPS_CHANNEL_S3_IAM_OWNER_ROLE_ARN.`);
                    }

                    let newMemberIAMRoleName = process.env.AMB_DEVOPS_CHANNEL_S3_IAM_JOINER_ROLE_NAME ? process.env.AMB_DEVOPS_CHANNEL_S3_IAM_JOINER_ROLE_NAME : process.env.AMB_DEVOPS_CHANNEL_S3_IAM_OWNER_ROLE_ARN.split(':')[5].split('/')[1];

                    bucketPolicyProperties.Policy = `{
                        "Version": "2012-10-17",
                        "Id": "PermissionsforChannelS3Bucket",
                        "Statement": [
                            {
                                "Sid": "Owner",
                                "Effect": "Allow",
                                "Principal": {
                                    "AWS": ["${ownerIAMRoleARN}"]
                                },
                                "Action": ${JSON.stringify(S3_OWNER_POLICY_ACTIONS)},
                                "Resource": [
                                    "arn:aws:s3:::${channelS3BucketName}",
                                    "arn:aws:s3:::${channelS3BucketName}/*"
                                ]
                            },
                            {
                                "Sid": "${S3_READ_ACCESS_POLICY_SID}",
                                "Effect": "Allow",
                                "Principal": {
                                    "AWS": ["arn:aws:iam::${newMemberAccountId}:role/${newMemberIAMRoleName}"]
                                },
                                "Action": ${JSON.stringify(S3_READ_POLICY_ACTIONS)},
                                "Resource": [
                                    "arn:aws:s3:::${channelS3BucketName}",
                                    "arn:aws:s3:::${channelS3BucketName}/${readObjectPfx}*"
                                ]
                            },
                            {
                                "Sid": "${S3_WRITE_ACCESS_POLICY_SID}-${newMemberAccountId}",
                                "Effect": "Allow",
                                "Principal": {
                                    "AWS": ["arn:aws:iam::${newMemberAccountId}:role/${newMemberIAMRoleName}"]
                                },
                                "Action": ${JSON.stringify(S3_WRITE_POLICY_ACTIONS)},
                                "Resource": [
                                    "arn:aws:s3:::${channelS3BucketName}",
                                    "arn:aws:s3:::${channelS3BucketName}/${writeObjectPfx}*"
                                ]
                            }
                        ]
                    }`
                }

                logger.debug(`${fcnName} Calling S3 putBucketPolicy operation with policy ${bucketPolicyProperties.Policy}`);
                await s3.putBucketPolicy(bucketPolicyProperties).promise();
                //logger.debug(JSON.stringify(bucketPolicyProperties));

                //Done
                resolve(true);
            } catch (err) {
                logger.error(`${fcnName}: Error updating bucket policy of ${channelS3BucketName} with accountId ${newMemberAccountId}: ${err}`)
                resolve(null);
            }
        });
    };

    //Helper function to revoke write access to objects in S3.
    revokeWriteBucketPolicy(channelS3BucketName, memberAccountId) {
        const fcnName = "[S3Client.revokeWriteBucketPolicy]";
        const self = this;
        const s3 = self.__s3;

        return new Promise(async (resolve, reject) => {
            try {
                if (!channelS3BucketName) {
                    throw new Error(`${fcnName}: Please specify value for "channelS3BucketName" parameter`);
                }
                if (!memberAccountId) {
                    throw new Error(`${fcnName}: Please specify value for "newMemberAccountId" parameter`);
                }

                const bucketPolicyProperties = {
                    Bucket: channelS3BucketName
                }

                const currentBucketPolicy = await this.getBucketPolicy(channelS3BucketName);
                logger.debug(`${fcnName} Retrieved bucket policy: ${JSON.stringify(currentBucketPolicy)}`);

                // Don't ask why...
                let newBucketPolicy = JSON.parse(JSON.stringify(currentBucketPolicy));

                for (let i = 0; i < currentBucketPolicy.Statement.length; i++) {
                    if (currentBucketPolicy.Statement[i].Sid === `${S3_WRITE_ACCESS_POLICY_SID}-${memberAccountId}`) {
                        newBucketPolicy.Statement.splice(i, 1);
                    }
                }

                bucketPolicyProperties.Policy = JSON.stringify(newBucketPolicy);
                logger.debug(`${fcnName} Calling S3 putBucketPolicy operation`);
                await s3.putBucketPolicy(bucketPolicyProperties).promise();
                //logger.debug(JSON.stringify(bucketPolicyProperties));

                //Done
                resolve(true);
            } catch (err) {
                logger.error(`${fcnName}: Error updating bucket policy of ${channelS3BucketName} with accountId ${memberAccountId}: ${err}`)
                resolve(null);
            }
        });
    };

    //Helper function to get something like source code from S3.
    getBucketPolicy(channelS3BucketName) {
        const fcnName = "[S3Client.getBucketPolicy]";
        const self = this;
        const s3 = self.__s3;

        return new Promise(async (resolve, reject) => {
            try {
                if (!channelS3BucketName) {
                    throw new Error(`${fcnName}: Please specify value for "channelS3BucketName" parameter`);
                }

                //   Put bucket policy
                const bucketProperties = {
                    Bucket: channelS3BucketName
                }

                logger.debug(`${fcnName} Calling S3 getBucketPolicy operation`);
                const bucketPolicyObject = await s3.getBucketPolicy(bucketProperties).promise();
                logger.debug(`${fcnName} Retrieved bucket policy: ${JSON.stringify(bucketPolicyObject)}`);
                const bucketPolicy = bucketPolicyObject.Policy ? JSON.parse(bucketPolicyObject.Policy) : null
                //logger.debug(JSON.stringify(bucketProperties));

                //Done
                resolve(bucketPolicy);
            } catch (err) {
                logger.error(`${fcnName}: Error getting bucket policy of ${channelS3BucketName}: ${err}`)
                resolve(null);
            }
        });
    };
}