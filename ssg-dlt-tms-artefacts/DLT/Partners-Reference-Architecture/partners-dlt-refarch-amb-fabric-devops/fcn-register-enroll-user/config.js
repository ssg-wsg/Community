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

                this.name = event.name;
                if (!this.name || !this.name instanceof String || !this.name.length) {
                    throw new Error(` Please specify parameter "name" in the event message`)
                };

                this.password = event.password ? event.password : null;
                // if (!this.password || !this.password instanceof String || !this.password.length) {
                //     throw new Error(` Please specify password in the event message`)
                // };

                this.register = true;
                this.enroll = true;
                this.isAdmin = false;

                if (event.register === false) {
                    this.register = false;
                }
                if (event.enroll === false) {
                    this.enroll = false;
                }
                if (event.isAdmin === true) {
                    this.isAdmin = true;
                }

                resolve(this);

            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw Error(`${fcnName}: ${err}`);
            }
        })
    }
}