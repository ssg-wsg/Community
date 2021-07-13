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
            this.workDir = workDir ? workDir : "/tmp";

            this.networkId = event.networkId
            if (!this.networkId || !this.networkId instanceof String || !this.networkId.length) {
                throw new Error(` Please specify networkId in the event message`)
            };

            this.memberId = event.memberId
            if (!this.memberId || !this.memberId instanceof String || !this.memberId.length) {
                throw new Error(` Please specify memberId in the event message`)
            };

            // While networkId and memberId are mandatory, the other parameters here are optional.
            // If they are not provided we will read them from the connection profile in index.js
            if (event.peerId && typeof event.peerId == "string" && event.peerId.length) {
                this.peerId = event.peerId
            };

            if (event.peerIds && typeof event.peerIds == "object" && event.peerIds.length) {
                this.peerIds = event.peerIds
            };

            if (event.chaincodeName) {
                this.chaincodeName = event.chaincodeName
            };

            if (event.channelsNames) {
                this.channelsNamesArray = event.channelsNames
            }
            // if (!this.channelsNamesArray || !this.channelsNamesArray instanceof Array || !this.channelsNamesArray.length) {
            //     throw new Error(` Please specify channelsNamesArray array in the event message`)
            // };

            resolve(this)
        })
    }
}