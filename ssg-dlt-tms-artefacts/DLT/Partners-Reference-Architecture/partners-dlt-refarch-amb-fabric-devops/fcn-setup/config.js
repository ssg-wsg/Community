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

                this.adminName = event.adminName ? event.adminName : null;
                // if (!this.adminName || !this.adminName instanceof String || !this.adminName.length) {
                //     throw new Error(` Please specify adminName in the event message`)
                // };

                this.adminPassword = event.adminPassword ? event.adminPassword : null;
                // if (!this.adminPassword || !this.adminPassword instanceof String || !this.adminPassword.length) {
                //     throw new Error(` Please specify adminPassword in the event message`)
                // };

                this.S3BucketName = event.S3BucketName ? event.S3BucketName : null;

                this.registerEnrollFcnName = process.env.AMB_APPS_REGISTER_ENROLL_FCN_NAME
                if (!this.registerEnrollFcnName || !this.registerEnrollFcnName instanceof String || !this.registerEnrollFcnName.length) {
                    throw new Error(` Please set AMB_APPS_REGISTER_ENROLL_FCN_NAME with function name`)
                };

                resolve(this);

            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw Error(`${fcnName}: ${err}`);
            }
        })
    }
}