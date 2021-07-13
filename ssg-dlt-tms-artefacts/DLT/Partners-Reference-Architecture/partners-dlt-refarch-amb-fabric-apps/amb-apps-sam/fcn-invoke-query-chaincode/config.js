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

module.exports = class Config {
    constructor(event, context, workDir) {
        const fcnName = "[Config.constructor]";

        return new Promise((resolve, reject) => {
            try {

                this.workDir = workDir ? workDir : "/tmp";

                this.networkId = event.networkId
                if (!this.networkId || !this.networkId instanceof String || !this.networkId.length) {
                    throw new Error(` Please specify networkId in the event message`)
                };

                this.memberId = event.memberId
                if (!this.memberId || !this.memberId instanceof String || !this.memberId.length) {
                    throw new Error(` Please specify memberId in the event message`)
                };

                this.userEnrollmentId = event.userEnrollmentId
                if (!this.userEnrollmentId || !this.userEnrollmentId instanceof String || !this.userEnrollmentId.length) {
                    throw new Error(` Please specify userEnrollmentId in the event message`)
                };

                this.chaincodeName = event.chaincodeName
                if (!this.chaincodeName || !this.chaincodeName instanceof String || !this.chaincodeName.length) {
                    throw new Error(` Please specify chaincodeName in the event message`)
                };

                this.channelName = event.channelName
                if (!this.channelName || !this.channelName instanceof String || !this.channelName.length) {
                    throw new Error(` Please specify channelName in the event message`)
                };

                this.triggerType = event.triggerType
                if (["INVOKE", "QUERY"].indexOf(this.triggerType) < 0) {
                    throw new Error(` Please specify triggerType in the event message as "INVOKE" or "QUERY"`)
                };

                this.isInvoke = this.triggerType === "INVOKE"

                this.functionName = event.functionName
                if (!this.functionName || !this.functionName instanceof String || !this.functionName.length) {
                    throw new Error(` Please specify functionName in the event message`)
                };

                this.args = event.args ? event.args : "";

                this.transientMap = event.transientMap ? event.transientMap : "";

                resolve(this);

            } catch (err) {
                throw Error(`${fcnName}: ${err}`);
            }
        })
    }
}