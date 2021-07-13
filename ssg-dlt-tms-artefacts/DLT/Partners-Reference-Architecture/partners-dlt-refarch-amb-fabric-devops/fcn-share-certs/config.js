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

const logger = require("/opt/nodejs/lib/logging").getLogger("config");

module.exports = class Config {
    constructor(event, amb) {
        const fcnName = "[Config.constructor]";

        return new Promise(async (resolve, reject) => {
            try {

                this.networkId = event.networkId
                if (!this.networkId || !this.networkId instanceof String || !this.networkId.length) {
                    throw new Error(` Please specify networkId in the event message`)
                };

                this.memberId = event.memberId
                if (!this.memberId || !this.memberId instanceof String || !this.memberId.length) {
                    throw new Error(` Please specify memberId in the event message`)
                };

                // this.adminUsername = event.adminUsername
                // if (!this.adminUsername || !this.adminUsername instanceof String || !this.adminUsername.length) {
                //     throw new Error(` Please specify adminUsername in the event message`)
                // };

                // this.channelBucketName = event.channelBucketName
                // if (!this.channelBucketName || !this.channelBucketName instanceof String || !this.channelBucketName.length) {
                //     throw new Error(` Please specify channelBucketName in the event message`)
                // };

                // this.channel = event.channel
                // if (!this.channel || !this.channel instanceof String || !this.channel.length) {
                //     throw new Error(` Please specify channel in the event message`)
                // };

                const connectionProfileUpdate = typeof event.connectionProfileUpdate === "string" ? JSON.parse(event.connectionProfileUpdate) : event.connectionProfileUpdate;
                if (!connectionProfileUpdate) {
                    throw new Error(` Please specify connectionProfileUpdate in the event message`)
                };

                if (connectionProfileUpdate.connectionProfileUpdate) {
                    this.connectionProfileUpdate = connectionProfileUpdate.connectionProfileUpdate;
                } else {
                    this.connectionProfileUpdate = connectionProfileUpdate
                }
                if (!this.connectionProfileUpdate.channelProfile) {
                    throw new Error(` Please specify connectionProfileUpdate.channelProfile in the event message`)
                };
                if (!this.connectionProfileUpdate.endorsingPeerProfiles) {
                    throw new Error(` Please specify connectionProfileUpdate.endorsingPeerProfiles in the event message`)
                };
                if (!this.connectionProfileUpdate.organizationProfile) {
                    throw new Error(` Please specify connectionProfileUpdate.organizationProfile in the event message`)
                };

                this.awsAccountId = process.env.AMB_ACCOUNT_ID
                if (!this.awsAccountId) {
                    throw new Error(` Please set AMB_ACCOUNT_ID environmental variable with the current AWS account Id`)
                };

                resolve(this);

            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw Error(`${fcnName}: ${err}`);
            }
        })
    }
}