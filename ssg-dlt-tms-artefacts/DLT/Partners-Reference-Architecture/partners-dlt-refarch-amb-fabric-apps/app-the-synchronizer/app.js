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
'use strict';


const config = require('config');
const DynamoDb = require('./dynamodb.js');
const BlockParser = require('./block-parser.js');
const Utils = require('./utils.js');
const logger = require("./lib/logging").getLogger("the-synchronizer");
const HFCClient = require('./lib/hfc-client');
const ParameterStoreKVS = require("./lib/parameterstore-kvs");
const ConnectionProfile = require("./lib/connection-profile");

const SLAVE_MODE_TIMEOUT = 5000;

// We will configure startBlock and endBlock later when will retrieve the latest 
// synced block from the database.
//let blockchainConfig = Utils.objectWithoutProperties(config.blockchain, ["startBlock", "endBlock"]);

/**
 * Main function of the app.
 * @function
 */

async function main() {
    const fcnName = "[the-synchronizer]"

    try {
        //Loading config from ../config/default.json

        // All required blockchain config params:

        logger.debug(`${fcnName} Starting The Synchronizer. Current config: ${JSON.stringify(config)}`);

        let isMaster = false;
        if (config.has("isMaster")) {
            // Have to use this workaround to avoid passing immutability property from config module to the variable
            isMaster = config.isMaster ? true : false;
        }

        const networkId = config.get("blockchain.networkId");
        const memberId = config.get("blockchain.memberId");
        const userName = config.get("blockchain.userName");
        const channelName = config.get("blockchain.channelName");

        // All optional blockchain config params:
        const peerId = config.has("blockchain.peerId") ? config.get("blockchain.peerId") : null;
        const maxEvenHubRetries = config.has("blockchain.maxEvenHubRetries") ? config.get("blockchain.maxEvenHubRetries") : null;
        let startFromBlock = "";
        let endByBlock = "";

        // All required dynamodb config params:
        const dynamodbConfig = config.get("dynamodb");
        const dynamoDb = new DynamoDb(dynamodbConfig);

        // Checking if we already have come blocks synced to the specified table.
        // In this case we will ignore startBlock and endBlock config params from blockchainConfig to properly restore from crash.
        logger.debug(`${fcnName} Retrieving latest block number.`);
        let latestBlockNumberSynced = await dynamoDb.getLatestBlockNumber();
        logger.debug(`${fcnName} Latest block number synced: ${latestBlockNumberSynced}`);

        // If blocks have been already synced, it will ignore 'endBlock'
        if (typeof latestBlockNumberSynced == "number") {
            startFromBlock = `${latestBlockNumberSynced + 1}`;

            logger.info(`${fcnName} Updating startFromBlock with next block number to sync: ${startFromBlock}`);
        } else {
            logger.info(`${fcnName} Looks like there is no latestBlockNumberSynced in the database. Start syncing according to the config parameters.`)

            if (config.has("blockchain.startBlock")) startFromBlock = `${config.blockchain.startBlock}`;
            if (config.has("blockchain.endBlock")) endByBlock = `${config.blockchain.endBlock}`;

            latestBlockNumberSynced = startFromBlock && (parseInt(startFromBlock) > 0) ? startFromBlock : "0";
        }

        // Initializing Connection Profile
        const connectionProfilePMS = await new ParameterStoreKVS({
            prefix: `/amb/${networkId}/${memberId}`
        });
        const cp = await new ConnectionProfile(connectionProfilePMS);

        const hfc = await new HFCClient(cp);
        const blockParser = new BlockParser();
        await hfc.setUserContext(userName);

        await hfc.registerBlockEventListener(async (block) => {

            logger.info(`${fcnName} Successfully received the block event for block number ${block.header.number}`);

            let timeout = 0;

            // In case we are not the Master, waiting for 3 seconds before checking that Master successfully updated the DB.
            if (!isMaster) {
                timeout = SLAVE_MODE_TIMEOUT;
            }

            setTimeout(async () => {
                const blockNumber = blockParser.getBlockNumber(block);
                let persistedBlockNumber = 0;

                if (!isMaster) {
                    logger.debug(`${fcnName} Since we are not the master, checking the latest synced block number.`);
                    persistedBlockNumber = await dynamoDb.getLatestBlockNumber();
                }

                if (persistedBlockNumber < blockNumber || persistedBlockNumber == undefined) {
                    logger.debug(`${fcnName} Looks like we are The Master!`);
                    isMaster = true;
                    let wset = await blockParser.getWriteSet(block);
                    const wsetLength = wset.length;

                    logger.debug(`${fcnName} Write Set: ${JSON.stringify(wset)}`);

                    // In case we've got an empty write set, we just update the latest block number
                    if (!wsetLength) {
                        latestBlockNumberSynced = blockNumber;
                    }

                    // Intreating through the write set if not empty
                    await Utils.asyncForEach(wset, async (element, index) => {

                        let isOk = await dynamoDb.putItem(element, false);
                        if (isOk) {
                            // If we successfully updated the last asset from the write set, let's update the latest block number
                            if (index == wsetLength - 1) {
                                if (blockNumber > latestBlockNumberSynced) {
                                    latestBlockNumberSynced = blockNumber;
                                }

                            }
                        } else {
                            logger.error(`${fcnName} Problem with dynamoDb.putItem for element with index ${index}`);
                        }
                    });
                    logger.info(`${fcnName} Updating the latest synced block number: ${latestBlockNumberSynced}`);
                    await dynamoDb.putLatestBlockNumber(latestBlockNumberSynced);
                } else {
                    latestBlockNumberSynced = persistedBlockNumber;
                }
            }, timeout);

        }, channelName, peerId, startFromBlock, endByBlock, maxEvenHubRetries);

    } catch (err) {
        logger.error(`${fcnName} ${err}`);
        throw `${fcnName} ${err}`;
    }
}

main();