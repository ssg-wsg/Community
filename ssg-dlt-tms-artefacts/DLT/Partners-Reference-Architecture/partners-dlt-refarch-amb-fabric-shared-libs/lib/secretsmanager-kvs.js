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
const logger = require("./logging").getLogger("secrets-manager");

module.exports = class SecretsManagerKVS {
    constructor(params) {
        var self = this;
        return new Promise(async (resolve, reject) => {
            self.__sm = new AWS.SecretsManager();
            self.__values = {}; /*Will store cached values of the secrets*/
            self.prefix = params ? params.prefix + "/" : "/amb/";

            resolve(self);
        });
    }

    // Get parameter from parameter store by Id
    getValue(key) {
        const fcnName = "[SecretsManagerKVS.getValue]";
        const self = this;

        let keyType = null;
        if (key.search("-priv") >= 0) {
            keyType = "-priv";
        }
        if (key.search("-pub") >= 0) {
            keyType = "-pub";
        }
        const paramId = self.prefix + key;
        const sm = self.__sm;

        return new Promise(async (resolve, reject) => {

            // Retrieving cached value first if it exists
            if (self.__values[paramId]) {
                resolve(self.__values[paramId]);
            } else if (keyType === "-pub") {
                resolve(null);
            } else {
                const params = {
                    SecretId: paramId /* required */
                    // VersionId: 'STRING_VALUE',
                    // VersionStage: 'STRING_VALUE'
                };
                await sm.getSecretValue(params, (err, data) => {
                    if (err) {
                        resolve(null);
                        //throw new Error(`${fcnName}: Secret ID: ${params.SecretId} ;${err}`)
                    } else {
                        if (typeof data.SecretString == "string") {
                            let secretString = "";
                            //Checking if data.SecretString is parsable to JSON
                            try {
                                secretString = JSON.parse(data.SecretString);
                            } catch (e) {
                                secretString = data.SecretString;
                            }
                            let value = secretString;
                            //logger.debug(`${fcnName} Value received: ${JSON.stringify(value)}`);
                            self.__values[paramId] = value;
                            resolve(value);
                        } else {
                            reject(`${fcnName}: Currently support secret values of string type only`);
                        }
                    }
                });
            }
        });
    }

    //Put parameter to Parameter Store by Id
    setValue(key, value) {
        const fcnName = "[SecretsManagerKVS.setValue]";
        const self = this;

        let keyType = null;
        if (key.search("-priv") >= 0) {
            keyType = "-priv";
        }
        if (key.search("-pub") >= 0) {
            keyType = "-pub";
        }
        const paramId = self.prefix + key;

        const data = typeof value === "string" ? value : JSON.stringify(value);
        const sm = self.__sm;

        return new Promise(async (resolve, reject) => {

            let value = data;

            const params = {
                SecretId: paramId,
                /* required */
                // ClientRequestToken: 'STRING_VALUE',
                // SecretBinary: Buffer.from('...') || 'STRING_VALUE' /* Strings will be Base-64 encoded on your behalf */ ,
                SecretString: value,
                // VersionStages: [
                //     'STRING_VALUE',
                //     /* more items */
                // ]
            };
            if (keyType !== "-pub") {
                sm.putSecretValue(params, (err, data) => {
                    if (err) {
                        if (err.code === 'ResourceNotFoundException') {
                            // If secret does not exist, create one
                            const params = {
                                //ClientRequestToken: "EXAMPLE1-90ab-cdef-fedc-ba987SECRET1",
                                Description: "Secret for Amazon Managed Blockchain service",
                                Name: paramId,
                                SecretString: value
                            };
                            sm.createSecret(params, (err, data) => {
                                if (err) {
                                    reject(`${fcnName}: Secret ID: ${params.SecretId} ;${err}`);
                                    throw new Error(`${fcnName}: Secret ID: ${params.SecretId} ;${err}`)
                                } else {
                                    self.__values = value;
                                    resolve(value);
                                }
                            })
                        } else {
                            logger.error(`${fcnName}: Secret ID: ${params.SecretId} ;${err}`)
                            resolve(null);
                            //throw new Error(`${fcnName}: Secret ID: ${params.SecretId} ;${err}`)
                        }
                    } else {
                        //If all Ok, we update cached value as well
                        self.__values = value;
                        resolve(value);
                    }
                });
            } else {
                resolve(value);
            }
        });
    };
}