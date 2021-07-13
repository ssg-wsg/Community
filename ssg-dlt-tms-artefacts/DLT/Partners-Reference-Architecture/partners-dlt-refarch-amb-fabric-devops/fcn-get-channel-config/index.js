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

const logger = require("/opt/nodejs/lib/logging").getLogger("get-channel-config");
const Config = require("./config");
const HFCClient = require("/opt/nodejs/lib/hfc-cli-client.js");
const ParameterStoreKVS = require("/opt/nodejs/lib/parameterstore-kvs");
const ConnectionProfile = require("/opt/nodejs/lib/connection-profile");
const S3Client = require("/opt/nodejs/lib/s3-client.js");
const Utils = require("/opt/nodejs/lib/utils.js");

const ADMIN_CREDS_KEY = "adminCreds";

exports.handler = async (event, context) => {

    const fcnName = "[get-channel-config]";

    return new Promise(async (resolve, reject) => {
        try {
            logger.debug(`event: ${JSON.stringify(event)}`);
            logger.debug(`context: ${JSON.stringify(context)}`);

            const config = await new Config(event);
            logger.debug(`${fcnName} Config Object: ${JSON.stringify(config)}`)

            const networkId = config.networkId;
            const memberId = config.memberId;
            const channelName = config.channelName;

            // Initializing Connection Profile
            const connectionProfilePMS = await new ParameterStoreKVS({
                prefix: `/amb/${networkId}/${memberId}`
            });
            const cp = await new ConnectionProfile(connectionProfilePMS);

            const hfcClient = await new HFCClient(cp);
            await hfcClient.setAdminUserContext();

            //Creating new channel
            const channelConfig = await hfcClient.getChannelConfig(channelName);

            //Don't forget to clear cryptomaterial from local file system if we are using CLI
            if (hfcClient.clearCryptoMaterial) {
                await hfcClient.clearCryptoMaterial()
            }

            //Uploading output object to pass to the next Lambda
            const output = {
                result: channelConfig
            }

            logger.debug(`Finishing lambda execution with output message: ${JSON.stringify(output)}`);
            resolve(JSON.stringify(output));

        } catch (err) {
            logger.error(`${fcnName}: ${err}`);
            logger.debug(`${err.stack}`);
            const output = {
                error: `${fcnName}: ${err}`
            }
            reject(JSON.stringify(output));
        }
    });
};