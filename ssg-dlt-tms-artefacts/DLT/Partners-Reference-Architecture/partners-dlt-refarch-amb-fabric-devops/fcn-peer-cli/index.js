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

const logger = require("/opt/nodejs/lib/logging").getLogger("peer-cli");
const Config = require("./config");
const Utils = require(`./lib/utils`);
const HFCClient = require(`./lib/hfc-cli-client`);

exports.handler = async (event, context) => {

    const fcnName = "[peer-cli]";
    return new Promise(async (resolve, reject) => {
        let ID = ""
        try {
            logger.debug(`${fcnName} Event: ${JSON.stringify(event)}`);
            logger.debug(`${fcnName} Context: ${JSON.stringify(context)}`);

            const config = await new Config(event);
            logger.debug(`Config Object: ${JSON.stringify(config)}`);

            // Initializing Connection Profile
            const connectionProfilePMS = await new ParameterStoreKVS({
                prefix: `/amb/${config.networkId}/${config.memberId}`
            });
            const cp = await new ConnectionProfile(connectionProfilePMS);
            const connectionProfile = await cp.getConnectionProfile();

            logger.debug(`Connection Profile Object: ${JSON.stringify(connectionProfile)}`);

            ID = config.id;

            const hfcClient = await new HFCClient(cp);

            let result;
            let command;

            switch (config.method) {
                case "list-installed-chaincodes":

                    command = `${hfcClient.getPeerCmdSetup()}peer chaincode list --installed --logging-level debug`
                    logger.debug(`${fcnName} Executing command: ${command}`);
                    result = await runCMD(command);

                    break;
                case "list-instantiated-chaincodes":

                    command = `${hfcClient.getPeerCmdSetup()}peer chaincode list --instantiated --logging-level debug`
                    logger.debug(`${fcnName} Executing command: ${command}`);
                    result = await runCMD(command);

                    break;
                case "install-chaincode-on-peers":

                    throw new Error(`${fcnName} Function with the name ${config.method} is not implemented yet`)

                    break;
                case "instantiate-chaincode":

                    throw new Error(`${fcnName} Function with the name ${config.method} is not implemented yet`)

                    break;
                case "upgrade-chaincode":

                    throw new Error(`${fcnName} Function with the name ${config.method} is not implemented yet`)

                    break;
                case "create-channel":

                    throw new Error(`${fcnName} Function with the name ${config.method} is not implemented yet`)

                    break;
                case "join-channel":

                    throw new Error(`${fcnName} Function with the name ${config.method} is not implemented yet`)

                    break;
                default:
                    throw new Error(`${fcnName} Function with the name ${config.method} is not found`)
                    break;
            }

            const output = Utils.__formatResponseSuccess(result, ID);

            logger.debug(`Finishing lambda execution with output message: ${JSON.stringify(output)}`);
            resolve(JSON.stringify(output));

            //export MSP_PATH=/opt/home/admin-msp
            // export MSP=$MEMBERID
            // export ORDERER=$ORDERINGSERVICEENDPOINT
            // export PEER=$PEERSERVICEENDPOINT
            // export CHANNEL=mychannel
            // export CAFILE=/opt/home/managedblockchain-tls-chain.pem
            // export CHAINCODENAME=mycc
            // export CHAINCODEVERSION=v0
            // export CHAINCODEDIR=/tmp/cc

            //Resolve peer url and set to "CORE_PEER_ADDRESS=
            //Resolve orderer url
            // Set MSP CORE_PEER_LOCALMSPID= to AMB member id
            //Download TLS cert



            //logger.debug(`${fcnName} ${result}`);

            //const newPeerProfile = await cp.generatePeerProfile(newPeerInfo);

            //logger.debug(`${fcnName} Generated new peer profile: ${JSON.stringify(newPeerProfile)}`);

            //Add new peer details to Connection Profile
            //await cp.setPeerToCurrentOrg(newPeerId);
            //await cp.setPeerProfile(newPeerProfile);

            //logger.debug(`${fcnName} Generated new connection profile: ${JSON.stringify(await cp.getConnectionProfile())}`);

            //await cp.pushConnectionProfile();


        } catch (err) {
            logger.error(`${fcnName}: ${err}`);
            logger.debug(`${err.stack}`);
            const output = Utils.__formatResponseError(`${fcnName}: ${err}`, ID);
            reject(JSON.stringify(output));
        }
    })
};
