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

const logger = require("/opt/nodejs/lib/logging").getLogger("peer-status-check");
const Config = require("./config");
const AMB = require("/opt/nodejs/lib/amb-client");
const CW = require("/opt/nodejs/lib/cloud-watch-client");
const Utils = require("/opt/nodejs/lib/utils");
// const ParameterStoreKVS = require("/opt/nodejs/lib/parameterstore-kvs");
// const ConnectionProfile = require("/opt/nodejs/lib/connection-profile");

// Setting this to default since ListNodes does not support listing peers from non-owner's account
const memberIsOwned = true;

exports.handler = async (event, context) => {

    const fcnName = "[peer-status-check]";
    return new Promise(async (resolve, reject) => {
        try {
            logger.debug(`event: ${JSON.stringify(event)}`);
            logger.debug(`context: ${JSON.stringify(context)}`);

            // Initialize AMB
            const amb = await new AMB(context);

            const config = await new Config(event, amb);

            logger.debug(`Config Object: ${JSON.stringify(config)}`);

            const networkId = config.networkId;
            const memberId = config.memberId;
            const peerAlarmStatusesArray = config.peerAlarmStatusesArray;
            const alarmNamePrefix = config.alarmNamePrefix;

            const ALARM_NAME_PREFIX = `${alarmNamePrefix}NodeAvailability-`;

            // // Initializing Connection Profile
            // const connectionProfilePMS = await new ParameterStoreKVS({
            //     prefix: `/amb/${networkId}/${memberId}`
            // });
            // const cp = await new ConnectionProfile(connectionProfilePMS);

            // Initializing CloudWatch class
            const cw = await new CW(context);

            // Retrieve a list of peers that are not in a requested statuses
            const peers = await amb.getPeersWithStatus(networkId, memberId);

            // Set metrics for those peers that are not in requested statuses
            if (peers && peers.length) {
                await Utils.__arrayIterator(peers, async (peer) => {

                    // Checking if alarm for a certain peer is already set. If not, we set a new alarm for availability metric.
                    const alarmsSet = await cw.describeAlarms(`${ALARM_NAME_PREFIX}${peer.nodeId}`);
                    if (!alarmsSet.length) {
                        if (peer.nodeStatus === "CREATING" || peer.nodeStatus === "AVAILABLE")
                            await cw.putMetricAlarm(config.networkId, config.memberId, `${ALARM_NAME_PREFIX}${peer.nodeId}`, memberIsOwned, peer.nodeId, peer.nodeInstanceType, peer.nodeAvailabilityZone, config.alarmSNSTopicARN)
                    }

                    if (peerAlarmStatusesArray.indexOf(peer.nodeStatus) < 0) {
                        logger.debug(`${fcnName} Setting peer peer.nodeId as normal (value 1)`)
                        await cw.putMetricData(config.networkId, config.memberId, memberIsOwned, peer.nodeId, peer.nodeInstanceType, peer.nodeAvailabilityZone, 1)
                    } else {
                        logger.debug(`${fcnName} Setting peer peer.nodeId as alarming (value 0)`)
                        await cw.putMetricData(config.networkId, config.memberId, memberIsOwned, peer.nodeId, peer.nodeInstanceType, peer.nodeAvailabilityZone, 0)
                    }
                })
            }

            const output = {
                result: {
                    networkId: networkId,
                    memberId: memberId,
                    peers: peers
                }
            }

            logger.debug(`Finishing lambda execution with output message: ${JSON.stringify(output)}`);
            resolve(JSON.stringify(output));
        } catch (err) {
            logger.error(`${fcnName}: ${err}`);
            logger.debug(`${err.stack}`);
            const output = {
                error: `${fcnName}: ${err}`
            }
            reject(JSON.stringify(output));
        }
    })
};