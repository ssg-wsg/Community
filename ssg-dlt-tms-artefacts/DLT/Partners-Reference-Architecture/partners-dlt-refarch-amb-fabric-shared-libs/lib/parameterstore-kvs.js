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

const AWS = require('aws-sdk');
const logger = require("./logging").getLogger("parameter-store-kvs");

module.exports = class ParameterStoreKVS {
    constructor(params) {
        var self = this;
        return new Promise(async (resolve, reject) => {
            self.__ssm = new AWS.SSM();
            self.prefix = params ? params.prefix + "/" : "/amb/";
            self.maxRetries = 10;
            resolve(self);
        });
    }

    // Get parameter from parameter store by Id
    getValue(key) {
        const fcnName = "[ParameterStoreKVS.getValue]";
        const self = this;
        const paramId = self.prefix + key;
        const ssm = self.__ssm;

        return new Promise((resolve, reject) => {
            const params = {
                Name: paramId,
                WithDecryption: true
            };
            ssm.getParameter(params, (err, data) => {
                if (err) {
                    logger.error(`${fcnName}: Error: ${err}`);
                    resolve(null);
                    //throw new Error(`${fcnName}: ${err}`)
                } else {
                    resolve(data.Parameter.Value);
                }
            });
        });
    };

    //Put parameter to Parameter Store by Id
    setValue(key, value) {
        const fcnName = "[ParameterStoreKVS.setValue]";
        const self = this;
        const paramId = self.prefix + key;
        const data = value;
        const ssm = self.__ssm;

        return new Promise(async (resolve, reject) => {
            let params = {
                Name: paramId,
                /* required */
                Type: "String",
                /* required */
                Value: data,
                /* required */
                //AllowedPattern: 'STRING_VALUE',
                //Description: 'STRING_VALUE',
                //KeyId: 'STRING_VALUE',
                //Overwrite: true,
                //Policies: 'STRING_VALUE',
                // Tags: [{
                //     Key: 'type',
                //     /* required */
                //     Value: 'blockchain' /* required */
                // }],
                Tier: "Intelligent-Tiering"
            };
            const paramValue = await self.getValue(key);
            // If param does not yet exists in the store, create a new one and tag it
            // else: overwrite existing version.
            if (!paramValue) {
                params.Tags = [{
                    Key: 'type',
                    Value: 'blockchain'
                }]
            } else {
                params.Overwrite = true;
            }

            ssm.putParameter(params, (err, data) => {
                if (err) {
                    if (err.toString().includes("TooManyUpdates")) {
                        this.maxRetries--;
                        if (this.maxRetries == 0) {
                            reject(`${fcnName} ${err}`);
                        }
                        setTimeout(async () => {
                            try {
                                const data = this.setValue(key, value);
                                resolve(data);
                            } catch (err) {
                                reject(`${fcnName} ${err}`);
                            }
                        }, 1000);
                    } else {
                        reject(`${fcnName}: ${err}`);
                    }
                } else {
                    resolve(data);
                }
            });
        });
    };
}