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
const Utils = require("/opt/nodejs/lib/utils");

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

                this.peerAlarmStatusesArray = event.peerAlarmStatusesArray;
                if (this.peerAlarmStatusesArray && this.peerAlarmStatusesArray.length) {

                    // A workaround when we receive events from CloudWatch, since we only can get strings.
                    if (typeof this.peerAlarmStatusesArray === "string") {
                        // Remove [ and ] if they exist
                        if (this.peerAlarmStatusesArray.startsWith("[") || this.peerAlarmStatusesArray.endsWith("]")) {
                            this.peerAlarmStatusesArray = this.peerAlarmStatusesArray.substring(1, this.peerAlarmStatusesArray.length - 1)
                        }
                        this.peerAlarmStatusesArray = this.peerAlarmStatusesArray.split(",");
                    }
                    await Utils.__arrayIterator(this.peerAlarmStatusesArray, (peerStatus) => {
                        if (["CREATING", "AVAILABLE", "CREATE_FAILED", "DELETING", "DELETED", "FAILED"].indexOf(peerStatus) < 0) {
                            throw new Error(`${fcnName} Please make sure specified value for "peerStatus" property is one of following: "CREATING", "AVAILABLE", "CREATE_FAILED", "DELETING", "DELETED", "FAILED". Received status: ${peerStatus}`)
                        };
                    })
                } else {
                    throw new Error(`${fcnName} Please provide an array of peer statuses that should not trigger actions. Current value: ${JSON.stringify(this.peerAlarmStatusesArray)}`)
                }

                this.alarmSNSTopicARN = event.alarmSNSTopicARN
                if (!this.alarmSNSTopicARN || !this.alarmSNSTopicARN instanceof String || !this.alarmSNSTopicARN.length) {
                    throw new Error(` Please specify alarmSNSTopicARN in the event message`)
                };

                this.alarmNamePrefix = process.env.AMB_DEVOPS_CW_ALARM_NAME_PREFIX ? `${process.env.AMB_DEVOPS_CW_ALARM_NAME_PREFIX}-` : ""


                resolve(this);

            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw Error(`${fcnName}: ${err}`);
            }
        })
    }
}