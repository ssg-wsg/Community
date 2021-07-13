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

const logger = require("/opt/nodejs/lib/logging").getLogger("delete-amb-node");
const Config = require("./config");
const AMB = require("/opt/nodejs/lib/amb-client");
const ParameterStoreKVS = require("/opt/nodejs/lib/parameterstore-kvs");
const ConnectionProfile = require("/opt/nodejs/lib/connection-profile");

exports.handler = async (event, context) => {
    const fcnName = "[delete-amb-node]";

    const config = await new Config(event);
    logger.debug(`${fcnName} Config Object: ${JSON.stringify(config)}`)

    // Initialize AMB
    const amb = await new AMB();

    return new Promise(async (resolve, reject) => {
        try {
            // Initializing Connection Profile
            const connectionProfilePMS = await new ParameterStoreKVS({
                prefix: `/amb/${config.networkId}/${config.memberId}`
            });
            const cp = await new ConnectionProfile(connectionProfilePMS);

            const cachePeerInfo = await amb.getPeerInfo(config.networkId, config.memberId, config.peerId);
            const channelsNames = await cp.getChannelsByPeerName(config.peerId);
            const chaincodesNames = await cp.getChaincodesByPeerName(config.peerId);

            await amb.deletePeer(config.networkId, config.memberId, config.peerId);
            const peerInfo = await amb.waitForPeerStatusChange(3000, "DELETING", config.networkId, config.memberId, config.peerId);

            const output = {
                result: {
                    networkId: config.networkId,
                    memberId: config.memberId,
                    peerId: config.peerId,
                    status: peerInfo ? peerInfo.Status : "DELETED",
                    availabilityZone: cachePeerInfo ? cachePeerInfo.AvailabilityZone : null,
                    instanceType: cachePeerInfo ? cachePeerInfo.InstanceType : null,
                    channelsNames: channelsNames,
                    chaincodesNames: chaincodesNames
                }
            }

            const peerName = output.result.peerId;
            if (output.result.status === "DELETED") {
                await cp.deletePeerFromCurrentOrg(peerName);
                await cp.deletePeerFromAllChannels(peerName);
                await cp.deletePeerFromAllChaincodes(peerName);
                await cp.deletePeerProfile(peerName);
                await cp.pushConnectionProfile();
            }

            logger.debug(`${fcnName} Output object: ${JSON.stringify(output)}`);

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