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

const logger = require("/opt/nodejs/lib/logging").getLogger("setup");
const Config = require("./config");
const AMB = require("/opt/nodejs/lib/amb-client");
const ParameterStoreKVS = require("/opt/nodejs/lib/parameterstore-kvs");
const ConnectionProfile = require("/opt/nodejs/lib/connection-profile");
const SecretsManagerKVS = require("/opt/nodejs/lib/secretsmanager-kvs");
const Lambda = require("/opt/nodejs/lib/lambda-client");
const S3Client = require("/opt/nodejs/lib/s3-client.js");
const ADMIN_CREDS_KEY = "adminCreds";

exports.handler = (event, context) => {

    const fcnName = "[setup]";
    return new Promise(async (resolve, reject) => {
        try {
            logger.debug(`event: ${JSON.stringify(event)}`);
            logger.debug(`context: ${JSON.stringify(context)}`);

            // Initialize AMB
            const amb = await new AMB();

            const config = await new Config(event, amb);

            logger.debug(`Config Object: ${JSON.stringify(config)}`);


            //const connectionProfile = await cp.getConnectionProfile();

            const ambNetworkProfile = await amb.getFullNetworkInfo(config.networkId);

            let newConnectionProfile = await amb.generateConnectionProfile(ambNetworkProfile);

            // Initializing Connection Profile
            const connectionProfilePMS = await new ParameterStoreKVS({
                prefix: `/amb/${newConnectionProfile.amb.networkId}/${newConnectionProfile.amb.memberId}`
            });
            const cp = await new ConnectionProfile(connectionProfilePMS, newConnectionProfile);

            logger.debug(`${fcnName} Generated new connection profile: ${JSON.stringify(await cp.getConnectionProfile())}`);

            await cp.pushConnectionProfile();

            if (config.adminName && config.adminPassword) {
                //Enrolling Admin User if user specified username/password and in case it's not enrolled yet
                const secretsManagerOptions = {
                    prefix: `/amb/${cp.getAmbNetworkId()}/${cp.getAmbMemberId()}/users`
                };
                const secretsManager = await new SecretsManagerKVS(secretsManagerOptions);

                let bcAdminCreds = await secretsManager.getValue(ADMIN_CREDS_KEY);
                logger.debug(`${fcnName} Got value for adminCreds from Secrets Manager: ${JSON.stringify(bcAdminCreds)}`);

                if (!bcAdminCreds) {
                    logger.debug(`${fcnName} Looks like adminCreds are not set in Secrets Manager. Creating a new record.`);
                    bcAdminCreds = {
                        name: config.adminName,
                        password: config.adminPassword
                    }
                    const value = await secretsManager.setValue(ADMIN_CREDS_KEY, bcAdminCreds);
                    logger.debug(`${fcnName} We created a new record for adminCreds: ${JSON.stringify(value)}`);
                }

                const registerEnrollFcnName = config.registerEnrollFcnName;

                //Calling user registration lambda since we have to make sure we execute it from the subnet connected to AMB
                const lambda = await new Lambda();
                const adminUserEnrollmentStr = await lambda.invoke(registerEnrollFcnName, {
                    networkId: cp.getAmbNetworkId(),
                    memberId: cp.getAmbMemberId(),
                    name: config.adminName,
                    password: config.adminPassword,
                    register: false,
                    enroll: true,
                    isAdmin: true
                });

                logger.debug(`${fcnName} Admin user registration result: ${adminUserEnrollmentStr}`);
                //const adminUserEnrollmentResult = JSON.parse(adminUserEnrollmentStr);
            }

            // if (config.S3BucketName) {
            //     logger.debug(`${fcnName} Looks like we need to create a new s3 bucket with the name ${config.S3BucketName}`);
            //     const s3Client = await new S3Client();
            //     await s3Client.createBucket(config.S3BucketName);
            // }

            const output = {
                result: {
                    connectionProfile: await cp.getConnectionProfile()
                }
            }

            logger.debug(`${fcnName} Finishing lambda execution with output message: ${JSON.stringify(output)}`);
            resolve(JSON.stringify(output));
        } catch (err) {
            logger.error(`${fcnName}: ${err}`);
            logger.debug(`${err.stack}`);
            const output = {
                error: `${fcnName}: ${err}`
            }
            reject(JSON.stringify(output));
        }
    })
};