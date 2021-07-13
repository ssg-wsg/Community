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

/*
This Lambda installs chaincode on peer nodes belonging to channels. The function is typically triggered
with a single chaincode package that is deployed across an array of peers and an array of channels.

See event.json for a sample event message.

It is typically preceded by fcn-publish-chaincode, which packages a single chaincode package
*/

const YAML = require("yaml");
const logger = require("/opt/nodejs/lib/logging").getLogger("install-chaincode");
const Config = require("./config");
const ParameterStoreKVS = require("/opt/nodejs/lib/parameterstore-kvs");
const ConnectionProfile = require("/opt/nodejs/lib/connection-profile");
const HFCClient = require("/opt/nodejs/lib/hfc-cli-client.js");
const S3Client = require("/opt/nodejs/lib/s3-client.js");
const ChaincodeConfigManager = require("/opt/nodejs/lib/chaincode-config-manager");
const Utils = require("/opt/nodejs/lib/utils");
const Util = require('util');
const fs = require('fs-extra');

const emptyDir = Util.promisify(fs.emptyDir);

const WORK_DIR = "/tmp"

exports.handler = async (event, context) => {

    const fcnName = "[install-chaincode]";

    logger.debug(`event: ${JSON.stringify(event)}`);
    logger.debug(`context: ${JSON.stringify(context)}`);
    return new Promise(async (resolve, reject) => {
        try {
            const config = await new Config(event, context, WORK_DIR);

            logger.debug(`Config Object: ${JSON.stringify(config)}`);

            // Initializing Connection Profile
            const connectionProfilePMS = await new ParameterStoreKVS({
                prefix: `/amb/${config.networkId}/${config.memberId}`
            });
            const cp = await new ConnectionProfile(connectionProfilePMS);
            const connectionProfile = await cp.getConnectionProfile();
            logger.debug(`Connection Profile Object: ${JSON.stringify(connectionProfile)}`);

            // If an array of channels was not passed into the function handler, get the channels from the connection profile
            if (!config.channelsNamesArray) {
                const channelsMap = cp.getChannelsProfiles();
                if (!channelsMap) {
                    resolve();
                    throw new Error(` Channel Profiles are not present in the connection profile, nor were they passed into this function`);
                }
                config.channelsNamesArray = [];
                await Utils.__objectIterator(channelsMap, async (channelName, channelConfig) => {
                    config.channelsNamesArray.push(channelName);
                })
            }

            let processedChaincodesAndPeers = []; // [{chaincodeName: CHAINCODE_NAME, peersNames:[PEER_NAME1, PEER_NAME2]}]
            let peersProcessed = [];
            let processedChannels = [];
            await Promise.all(config.channelsNamesArray.map(async (channelName) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        logger.debug(`${fcnName} Installing on peers for channel ${channelName}`);
                        const channelProfile = cp.getChannelProfile(channelName);
                        if (!channelProfile) {
                            resolve();
                            throw new Error(` Channel Profile is not initialized: ${JSON.stringify(channelProfile)}`);
                        }

                        const s3Client = new S3Client();
                        const channelBucketName = channelProfile.s3BucketName;

                        const ccDeployspecObjectKey = `channels/${channelName}/chaincodes/${config.chaincodeName}/amb-deployspec.yaml`;
                        // If we can't download amb-deployspec for a particular chaincode, it's not published 
                        // on that channel, so skipping that channel
                        let ccPublished = await s3Client.head(channelBucketName, ccDeployspecObjectKey);

                        if (ccPublished === null) {
                            logger.error(`${fcnName} Seems like chaincode ${config.chaincodeName} is not published on ${channelName}. Skipping it.`)
                            resolve();
                        } else {
                            processedChannels.push(channelName);
                            // Downloading amb-deployspec.yaml from channel's S3 bucket
                            const ccDeployspecLocalPath = `${config.workDir}/amb-deployspec.yaml`;
                            const ccDeploySpecFileExists = await fs.pathExists(ccDeployspecLocalPath);
                            if (!ccDeploySpecFileExists) {
                                await s3Client.download(channelBucketName, ccDeployspecObjectKey, ccDeployspecLocalPath)
                            }
                            // Downloading chaincode package from channel's S3 bucket
                            const packageFileName = `${config.chaincodeName}.car`;
                            const packageLocalPath = `${config.workDir}/${packageFileName}`;
                            const packageFileExists = await fs.pathExists(packageLocalPath);
                            if (!packageFileExists) {
                                const packageObjectKey = `channels/${channelName}/chaincodes/${config.chaincodeName}/${packageFileName}`;
                                await s3Client.download(channelBucketName, packageObjectKey, packageLocalPath)

                            }

                            // Initilizing chaincode configuration
                            const chaincodeDeployspecYAML = fs.readFileSync(ccDeployspecLocalPath, 'utf8');
                            const chaincodeDeployspecJSON = await YAML.parse(chaincodeDeployspecYAML);

                            // Remove deployspec channels not in consideration for current incoming event
                            for(var channel in chaincodeDeployspecJSON.channels) {
                                logger.debug('channel in chaincodeDeployspecJSON: ' + channel);
                                if(chaincodeDeployspecJSON.channels.hasOwnProperty(channel)) {
                                    if(!config.channelsNamesArray.includes(channel)) {
                                        delete chaincodeDeployspecJSON.channels[channel];
                                    }
                                }
                            }

                            const chaincodeProfile = await cp.getChaincodeProfile(chaincodeDeployspecJSON.name);
                            logger.debug(`Chaincode Profile Object: ${JSON.stringify(chaincodeProfile)}`);
                            logger.debug(`Raw Chaincode Deployspec Object: ${JSON.stringify(chaincodeDeployspecJSON)}`);
                            const chaincodeConfigManager = new ChaincodeConfigManager(chaincodeDeployspecJSON, chaincodeProfile ? chaincodeProfile.version : null, chaincodeProfile ? chaincodeProfile.newVersion : null);
                            logger.debug(`Chaincode Config Manager Object: ${JSON.stringify(chaincodeConfigManager)}`);

                            // Checking if we are supposed to install on the current channel
                            if (!chaincodeConfigManager.getChannel(channelName)) {
                                logger.info(`${fcnName} Seems like chaincode ${config.chaincodeName} is not supposed to be installed to ${channelName} (not specified in amb-deployspec.yaml). Skipping it.`)
                                resolve();
                            }

                            if (!chaincodeProfile) {
                                logger.debug(`${fcnName} Looks like the chaincode was published, but not reflected in Connection Profile. Creating new profile for it in the Conneciton Profile.`);
                                await cp.setChaincodeProfile(chaincodeConfigManager.generateChaincodeProfile());
                            }

                            // Initializing Fabric Client
                            //
                            const hfcClient = await new HFCClient(cp);
                            const admin = await hfcClient.setAdminUserContext();

                            const peersCandidatesNamesArray = config.peerIds ? config.peerIds : await cp.getPeerNamesArrayByChannelNameAndCurrentOrg(channelName);
                            let peersNamesArray = [];

                            //Checking whether we have already installed our chaincode on those peers
                            if (peersCandidatesNamesArray.length) {
                                await Utils.__arrayIterator(peersCandidatesNamesArray, (peerCandidateName) => {
                                    if (peersProcessed.indexOf(peerCandidateName) < 0) {
                                        peersNamesArray.push(peerCandidateName);
                                        peersProcessed.push(peerCandidateName);
                                    }
                                })
                            }

                            if (peersNamesArray.length) {
                                //try {
                                const chaincodePath = chaincodeConfigManager.getChaincodePath();
                                const metadataPath = chaincodeConfigManager.getMetadataPath();
                                const chaincodePackagePath = packageLocalPath;
                                const chaincodeId = chaincodeConfigManager.getName();
                                const chaincodeLang = chaincodeConfigManager.getLang();
                                const chaincodeVersion = chaincodeConfigManager.getNewVersion();

                                logger.debug(`${fcnName} Installing chaincode with the following params: ${JSON.stringify({
                                    peersNamesArray: peersNamesArray,
                                    chaincodePath: chaincodePath,
                                    metadataPath: metadataPath,
                                    chaincodePackagePath: chaincodePackagePath,
                                    chaincodeId: chaincodeId,
                                    chaincodeLang: chaincodeLang,
                                    chaincodeVersion: chaincodeVersion
                                })}`);

                                //Installing chaincode
                                //
                                await Utils.__arrayIterator(peersNamesArray, async (peerName) => {
                                    try {
                                        await hfcClient.installChaincodeOnPeers([peerName], chaincodePath, chaincodePackagePath, chaincodeId, chaincodeLang, chaincodeVersion, metadataPath);
                                    } catch (err) {
                                        logger.error(`${fcnName} Have problems installing chaincode ${config.chaincodeName} on peer ${peerName}. Skipping it.`)
                                        return
                                    }
                                })

                                //Updating connection profile with marking peers getting chaincode installed
                                //
                                await cp.setChaincodeInstalledOnPeers(chaincodeId, peersNamesArray);

                                //All good, saving all changes to Connection Profile
                                await cp.pushConnectionProfile();

                                //Clearing up the working directory
                                await emptyDir(config.workDir);

                                //Clear the Fabric credentials
                                await hfcClient.clearCryptoMaterial();

                                processedChaincodesAndPeers.push({
                                    chaincodeName: config.chaincodeName,
                                    peersNames: peersProcessed
                                })
                                resolve();
                            }

                        }
                    } catch (err) {
                        await emptyDir(config.workDir);
                        logger.error(`${fcnName} ${err}`);
                        logger.debug(`${err.stack}`);
                        const output = {
                            error: `${fcnName}: ${err}`
                        }
                        reject(JSON.stringify(output));
                        throw err;
                    }
                })
            }));

            //Return useful information. This Lambda may be called by a CodePipeline, a Step Function, or 
            //another orchestrator. In this case we return useful information that can be passed to the next 
            //Lambda in the process
            let output = {
                result: {
                    networkId: config.networkId,
                    memberId: config.memberId,
                    channelsNames: processedChannels,
                    processedChaincodesAndPeers: processedChaincodesAndPeers
                }
            };

            logger.debug(`Finishing lambda execution with output message: ${JSON.stringify(output)}`);

            resolve(JSON.stringify(output));

        } catch (err) {
            await emptyDir(WORK_DIR);
            logger.error(`${fcnName} ${err}`);
            logger.debug(`${err.stack}`);
            const output = {
                error: `${fcnName}: ${err}`
            }
            reject(JSON.stringify(output));
            throw err;
        }
    })
};