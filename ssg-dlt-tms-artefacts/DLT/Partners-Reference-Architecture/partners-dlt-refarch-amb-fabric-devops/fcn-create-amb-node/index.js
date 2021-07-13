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

const logger = require("/opt/nodejs/lib/logging").getLogger("recreate-amb-node");
const Config = require("./config");
const AMB = require("/opt/nodejs/lib/amb-client");
const ParameterStoreKVS = require("/opt/nodejs/lib/parameterstore-kvs");
const ConnectionProfile = require("/opt/nodejs/lib/connection-profile");

exports.handler = async (event, context) => {

    const fcnName = "[recreate-amb-node]";
    return new Promise(async (resolve, reject) => {
        try {
            logger.debug(`event: ${JSON.stringify(event)}`);
            logger.debug(`context: ${JSON.stringify(context)}`);

            // Initialize AMB
            const amb = await new AMB();

            const config = await new Config(event, amb);

            logger.debug(`Config Object: ${JSON.stringify(config)}`);

            // Initializing Connection Profile
            const connectionProfilePMS = await new ParameterStoreKVS({
                prefix: `/amb/${config.networkId}/${config.memberId}`
            });
            const cp = await new ConnectionProfile(connectionProfilePMS);
            const connectionProfile = await cp.getConnectionProfile();
            logger.debug(`Connection Profile Object: ${JSON.stringify(connectionProfile)}`);

            //Create the new peer with availabilityZone, instanceType as for the old peer
            const newPeerId = await amb.createPeer(config.networkId, config.memberId, config.availabilityZone, config.instanceType)

            //const newPeerId = "nd-VJN5L6BMK5H3XFXF4N3SLW6AZM";
            logger.debug(`${fcnName} Created new peer with Id: ${JSON.stringify(newPeerId)}`);

            const newPeerInfo = await amb.waitForPeerStatusChange(3000, "CREATING", config.networkId, config.memberId, newPeerId);

            if (newPeerInfo) {
                if (newPeerInfo.Status !== "AVAILABLE") {
                    throw new Error(`${fcnName} Got problems creating new peer. Full peer information object: ${JSON.stringify(newPeerInfo)}`)
                }
            } else {
                throw new Error(`${fcnName} Got problems creating new peer. Peer information from AMB is not available.`)
            }
            const newPeerProfile = await cp.generatePeerProfile(newPeerInfo);

            logger.debug(`${fcnName} Generated new peer profile: ${JSON.stringify(newPeerProfile)}`);

            //Add new peer details to Connection Profile
            await cp.setPeerToCurrentOrg(newPeerId);
            await cp.setPeerProfile(newPeerProfile);

            logger.debug(`${fcnName} Generated new connection profile: ${JSON.stringify(await cp.getConnectionProfile())}`);

            await cp.pushConnectionProfile();

            const output = {
                result: {
                    networkId: config.networkId,
                    memberId: config.memberId,
                    peerId: newPeerId,
                    status: newPeerInfo.Status,
                    channelsNames: config.channelsNames ? config.channelsNames : [],
                    chaincodesNames: config.chaincodesNames ? config.chaincodesNames : []
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