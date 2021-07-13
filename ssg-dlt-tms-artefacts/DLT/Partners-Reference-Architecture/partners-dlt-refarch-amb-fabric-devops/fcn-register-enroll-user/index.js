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
const ParameterStoreKVS = require("/opt/nodejs/lib/parameterstore-kvs");
const ConnectionProfile = require("/opt/nodejs/lib/connection-profile");
const HFCClient = require("/opt/nodejs/lib/hfc-cli-client.js");

exports.handler = async (event, context) => {

    const fcnName = "[register-enroll-user]";
    return new Promise(async (resolve, reject) => {
        try {
            logger.debug(`event: ${JSON.stringify(event)}`);
            logger.debug(`context: ${JSON.stringify(context)}`);

            const config = await new Config(event);

            logger.debug(`Config Object: ${JSON.stringify(config)}`);

            const registerEnrollFcnName = config.registerEnrollFcnName;

            // Initializing Connection Profile
            const connectionProfilePMS = await new ParameterStoreKVS({
                prefix: `/amb/${config.networkId}/${config.memberId}`
            });

            const cp = await new ConnectionProfile(connectionProfilePMS);

            const conectionProfile = await cp.getConnectionProfile();

            logger.debug(`${fcnName} Setting HFCClient to register and enroll Admin User if it doesn't exist`);
            //const hfcClient = await new HFCClient(conectionProfile, bcAdminCreds.name, bcAdminCreds.password, SecretsManagerKVS, secretsManagerOptions, usersPMS);
            hfcClient = await new HFCClient(cp);
            if (config.register) {
                await hfcClient.setAdminUserContext();
            }
            const user = await hfcClient.registerAndEnrollUser(config.name, config.register, config.enroll, "", config.isAdmin);

            const output = {
                result: user
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