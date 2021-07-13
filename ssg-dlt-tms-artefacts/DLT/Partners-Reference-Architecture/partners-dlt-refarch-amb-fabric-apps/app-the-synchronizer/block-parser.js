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
'use strict;'

const logger = require("./lib/logging").getLogger("block-parser");

/**
 * Helps to extract various types of data from the block.
 * @class
 * @classdesc
 * @prop {Object} logger - A constructed log4js object to be used in the current class.
 */

module.exports = class BlockParser {
    /**
     * Constructor for BlockParser class.
     * @constructor
     */
    constructor() {}

    /**
     * Extracts a write set from VALID transactions in the block and returns as array of objects
     * @method
     * @param {Object} block - Object containing the block from event hub
     * @returns {Object []} - An array of objects containing write set from VALID transactions in the block
     */
    getWriteSet(block) {
        const fcnName = "[BlockParser.getWriteSet]";
        const self = this;
        let writeSet = [];

        return new Promise(resolve => {

            // Block structure doc at https://blockchain-fabric.blogspot.com/2017/04/hyperledger-fabric-v10-block-structure.html

            const transactionArray = block.data.data
            transactionArray.forEach((transaction, index) => {
                const channelHeader = transaction.payload.header.channel_header;
                const txId = channelHeader.tx_id;
                const type = channelHeader.type;
                const ENDORSER_TRANSACTION = 3;
                const VALID_CODE = 0;

                //blockLog = `blockNumber[${blockNumber}] validationCode[${validationCode}] txId[${txId}] type[${type}] \n`;

                //console.log(blockLog);

                let validationCode = block.metadata.metadata[2][index]
                if (type == ENDORSER_TRANSACTION && validationCode == VALID_CODE) {
                    const transactionAction = transaction.payload.data.actions[0];
                    const chaincodeEndorsedAction = transactionAction.payload.action;
                    const txReadWriteSet = chaincodeEndorsedAction.proposal_response_payload.extension.results;
                    txReadWriteSet._blockNumber = self.getBlockNumber(block);
                    txReadWriteSet._txIndexInBlock = index;

                    txReadWriteSet.ns_rwset.forEach(transaction => {
                        transaction.rwset.writes.forEach((asset) => {
                            let writeObject = {};
                            try {
                                writeObject = JSON.parse(asset.value);
                            } catch (error) {
                                writeObject = asset.value;
                            }
                            if (typeof writeObject === "string") {
                                logger.debug(`${fcnName} Skipping non-invocation write set for block number ${txReadWriteSet._blockNumber} and transaction id ${txId}`)
                                return;
                            }
                            if (!writeObject._id) {
                                writeObject._id = asset.key;
                            }
                            writeObject._blockNumber = txReadWriteSet._blockNumber;
                            writeObject._txIndexInBlock = txReadWriteSet._txIndexInBlock;
                            writeObject._txId = txId;
                            writeSet.push(writeObject);
                        })
                    });
                    //const transactionLog = `txReadWriteSet[${JSON.stringify(txReadWriteSet, null, 0)}] \n`;
                    //console.log(transactionLog);
                }
            });

            resolve(writeSet);
        });
    }

    /**
     * Extracts block number
     * @method
     * @param {Object} block - Object containing the block from event hub
     * @returns {number} - Block number
     */
    getBlockNumber(block) {
        const fcnName = "[BlockParser.getBlockNumber]";
        const self = this;

        if (block.header.number) {
            return parseInt(block.header.number);
        } else {
            throw new Error(`${fcnName} Specified block object does not contain block.header.number`)
        }
    }
}