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
const logger = require("./logging").getLogger("lambda-client");
const Utils = require("./utils");

module.exports = class Lambda {
    constructor() {
        const fcnName = "[Lambda.constructor]"
        let self = this;
        return new Promise(async (resolve, reject) => {

            try {
                self.Lambda = new AWS.Lambda({
                    maxRetries: 0,
                    httpOptions: {
                        timeout: 900000
                    }
                });
                resolve(self);
            } catch (err) {
                //reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }

    getFullLambdaName(lambdaName) {
        const fcnName = "[Lambda.getFullLambdaName]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                if (!lambdaName || !lambdaName instanceof String || !lambdaName.length) {
                    throw new Error(`Please specify lambdaName, current value: ${JSON.stringify(lambdaName)}`)
                };

                const EMPTY = Symbol("empty");
                let NextMarker = EMPTY;
		        while (NextMarker || NextMarker === EMPTY) {
                    const data = await this.Lambda.listFunctions(
                        {Marker: NextMarker !== EMPTY ? NextMarker : undefined}
                    ).promise();
                    logger.debug(` Total number of Lambda functions: ${JSON.stringify(data.Functions.length)}`);
                    await Utils.__arrayIterator(data.Functions, async (lambdaObject) => {
                        //logger.debug(`Processing Lambda function name: ${lambdaObject.FunctionName}`);
                        if (lambdaObject.FunctionName.startsWith(lambdaName)) {
                            logger.debug(` Found full Lambda function name: ${lambdaObject.FunctionName}`);
                            resolve(lambdaObject.FunctionName);
                        }
                    });
                    NextMarker = data.NextMarker;
                }

                resolve("");
            } catch (err) {
                //reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }

    invoke(lambdaName, lambdaParams) {
        const fcnName = "[Lambda.invoke]"
        let self = this;
        return new Promise(async (resolve, reject) => {

            try {
                if (!lambdaName || !lambdaName instanceof String || !lambdaName.length) {
                    throw `${fcnName} Please specify lambdaName, current value: ${JSON.stringify(lambdaName)}`
                };
                if (!lambdaParams) {
                    throw `${fcnName} Please specify lambdaParams, current value: ${JSON.stringify(lambdaParams)}`
                };

                const fullLambdaName = await this.getFullLambdaName(lambdaName);

                if (!fullLambdaName || !fullLambdaName instanceof String || !fullLambdaName.length) {
                    //reject(`${fcnName} Can't find full Lambda name for function: ${lambdaName} received response: ${JSON.stringify(fullLambdaName)}`);
                    throw `${fcnName} Can't find full Lambda name for function: ${lambdaName} received response: ${JSON.stringify(fullLambdaName)}`;
                }

                const params = {
                    //ClientContext: "lambda-amb-devops",
                    FunctionName: fullLambdaName,
                    InvocationType: "RequestResponse",
                    LogType: "Tail",
                    Payload: typeof lambdaParams === "string" ? lambdaParams : JSON.stringify(lambdaParams)
                };

                logger.debug(`${fcnName} Submitting parameters to Lambda: ${JSON.stringify(params)}`);

                const data = await this.Lambda.invoke(params).promise()

                if (data.StatusCode != 200) {
                    const errorMessage = data.FunctionError ? data.FunctionError : data.Payload;
                    throw errorMessage;
                }
                logger.debug(`Finished lambda execution, received following data: ${JSON.stringify(data)}`);

                const payload = JSON.parse(data.Payload);

                const logResult = (new Buffer(data.LogResult, 'base64')).toString('utf8');

                logger.debug(`${fcnName} Logs from invoked lambda with name ${fullLambdaName}: ${logResult}`);

                if (payload && payload.errorMessage) {
                    //if (!payload.errorMessage.includes("Process exited before completing request")) {
                    //reject(`${fcnName} Received error message from function: ${JSON.stringify(payload.errorMessage)}`);
                    throw `${fcnName} Received error message from function: ${JSON.stringify(payload.errorMessage)}`;
                    // }
                    // logger.debug(`${fcnName} Received premature exit error: ${JSON.stringify(payload.errorMessage)}`)
                }

                resolve(payload);

            } catch (err) {
                //reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
}