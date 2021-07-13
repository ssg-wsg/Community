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
    constructor(event) {
        const fcnName = "[Config.constructor]";

        return new Promise(async (resolve, reject) => {
            try {

                this.method = event.method
                if (!this.method || !this.method instanceof String || !this.method.length) {
                    throw new Error(` Please specify "method" as a string in the event message`)
                };

                this.params = event.params
                if (!this.params || Object.entries(this.params).length === 0 && this.params.constructor === Object) {
                    throw new Error(` Please specify "params" as an object in the event message`)
                };

                this.id = event.id
                if (!this.id || !this.id instanceof String || !this.id.length) {
                    throw new Error(` Please specify "id" as a string in the event message`)
                };

                this.networkId = event.params.networkId
                if (!this.networkId || !this.networkId instanceof String || !this.networkId.length) {
                    throw new Error(` Please specify "networkId" as a string in the event message`)
                };

                this.memberId = event.params.memberId
                if (!this.memberId || !this.memberId instanceof String || !this.memberId.length) {
                    throw new Error(` Please specify "memberId" as a string in the event message`)
                };

                this.peerId = event.params.peerId
                if (!this.peerId || !this.peerId instanceof String || !this.peerId.length) {
                    throw new Error(` Please specify "peerId" as a string in the event message`)
                };

                resolve(this);

            } catch (err) {
                //reject(`${fcnName}: ${err}`);
                throw Error(`${fcnName}: ${err}`);
            }
        })
    }
}