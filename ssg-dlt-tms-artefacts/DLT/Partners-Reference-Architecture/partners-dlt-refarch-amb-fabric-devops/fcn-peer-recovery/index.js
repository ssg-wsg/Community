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

const logger = require("/opt/nodejs/lib/logging").getLogger("fcn-peer-recovery");
const Config = require("./config");
const Lambda = require("/opt/nodejs/lib/lambda-client");
const ParameterStoreKVS = require("/opt/nodejs/lib/parameterstore-kvs");
const ConnectionProfile = require("/opt/nodejs/lib/connection-profile");
const Utils = require("/opt/nodejs/lib/utils");

exports.handler = (event, context) => {
    const fcnName = "[fcn-peer-recovery]";

    logger.debug(`event: ${JSON.stringify(event)}`);
    logger.debug(`context: ${JSON.stringify(context)}`);

    return new Promise(async (resolve, reject) => {
        try {
            const config = await new Config(event);
            logger.debug(`Config Object: ${JSON.stringify(config)}`);

            const deleteAMBNodeFcnName = config.deleteAMBNodeFcnName;
            const createAMBNodeFcnName = config.createAMBNodeFcnName;
            const joinChannelsFcnName = config.joinChannelsFcnName;
            const installChaincodeFcnName = config.installChaincodeFcnName;

            const lambda = await new Lambda();

            // Initializing Connection Profile
            const connectionProfilePMS = await new ParameterStoreKVS({
                prefix: `/amb/${config.networkId}/${config.memberId}`
            });
            const cp = await new ConnectionProfile(connectionProfilePMS);
            const connectionProfile = await cp.getConnectionProfile();
            logger.debug(`Connection Profile Object: ${JSON.stringify(connectionProfile)}`);

            // Checking if another peer recovery function is currently running.
            const faultyPeersInfo = await cp.getFaultyPeersInfo();
            if (faultyPeersInfo) {
                throw new Error(`${fcnName} Seems like another peer recovery function is running for peer ${JSON.stringify(faultyPeersInfo)}. Failing this one. Please restart once another function is over or after you manually delete faulty peer info from Connection Profile.`)
            }

            // If we don't own current member, we just delete that peer from connection profile
            if (!config.accountOwnsMember) {
                await cp.deletePeerFromAllChaincodes(config.peerId);
                await cp.deletePeerFromAllChannels(config.peerId);
                await cp.deletePeerProfile(config.peerId);
                // TODO: Add function cp.deletePeerFromOrg(config.peerId, config.memberId)
                await cp.pushConnectionProfile();

                const output = {
                    result: {
                        networkId: config.networkId,
                        memberId: config.memberId,
                        peerId: config.peerId
                    }
                }
                resolve(output);
            }

            //Save faulty peer details to config: Channels Joined; Chaincodes installed; availability zone; size
            await cp.setFaultyPeerInfo(config.peerId, config.availabilityZone, config.instanceType);
            await cp.pushConnectionProfile();

            //Trigger Lambda: Delete faulty peer
            const peerDeletionResultStr = await lambda.invoke(deleteAMBNodeFcnName, {
                networkId: config.networkId,
                memberId: config.memberId,
                peerId: config.peerId,
                availabilityZone: config.availabilityZone,
                instanceType: config.instanceType
            });
            logger.debug(`${fcnName} Deletion results object: ${peerDeletionResultStr}`);
            const peerDeletionResult = JSON.parse(peerDeletionResultStr);

            await config.setChannelsNames(peerDeletionResult.result.channelsNames);
            await config.setChaincodesNames(peerDeletionResult.result.chaincodesNames);

            //Setting timeout to avoid expcetion on max number of allowed peers
            await Utils.__timeout(1000);

            //Trigger Lambda: Create new peer with size and zone of the old one
            const peerCreationResultStr = await lambda.invoke(createAMBNodeFcnName, {
                networkId: config.networkId,
                memberId: config.memberId,
                availabilityZone: config.availabilityZone,
                instanceType: config.instanceType
            });
            logger.debug(`${fcnName} Creation results object: ${peerCreationResultStr}`);

            const peerCreationResult = JSON.parse(peerCreationResultStr);

            await config.setNewPeerId(peerCreationResult.result.peerId);

            //Setting timeout to let the peer to settle
            await Utils.__timeout(15000);

            //Trigger Lambda: Join new peer to channels of the old peer
            let joinChannelsResult;
            if (config.channelsNames.length) {
                const joinChannelsResultStr = await lambda.invoke(joinChannelsFcnName, {
                    networkId: config.networkId,
                    memberId: config.memberId,
                    peerId: config.newPeerId,
                    channelsNames: config.channelsNames,
                    chaincodesNames: config.chaincodesNames
                });
                logger.debug(`${fcnName} Joining channels results object: ${joinChannelsResultStr}`);
                joinChannelsResult = JSON.parse(joinChannelsResultStr);
            }

            //Trigger Lambda: Install chaincodes from the old peer
            let installChaincodesResult = [];

            if (config.chaincodesNames.length) {
                await Utils.__arrayIterator(config.chaincodesNames, async (chaincodeName) => {
                    logger.debug(`${fcnName} Installing chaincode: ${chaincodeName}`);
                    const installChaincodesResultStr = await lambda.invoke(installChaincodeFcnName, {
                        networkId: config.networkId,
                        memberId: config.memberId,
                        peerIds: [config.newPeerId],
                        channelsNames: config.channelsNames,
                        chaincodeName: chaincodeName
                    });
                    logger.debug(`${fcnName} Installing chaincode ${chaincodeName} results object: ${installChaincodesResultStr}`);
                    installChaincodesResult.push(JSON.parse(installChaincodesResultStr));
                })
            }

            //Update profile config
            await cp.pullConnectionProfile();

            //Delete faulty peer from profile
            await cp.removeFaultyPeerInfo(config.peerId);
            await cp.pushConnectionProfile();

            let output = peerCreationResult;
            if (joinChannelsResult.length) {
                output = joinChannelsResult;
            }
            if (installChaincodesResult.length) {
                output = installChaincodesResult;
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