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

const HFC = require("fabric-client");
let logger = require("./logging").getLogger("hfc-client");
const Utils = require("./utils");
const ParameterStoreKVS = require("./parameterstore-kvs");
const SecretsManagerKVS = require("./secretsmanager-kvs");
const ConnectionProfile = require("./connection-profile");
const S3Client = require("./s3-client.js");
const fs = require('fs-extra');

const TLS_CA_CERT_PATH = "/tmp/managedblockchain-tls-chain.pem";
const DEFAULT_MAX_EVENT_HUB_RETRIES = 10;
const TRANSACTION_TIMEOUT = 30000;
const EVENT_TIMEOUT = 10000;

HFC.setLogger(logger);

const __checkProposalRes = function (results) {
    const fcnName = "[HFCClient __checkProposalRes]";
    let proposalResponses = results[0];
    const proposal = results[1];
    const header = results[2];

    //Special case when validating response from peer join request
    if (!(proposalResponses instanceof Array)) {
        proposalResponses = results;
    }

    return new Promise((resolve, reject) => {
        //check response
        if (!proposalResponses || !proposalResponses[0] || !proposalResponses[0].response || proposalResponses[0].response.status !== 200) {
            logger.debug(`${fcnName} Faulty proposal responses: ${JSON.stringify(proposalResponses)}`);
            reject(`${fcnName} Transaction proposal fails the simple validation checks`);
        } else {
            logger.debug(`${fcnName} Successfully obtained response for transaction`);

            //move on to ordering
            const request = {
                proposalResponses: proposalResponses,
                proposal: proposal,
                header: header
            };
            resolve(request);
        }
    });
};

// We use this wrapper to properly handle rejection errors from channel.sendTransactionProposal
const __sendTransactionProposal = function (channel, request, timeout) {
    const fcnName = "[HFCClient __sendTransactionProposal]";

    return new Promise((resolve, reject) => {
        channel.sendTransactionProposal(request, timeout)
            .then((results) => {
                resolve(results);
            })
            .catch((err) => {
                throw new Error(`${fcnName} ${err}`);
            });
    });
}

const __invokeChaincode = function (hfc, channelName, chaincodeId, fcn, args, transientMap) {
    const fcnName = "[HFCClient __invokeChaincode]";
    logger.debug(`${fcnName} Sending invoke to chaincode ${chaincodeId} function ${fcn} with arguments ${JSON.stringify(args)} and transientMap ${JSON.stringify(transientMap)}`);

    return new Promise(async (resolve, reject) => {
        try {
            const HFCClient = hfc;
            const channel = await HFCClient.getChannel(channelName, true);
            if (!channel) {
                throw `Channel ${channelName} was not defined in the connection profile`;
            }

            const txId = HFCClient.newTransactionID();
            const txIdAsString = txId.getTransactionID();
            let request = {
                chaincodeId: chaincodeId,
                fcn: fcn,
                args: args,
                txId: txId
            };
            if (transientMap) {
                request.transientMap = transientMap
            }

            // send proposal to endorsing peers
            logger.debug(`${fcnName} Sent invoke transaction proposal request. TxId: ${txIdAsString} Full Request: ${Utils.__stringifyCircularJSON(request)}`);
            let results;
            try {
                results = await __sendTransactionProposal(channel, request, TRANSACTION_TIMEOUT);
            } catch (err) {
                logger.error(`${fcnName} txId: ${txIdAsString}. Error while sending transaction proposal: ${err}
                Retrying one more time before throwing an error`);
                results = await __sendTransactionProposal(channel, request, TRANSACTION_TIMEOUT);
            }

            if (!results) {
                logger.error(`${fcnName} - txId: ${txIdAsString}. Unable to obtain transaction proposal for txId: ${txIdAsString}`);
                throw new Error(`${fcnName} - txId: ${txIdAsString}. Unable to obtain transaction proposal for txId: ${txIdAsString}`);
            }

            // the returned object has both the endorsement results
            // and the actual proposal, the proposal will be needed
            // later when we send a transaction to the ordering service
            let proposalResponses = results[0];
            let proposal = results[1];

            if (!proposalResponses.length) {
                logger.error(`${fcnName} - txId: ${txIdAsString}. proposalResponses is empty: No results were returned from the request`);
                throw new Error(`${fcnName} - txId: ${txIdAsString}. No results were returned from the sendTransactionProposal request`);
            }

            logger.info(`${fcnName} - txId: ${txIdAsString}. Successfully sent Proposal and received ProposalResponse: ${Utils.__stringifyCircularJSON(proposalResponses)}`);

            const validResponses = [];
            const errorResponses = [];

            proposalResponses.forEach((responseContent) => {
                if (responseContent instanceof Error) {
                    logger.warn(`${fcnName} - txId: ${txIdAsString}.  Received error response from peer: ${Utils.__stringifyCircularJSON(responseContent)}`);
                    errorResponses.push(responseContent);
                } else {
                    logger.debug(`${fcnName} - txId: ${txIdAsString}. valid response from peer ${Utils.__stringifyCircularJSON(responseContent.peer)}`);
                    validResponses.push(responseContent);
                }
            });

            if (validResponses.length === 0) {
                const errorMessages = errorResponses.map((response) => {
                    return `${fcnName} Peer name - ${response.peer.name}, Response status - ${response.status}, Response message - ${response.message}`
                });
                const messages = Array.of(`No valid responses from any peers. ${errorResponses.length} peer error responses: ${errorMessages}`);
                const msg = messages.join('\n    ');
                logger.error(`${fcnName} - txId: ${txIdAsString}.  ${msg}`);
                throw new Error(msg);
            }

            logger.debug(`${fcnName} - txId: ${txIdAsString}. Successfully sent Proposal and received ProposalResponse: Status - ${validResponses[0].response.status}, message - ${validResponses[0].response.message}`);

            // wait for the channel-based event hub to tell us
            // that the commit was good or bad on each peer in our organization
            let promises = [];
            const event_hubs = channel.getChannelEventHubsForOrg();
            event_hubs.forEach((eh) => {
                logger.info(`${fcnName} - txId: ${txIdAsString}. invokeEventPromise - setting up event handler`);
                const invokeEventPromise = new Promise((resolve, reject) => {
                    let timer = true;
                    let maxRetries = 10;
                    let event_timeout = setTimeout(() => {
                        logger.error(`${fcnName} - txId: ${txIdAsString}. REQUEST_TIMEOUT: ${eh.getPeerAddr()}`);
                        timer = false;
                        eh.disconnect();
                    }, EVENT_TIMEOUT);
                    eh.registerTxEvent(txIdAsString, (tx, code, block_num) => {
                            logger.debug(`${fcnName} - txId: ${txIdAsString}. The invoke chaincode transaction has been committed on peer ${eh.getPeerAddr()}`);
                            logger.debug(`${fcnName} - txId: ${txIdAsString}. Transaction ${tx} has status of ${code} in block ${block_num}`);
                            clearTimeout(event_timeout);

                            if (code !== 'VALID') {
                                let message = util.format(`${fcnName} - txId: ${txIdAsString}. The invoke chaincode transaction was invalid, code: ${code}`);
                                logger.error(message);
                                throw new Error(message);
                            } else {
                                let message = `${fcnName} - txId: ${txIdAsString}. The invoke chaincode transaction was valid.`;
                                logger.info(message);
                                resolve(message);
                            }
                        }, (err) => {
                            if (eh.isconnected()) {
                                logger.error(`${fcnName} - txId: ${txIdAsString}. Failed to receive the block event: ${err}`);
                                logger.info(`${fcnName} - txId: ${txIdAsString}. Event hub is still connected. Peer name: ${eh.getPeerAddr()} Channel name: ${channel.getName()}`);
                                clearTimeout(event_timeout);
                                throw new Error(`${fcnName} - txId: ${txIdAsString}. Failed to receive the block event: ${err}`);
                            } else {
                                // Trying to reconnect until we run out of time in the main timer 'event_timeout' 
                                // or we reach maximum number of retries
                                if (timer && (maxRetries >= 0)) {
                                    maxRetries -= 1;
                                    eh.checkConnection(true);
                                    logger.debug(`${fcnName} - txId: ${txIdAsString}. Retrying Event Hub connection for txId ${txIdAsString}`);
                                } else {
                                    logger.error(`${fcnName} - txId: ${txIdAsString}. Seems like we ran out of time for Event Hub timeout or reached max number of retries: ${maxRetries}`);
                                    reject(`${fcnName} - txId: ${txIdAsString}. Seems like we ran out of time for Event Hub timeout or reached max number of retries: ${maxRetries}`);
                                }
                            }
                            clearTimeout(event_timeout);
                            logger.error(`${fcnName} - txId: ${txIdAsString}. in Event Hub - Error in event hub listener registerTxEvent ${err}`);
                            reject(err);
                        },
                        // the default for 'unregister' is true for transaction listeners
                        // so no real need to set here, however for 'disconnect'
                        // the default is false as most event hubs are long running
                        // in this use case we are using it only once
                        {
                            unregister: true,
                            disconnect: false
                        }
                    );
                    eh.connect();
                });
                promises.push(invokeEventPromise);
            });

            const orderer_request = {
                txId: txId,
                proposalResponses: validResponses,
                proposal: proposal
            };
            const sendPromise = channel.sendTransaction(orderer_request, TRANSACTION_TIMEOUT);
            // put the send to the ordering service last so that the events get registered and
            // are ready for the ordering and committing
            promises.push(sendPromise);
            results = await Promise.all(promises);
            logger.info(`${fcnName} - txId: ${txIdAsString}.  ------->>> R E S P O N S E : ${results}`);
            let response = results.pop(); //  ordering service results are last in the results
            if (response.status === 'SUCCESS') {
                logger.info(`${fcnName} - txId: ${txIdAsString}. Successfully sent transaction to the ordering service.`);
            } else {
                logger.error(`${fcnName} - txId: ${txIdAsString}. Failed to order the transaction. Error code: ${response.status}`);
            }

            // now see what each of the event hubs reported
            for (let i in results) {
                let event_hub_result = results[i];
                let event_hub = event_hubs[i];
                logger.info(`${fcnName} - txId: ${txIdAsString}. Event results for event hub ${event_hub.getPeerAddr()}`);
                if (typeof event_hub_result === 'string') {
                    logger.debug(`${fcnName} - txId: ${txIdAsString}. ${event_hub_result}`);
                } else {
                    if (!error_message) error_message = event_hub_result.toString();
                    logger.debug(`${fcnName} - txId: ${txIdAsString}. ${event_hub_result.toString()}`);
                }
            }
            logger.info(`${fcnName} - txId: ${txIdAsString}. Successfully invoked chaincode.`);
            let fcnResponse = {
                transactionId: txIdAsString
            }
            // If we received any valid responses, let's return them back to the user.
            if (validResponses.length) {
                const resultString = validResponses[0].toString('utf8');
                logger.debug(`${fcnName} - txId: ${txIdAsString}. Returning valid response: ${resultString}`);
                try {
                    fcnResponse.result = JSON.parse(resultString)
                } catch (err) {
                    fcnResponse.result = resultString
                }
            }

            resolve(fcnResponse);
        } catch (err) {
            const error_message = `${fcnName} Failed to invoke due to error: ${err.stack ? err.stack : err}`;
            reject(error_message);
            throw new Error(error_message);
        }
    })
};

const __queryChaincode = function (hfc, channelName, chaincodeId, fcn, args, transientMap) {
    const fcnName = "[HFCClient __queryChaincode]";
    logger.debug(`${fcnName} Sending query request to chaincode ${chaincodeId} function ${fcn} with arguments ${JSON.stringify(args)} and transientMap ${JSON.stringify(transientMap)}`);

    return new Promise(async (resolve, reject) => {
        try {
            const HFCClient = hfc;
            const channel = await HFCClient.getChannel(channelName, true);

            if (!channel) {
                throw `Channel ${channelName} was not defined in the connection profile`;
            }
            const txId = HFCClient.newTransactionID();
            const txIdAsString = txId.getTransactionID();

            // send query
            let request = {
                chaincodeId: chaincodeId,
                fcn: fcn,
                args: args,
                txId: txId
            };
            if (transientMap) {
                request.transientMap = transientMap
            }

            logger.debug(`${fcnName} Query request to Fabric ${JSON.stringify(request)}`);
            const responses = await channel.queryByChaincode(request);

            if (!responses.length) {
                throw `Got empty responses from peers on channel ${channelName}.`;
            }

            let results = [];
            let wasError = false;

            // you may receive multiple responses if you passed in multiple peers. For example,
            // if the targets : peers in the request above contained 2 peers, you should get 2 responses
            for (let i = 0; i < responses.length; i++) {
                logger.debug(`${fcnName} - result of query for txId: ${txIdAsString} - ${responses[i].toString('utf8')} \n`);
                // check for error
                let response = responses[i].toString('utf8');
                logger.debug(`${fcnName} - type of response for txId: ${txIdAsString} - ${typeof response}`);
                if (responses[i].toString('utf8').indexOf("Error: transaction returned with failure") != -1 || responses[i].toString('utf8').indexOf("Error: failed to execute transaction") != -1) {
                    logger.error(`${fcnName} - error in query result for for txId: ${txIdAsString} - ${responses[i].toString('utf8')}`);
                    wasError = true;
                } else {
                    const resultString = responses[i].toString('utf8');
                    try {
                        results = JSON.parse(resultString)
                    } catch (err) {
                        results = resultString
                    }
                    // Setting error flag back to false since we received a valid response from one of the peers
                    wasError = false;
                    break;
                }
            }

            if (wasError) {
                throw `Was not able to get valid responses from peers on the channel ${channelName}. Received error message: ${responses[0].toString('utf8')}`;
            }

            resolve(results);

        } catch (err) {
            const error_message = `${fcnName} Failed to query due to error: ${err.stack ? err.stack : err}`;
            reject(error_message);
            throw new Error(error_message);
        }
    });
};

const __queryTransactionByID = function (hfc, channelName, chaincodeId, transactionId) {
    const fcnName = "[HFCClient __queryTransactionByID]";
    logger.debug(
        `${fcnName} Sending query transaction by iD request to chaincode ${chaincodeId}  with transaction ID ${transactionId} `
    );

    return new Promise(async (resolve, reject) => {
        try {
            const HFCClient = hfc;
            const channel = await HFCClient.getChannel(channelName, true);

            if (!channel) {
                throw `Channel ${channelName} was not defined in the connection profile`;
            }

            logger.debug(
                `${fcnName} Query request to transaction ID : ${transactionId}`
            );
            const response_payload = await channel.queryTransaction(transactionId);
            let results;
            if (response_payload) {
                results = response_payload;
            } else {
                logger.error("response_payload is null");
                results = "response_payload is null";
            }

            resolve(results);
        } catch (err) {
            const error_message = `${fcnName} Failed to query due to error: ${
        err.stack ? err.stack : err
      }`;
            reject(error_message);
            throw new Error(error_message);
        }
    });
};

module.exports = class HFCClient {
    constructor(connectionProfileObject) {
        const fcnName = "[HFCClient.constructor]";

        return new Promise(async (resolve, reject) => {
            try {
                if (!connectionProfileObject instanceof ConnectionProfile) {
                    throw new Error(`${fcnName} Please make sure "connectionProfileObject" is an instance of ConnectionProfile class`)
                }

                this.ConnectionProfileObject = connectionProfileObject;
                const connectionProfile = await this.ConnectionProfileObject.getConnectionProfile();
                const networkId = this.ConnectionProfileObject.getAmbNetworkId();
                const memberId = this.ConnectionProfileObject.getAmbMemberId();

                logger.debug(`${fcnName} Connection Profile Object: ${JSON.stringify(connectionProfile)}`);

                // Initializing user credential stores
                const credentialStoreKVS = await new ParameterStoreKVS({
                    prefix: `/amb/${networkId}/${memberId}/users`
                });

                const cryptoStoreOptions = {
                    prefix: `/amb/${networkId}/${memberId}/users`
                };

                this.sm = await new SecretsManagerKVS(cryptoStoreOptions);

                if (!fs.pathExistsSync(TLS_CA_CERT_PATH)) {
                    //Downloading AMB cert from s3://us-east-1.managedblockchain/etc/managedblockchain-tls-chain.pem
                    const s3 = new S3Client();
                    await s3.download(this.ConnectionProfileObject.getAmbTLSCertS3BucketName(), this.ConnectionProfileObject.getAmbTLSCertS3ObjectPath(), TLS_CA_CERT_PATH);
                }

                // Initializing Fabric Client
                //
                this.__hfc = HFC.loadFromConfig(connectionProfile);

                await this.__hfc.setStateStore(credentialStoreKVS);

                const crypto_suite = await HFC.newCryptoSuite();
                const crypto_store = await HFC.newCryptoKeyStore(SecretsManagerKVS, cryptoStoreOptions);
                await crypto_suite.setCryptoKeyStore(crypto_store);
                await this.__hfc.setCryptoSuite(crypto_suite);

                resolve(this);
            } catch (err) {
                reject(`${fcnName}: Failed to initialize with error ${err}`);
                throw new Error(`${fcnName}: Failed to initialize with error ${err}`);
            }
        });

    }

    updateConnectionProfile(connectionProfile) {
        const fcnName = "[HFCClient.registerAndEnrollUser]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                this.__hfc = HFC.loadFromConfig(connectionProfile);
                resolve(this);
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }

    registerAndEnrollUser(username, doRegister, doEnroll) {
        const fcnName = "[HFCClient.registerAndEnrollUser]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                let user = await self.__hfc.getUserContext(username, true);
                if (!user) {
                    let adminUserObj = await self.setAdminUserContext();
                    if (username !== adminUserObj.getName()) {
                        if (doRegister) {

                            const caClient = self.__hfc.getCertificateAuthority();
                            const secret = await caClient.register({
                                enrollmentID: username
                            }, adminUserObj);
                            if (doEnroll) {
                                user = await self.__hfc.setUserContext({
                                    username: username,
                                    password: secret
                                });
                            } else {
                                reject(`${fcnName}: User: ${username} is not enrolled with CA.`);
                                throw new Error(`${fcnName}: User: ${username} is not enrolled with CA.`);
                            }

                        } else {
                            reject(`${fcnName}: User: ${username} is not registered with CA.`);
                            throw new Error(`${fcnName}: User: ${username} is not registered with CA.`);
                        }
                    } else {
                        resolve(adminUserObj);
                    }
                }
                if (user && user.isEnrolled) {
                    resolve(user);
                } else {
                    reject(`${fcnName}: User: ${username} was not enrolled.`);
                    throw new Error(`${fcnName}: User: ${username} was not enrolled.`);
                }
            } catch (err) {
                reject(`${fcnName}: Failed to get registered user: ${username} with error ${err}`);
                throw new Error(`${fcnName}: Failed to get registered user: ${username} with error ${err}`);
            }
        });
    }

    setAdminUserContext() {
        const fcnName = "[HFCClient.setAdminUserContext]"
        const self = this;
        const client = self.__hfc;

        return new Promise(async (resolve, reject) => {
            try {
                const bcAdminCreds = await self.sm.getValue(ADMIN_CREDS_KEY);
                const admin = {
                    username: bcAdminCreds.name,
                    password: bcAdminCreds.password
                }
                if (!admin.username && !admin.password) {
                    throw new Error(`${fcnName}: Please provide user name and password for registrar user (for AMB - your admin user)`);
                }
                let adminUserObj = await client.setUserContext(admin);
                if (adminUserObj && adminUserObj.isEnrolled) {
                    resolve(adminUserObj);
                } else {
                    reject(`${fcnName}: Admin user ${admin.username} was not enrolled.`);
                    throw new Error(`${fcnName}: User: ${admin.username} was not enrolled.`);
                }
            } catch (err) {
                reject(`${fcnName}: Failed to get registered admin user: ${admin.username} with error ${err}`);
                throw new Error(`${fcnName}: Failed to get registered admin user: ${admin.username} with error ${err}`);
            }
        });
    }

    /**
     * Sets user context for the client object. Couldn't do it in the constructor because it can't be async. Assuming that user name is specified in the config (default.json) and is already registered/enrolled and credentialis are available in the KV Store.
     * @method
     */
    setUserContext(enrolledUserName) {
        const fcnName = "[HFCClient.setClientUserContext]";
        let self = this;
        const client = self.__hfc;

        return new Promise(async (resolve, reject) => {
            try {

                if (!enrolledUserName || !enrolledUserName instanceof String || !enrolledUserName.length) {
                    throw new Error(`${fcnName} Please specify enrolledUserName, current value: ${JSON.stringify(enrolledUserName)}`)
                };

                const userName = enrolledUserName;

                // Try and obtain the user from persistence if the user has previously been 
                // registered and enrolled
                const clientUserObject = await client.getUserContext(userName, true)
                if (!clientUserObject) {
                    throw `Failed to get user context for ${userName}. Please make sure user is registered.`;
                } else {
                    logger.debug(`${fcnName} Successfully got user from KV store: ${clientUserObject.getName()}`);
                }
                logger.debug(`${fcnName} User ${clientUserObject.getName()} was found to be registered and enrolled`);
                const clientUser = await client.setUserContext(clientUserObject, true);
                if (!clientUser) {
                    throw `Failed to set user context for ${userName}. Please make sure user is registered.`;
                } else {
                    logger.debug(`${fcnName} Successfully set user context for ${userName}`);
                }
                resolve(clientUser);
            } catch (err) {
                reject(`${fcnName}: Failed to set user context: ${err}`)
                throw new Error(`${fcnName}: Failed to set user context: ${err}`);
            }
        })
    }

    installChaincodeOnPeers(peersNamesArray, chaincodePath, metadataPath, chaincodePackagePath, chaincodeId, chaincodeLang, chaincodeVersion) {
        const fcnName = "[HFCClient.installChaincodeOnPeer]";
        const self = this;
        const HFCClient = self.__hfc;
        logger.debug(`${fcnName} Starting chaincode installation}`);

        if (!peersNamesArray || !peersNamesArray instanceof Array || !peersNamesArray.length) {
            throw new Error(`${fcnName} Please specify peersNamesArray. Current value: ${peersNamesArray}`)
        };
        if (!chaincodePath || !chaincodePath instanceof String || !chaincodePath.length) {
            throw new Error(`${fcnName} Please specify chaincodePath. Current value: ${chaincodePath}`)
        };
        if (!chaincodePackagePath || !chaincodePackagePath instanceof String || !chaincodePackagePath.length) {
            throw new Error(`${fcnName} Please specify chaincodePackagePath. Current value: ${chaincodePackagePath}`)
        };
        if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
            throw new Error(`${fcnName} Please specify chaincodeId. Current value: ${chaincodeId}`)
        };
        if (!chaincodeLang || !chaincodeLang instanceof String || !chaincodeLang.length) {
            throw new Error(`${fcnName} Please specify chaincodeLang. Current value: ${chaincodeLang}`)
        };
        if (!chaincodeVersion || !chaincodeVersion instanceof String || !chaincodeVersion.length) {
            throw new Error(`${fcnName} Please specify chaincodeVersion. Current value: ${chaincodeVersion}`)
        };

        return new Promise(async (resolve, reject) => {
            try {
                let peerConfigObjectsArray = [];
                logger.debug(`${fcnName} Specified array of peer names: ${JSON.stringify(peersNamesArray)}`);

                await Promise.all(peersNamesArray.map((peerName) => {
                    const peerObj = HFCClient.getPeer(peerName);
                    peerConfigObjectsArray.push(peerObj);
                }));

                logger.debug(`${fcnName} Chaincode ${chaincodeId} will be installed on the following peers: ${JSON.stringify(peerConfigObjectsArray)}`);

                let targets = peerConfigObjectsArray;

                // send proposal to install
                const request = {
                    targets: targets,
                    chaincodePath: chaincodePath,
                    metadataPath: metadataPath ? metadataPath : null,
                    chaincodePackage: chaincodePackagePath,
                    chaincodeId: chaincodeId,
                    chaincodeType: chaincodeLang,
                    chaincodeVersion: chaincodeVersion
                };

                const results = await HFCClient.installChaincode(request);
                logger.debug(`${fcnName} Raw results from installation: ${JSON.stringify(results)}`);
                const result = await __checkProposalRes(results);
                logger.debug(`${fcnName} Results after checks: ${JSON.stringify(result)}`);
                resolve(result);

            } catch (err) {
                logger.debug(`${fcnName} Cought error ${JSON.stringify(err)}, creating a new Error`);
                reject(`${fcnName}: Failed to send install proposal due to an error: ${err}`);
            }
        });
    }

    __instantiateUpgradeChaincodeOnChannel(isInstantiate, channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig, peerName) {
        const fcnName = "[HFCClient.instantiateUpgradeChaincodeOnChannel]";
        const self = this;
        const HFCClient = self.__hfc;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName. Current value: ${channelName}`);
        }
        if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
            throw new Error(`${fcnName} Please specify chaincodeId. Current value: ${chaincodeId}`);
        }
        if (!chaincodeLang || !chaincodeLang instanceof String || !chaincodeLang.length) {
            throw new Error(`${fcnName} Please specify chaincodeLang. Current value: ${chaincodeLang}`);
        }
        if (!chaincodeVersion || !chaincodeVersion instanceof String || !chaincodeVersion.length) {
            throw new Error(`${fcnName} Please specify chaincodeVersion. Current value: ${chaincodeVersion}`);
        }
        // peerName is optional. If it is not provided, the 1st peer defined in the connection profile is used
        if (peerName) {
            if (!peerName instanceof String || !peerName.length) {
                throw new Error(`${fcnName} When specifying peerName it should contain a valid string, current value: ${JSON.stringify(peerName)}`);
            }
        }
        
        return new Promise(async (resolve, reject) => {
            try {

                const channel = await HFCClient.getChannel(channelName, true);

                //Test that channel has peers
                const channelPeers = await channel.getChannelPeers();
                if (!channelPeers.length) {
                    throw new Error(`${fcnName}: Channel with name ${channel.getName()} has no peers`);
                }

                const request = {
                    chaincodeType: chaincodeLang,
                    chaincodeId: chaincodeId,
                    chaincodeVersion: chaincodeVersion,
                    txId: HFCClient.newTransactionID()
                };
                if (fcn) {
                    request["fcn"] = fcn;
                }
                if (args) {
                    request["args"] = args;
                }
                if (endorsementPolicy) {
                    request["endorsement-policy"] = endorsementPolicy;
                }
                if (transientMap) {
                    request["transientMap"] = transientMap;
                }
                if (collectionsConfig) {
                    request["collections-config"] = collectionsConfig;
                }
                if (peerName) {
                    let peerConfigObjectsArray = [];
                    const peerObj = HFCClient.getPeer(peerName);
                    peerConfigObjectsArray.push(peerObj);
                    request["targets"] = peerConfigObjectsArray;
                }

                await channel.initialize();
                const proposalResult = isInstantiate ? await channel.sendInstantiateProposal(request) : await channel.sendUpgradeProposal(request);
                const requestToOrderer = await __checkProposalRes(proposalResult);
                const responseFromOrderer = await channel.sendTransaction(requestToOrderer);

                if (responseFromOrderer.status === 'SUCCESS') {
                    logger.debug(`${fcnName} Successfully ordered instantiate endorsement.`);

                    // Waiting for the network to settle
                    setTimeout(() => {
                        resolve(responseFromOrderer);
                    }, 2000);
                } else {
                    reject(`${fcnName} Failed to order the instantiate endorsement.`);
                }
            } catch (err) {
                reject(`${fcnName}: Failed to instantiate or upgrade chaincode: ${err}`);
            }
        });

    }

    instantiateChaincodeOnChannel(channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig, peerName) {
        const fcnName = "[HFCClient.instantiateChaincodeOnChannel]";
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                const result = await self.__instantiateUpgradeChaincodeOnChannel(true, channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig, peerName);
                resolve(result);
            } catch (err) {
                reject(`${fcnName}: Failed to instantiate chaincode: ${err}`)
                throw new Error(`${fcnName}: Failed to instantiate chaincode: ${err}`);
            }
        });
    }

    upgradeChaincodeOnChannel(channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig, peerName) {
        const fcnName = "[HFCClient.upgradeChaincodeOnChannel]";
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                const result = await self.__instantiateUpgradeChaincodeOnChannel(false, channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig, peerName);
                resolve(result);
            } catch (err) {
                reject(`${fcnName}: Failed to upgrade chaincode: ${err}`)
                throw new Error(`${fcnName}: Failed to upgrade chaincode: ${err}`);
            }
        });
    }

    joinChannel(channelName, peerName) {
        const fcnName = "[HFCClient.joinChannel]";
        const self = this;
        const HFCClient = self.__hfc;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };

        if (!peerName || !peerName instanceof String || !peerName.length) {
            throw new Error(`${fcnName} Please specify peerName, current value: ${JSON.stringify(peerName)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {

                //Receiving genesis block from Ordering service
                const channel = HFCClient.getChannel(channelName);
                const genesisBlock = await channel.getGenesisBlock();
                logger.debug(`${fcnName} Retrieved genesis block for channel ${channelName}: ${JSON.stringify(genesisBlock)}`)

                //Get new peer config
                const peer = HFCClient.getPeer(peerName);

                //Sending request to join channel
                const request = {
                    targets: [peer],
                    block: genesisBlock,
                    txId: HFCClient.newTransactionID()
                }
                const responses = await channel.joinChannel(request);
                logger.debug(`${fcnName} Raw response received: ${JSON.stringify(responses)}`);
                const result = await __checkProposalRes(responses);

                logger.debug(`${fcnName} Received response to join channel request: ${JSON.stringify(result)}`);
                resolve(result);
            } catch (err) {
                reject(`${fcnName}: Failed to join the channel ${channelName}: ${err}`)
                throw new Error(`${fcnName}: Failed to join the channel ${channelName}: ${err}`);
            }
        })
    }

    getChannelInfoFromPeer(channelName, peerName) {
        const fcnName = "[HFCClient.getChannelInfoFromPeer]";
        const self = this;
        const HFCClient = self.__hfc;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };

        if (!peerName || !peerName instanceof String || !peerName.length) {
            throw new Error(`${fcnName} Please specify peerName, current value: ${JSON.stringify(peerName)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {

                //Receiving genesis block from Ordering service
                const channel = HFCClient.getChannel(channelName);

                //Get new peer config
                const peer = HFCClient.getPeer(peerName);
                logger.debug(`${fcnName} Constructor name of current peer object: ${peer.constructor.name}`)

                //Sending request get channel info
                const request = {
                    target: peer
                }
                const response = await channel.getChannelConfig(request);

                logger.debug(`${fcnName} Received response get channel info request: ${JSON.stringify(response)}`);
                resolve(response);
            } catch (err) {
                reject(`${fcnName}: Failed to get channel info for channel ${channelName}: ${err}`)
                throw new Error(`${fcnName}: Failed to get channel info for channel ${channelName}: ${err}`);
            }
        })
    }

    getInstantiatedChaincodesFromChannel(channelName, peerName) {
        const fcnName = "[HFCClient.getInstantiatedChaincodesFromChannel]";
        const self = this;
        const HFCClient = self.__hfc;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };

        // peerName is optional. If it is not provided, the 1st peer defined in the connection profile is used
        if (peerName) {
            if (!peerName instanceof String || !peerName.length) {
                throw new Error(`${fcnName} When specifying peerName it should contain a valid string, current value: ${JSON.stringify(peerName)}`)
            }
        };

        return new Promise(async (resolve, reject) => {
            try {
                //Receiving genesis block from Ordering service
                const channel = HFCClient.getChannel(channelName);
                let response; 
                
                if (peerName) {
                    //Get new peer config
                    const peer = HFCClient.getPeer(peerName);
                    logger.debug(`${fcnName} Constructor name of current peer object: ${peer.constructor.name}`)
    
                    const request = {
                        target: peer
                    }
                    response = await channel.queryInstantiatedChaincodes(request);
                }
                else {
                    response = await channel.queryInstantiatedChaincodes();
                }

                logger.debug(`${fcnName} Received response get instantiated chaincodes request: ${JSON.stringify(response)}`);
                resolve(response.chaincodes);
            } catch (err) {
                reject(`${fcnName}: Failed to instantiate chaincodes on channel ${channelName}: ${err}`);
            }
        })
    }

    getInstantiatedChaincodeVersionOnChannel(channelName, chaincodeId, peerName) {
        const fcnName = "[HFCClient.getInstantiatedChaincodeVersionOnChannel]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };
        if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
            throw new Error(`${fcnName} Please specify chaincodeId, current value: ${JSON.stringify(chaincodeId)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {
                const instantiatedChaincodesArray = await self.getInstantiatedChaincodesFromChannel(channelName, peerName);
                logger.debug(`${fcnName} Received list of instantiated chaincodes: ${JSON.stringify(instantiatedChaincodesArray)}`)
                await Utils.__arrayIterator(instantiatedChaincodesArray, async (chaincodeObj) => {
                    if (chaincodeObj.name == chaincodeId) {
                        resolve(chaincodeObj.version)
                    }
                })
                resolve("");
            } catch (err) {
                throw new Error(`${fcnName}: ${err}`);
            }
        })
    }

    /**
     * Helps to construct HLF client with pre-registered user.
     * @method
     * @callback callback - Callback function to process block event
     */

    async registerBlockEventListener(callback, channelName, peerId, startFromBlock, endByBlock, maxEvenHubRetries) {
        const fcnName = "[HFCClient.registerBlockEventListener]";
        const self = this;
        const client = self.__hfc;
        try {
            if (!callback) {
                throw new Error(`${fcnName} Please specify callback function to process the blocks.`)
            };
            if (!channelName || !channelName instanceof String || !channelName.length) {
                throw new Error(`${fcnName} Please specify "channelName", current value: ${JSON.stringify(channelName)}`)
            };
            const configChannelName = channelName;

            const configPeerName = (typeof peerId === "string" && peerId.length) ? peerId : null;

            const startBlock = (typeof startFromBlock === "string" && startFromBlock.length) ? startFromBlock : "";

            const endBlock = (typeof endByBlock === "string" && endByBlock.length) ? endByBlock : "";

            // Constructing config for listener
            let channel = "";

            if (!configChannelName) {
                channel = client.getChannel();
                if (!channel) {
                    throw Error(`${fcnName} Looks like there is no channel to connect to. Check your connection profile config file.`);
                }
            } else {
                channel = client.getChannel(configChannelName, true);
            }

            const channelEventHub = channel.newChannelEventHub(configPeerName);

            logger.debug(`${fcnName} Client Event Hub's peer address: ${channelEventHub.getPeerAddr()}`)

            // for block listeners, the defaults for unregister and disconnect are true,
            // so the they are not required to be set in the following example
            let listenerConfig = {
                startBlock: startBlock,
                endBlock: endBlock,
                //unregister: true,
                //disconnect: false
            }

            if (startBlock < 0 || startBlock === "") {
                delete(listenerConfig.startBlock);
            }

            if (endBlock <= 0 || endBlock === "") {
                delete(listenerConfig.endBlock);
            }

            // We will keep the this.block_reg to unregister with later if needed
            this.blockReg = await channelEventHub.registerBlockEvent(
                (block) => {
                    self.maxEvenHubRetries = maxEvenHubRetries ? maxEvenHubRetries : DEFAULT_MAX_EVENT_HUB_RETRIES;
                    callback(block);
                },
                async (error) => {
                        if (channelEventHub.isconnected()) {
                            logger.error(`${fcnName} Failed to receive the block event: ${error}`);
                            logger.info(`${fcnName} Event hub connected. Peer name: ${configPeerName}; Channel name: ${channel.getName()};`)
                        } else {
                            if (!self.retriesRan) {
                                self.retriesRan = 0;
                            }
                            logger.debug(`${fcnName} Connection interrupted with an error: ${JSON.stringify(error)}`)


                            // Trying to reconnect maxEvenHubRetries times, with delays increased every time by one second, 
                            // then throwing an error

                            while (self.maxEvenHubRetries >= 0) {
                                self.maxEvenHubRetries -= 1;
                                self.retriesRan += 1;
                                const timeout = self.retriesRan * 1000;
                                logger.info(`${fcnName} Trying to reconnect. Attempt number: ${self.retriesRan} Current delay: ${timeout}`);

                                await Utils.__timeout(timeout);
                                if (channelEventHub.checkConnection(true)) {
                                    logger.debug(`${fcnName} Reconnected.`);
                                } else {
                                    logger.debug(`${fcnName} Failed to reconnect. Trying again.`);
                                }
                            }
                            if (self.maxEvenHubRetries < 0) {
                                throw new Error(`Tried to reconnect ${self.retriesRan} times with no success.`);
                            }
                        }
                    },
                    listenerConfig
            );

            await channelEventHub.connect(true);
        } catch (err) {
            throw `${fcnName} ${err}`
        }

    }

    invokeOrQueryChaincodeOnChannel(isInvoke, channelName, chaincodeId, fcn, args, transientMap) {
        const fcnName = "[HFCClient.invokeOrQueryChaincodeOnChannel]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName. Current value: ${channelName}`)
        };
        if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
            throw new Error(`${fcnName} Please specify chaincodeId. Current value: ${chaincodeId}`)
        };
        if (!fcn || !fcn instanceof String || !fcn.length) {
            throw new Error(`${fcnName} Please specify fcn. Current value: ${fcn}`)
        };

        logger.debug(`${fcnName} Received parameters: ${JSON.stringify({
            isInvoke: isInvoke, 
            channelName: channelName, 
            chaincodeId: chaincodeId, 
            fcn: fcn, 
            args: args ? args : null, 
            transientMap: transientMap ? transientMap : null
        })}`)

        return new Promise(async (resolve, reject) => {
            try {

                if (fcn && fcn !== "") {
                    if (!fcn || !(fcn instanceof String || typeof fcn === 'string') || !fcn.length) {
                        throw new Error(`${fcnName} Please make sure "fcn" is of type String`)
                    };
                    if (args && args.length) {
                        if (!(args instanceof Array || typeof args === 'object')) {
                            throw new Error(`${fcnName} Please make sure "args" is of type Array`)
                        }
                    };
                }
                let argsParsed = []

                // Making sure the first argument is one of types: string, Buffer, ArrayBuffer, Array, or Array-like Object, but not "object"
                if (args) {
                    await Utils.__arrayIterator(args, (arg) => {
                        if (typeof arg === "object") {
                            argsParsed.push(JSON.stringify(arg))
                        } else {
                            argsParsed.push(arg)
                        }
                    })
                }

                let result = null;

                if (isInvoke) {
                    result = await __invokeChaincode(self.__hfc, channelName, chaincodeId, fcn, argsParsed, transientMap)
                } else {
                    result = await __queryChaincode(self.__hfc, channelName, chaincodeId, fcn, argsParsed, transientMap)
                }

                if (typeof result === "string" && result.includes("Error:")) {
                    throw result;
                }

                logger.debug(`${fcnName} Result from invoke/query ${chaincodeId} on channel ${channelName}: ${result}`)
                resolve(result);

            } catch (err) {
                reject(`${fcnName}: Failed to invoke or query chaincode: ${err}`);
                throw new Error(`${fcnName}: Failed to invoke or query chaincode: ${err}`)
            }
        });

    }

    queryTransactionByID(channelName, chaincodeId, transactionId) {
        const fcnName = "[HFCClient.queryTransactionByID]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(
                `${fcnName} Please specify channelName. Current value: ${channelName}`
            );
        }
        if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
            throw new Error(
                `${fcnName} Please specify chaincodeId. Current value: ${chaincodeId}`
            );
        }
        if (!transactionId) {
            throw new Error(
                `${fcnName} Please specify transactionId. Current value: ${transactionId}`
            );
        }

        logger.debug(
            `${fcnName} Received parameters: ${JSON.stringify({
            channelName: channelName,
            chaincodeId: chaincodeId,
            transactionId: transactionId
          })}`
        );

        return new Promise(async (resolve, reject) => {
            try {
                let result = await __queryTransactionByID(self.__hfc, channelName, chaincodeId, transactionId);

                if (typeof result === "string" && result.includes("Error:")) {
                    throw result;
                }

                logger.debug(
                    `${fcnName} Result from queryTransactionByID ${chaincodeId} on channel ${channelName}: ${result}`
                );
                resolve(result);
            } catch (err) {
                reject(`${fcnName}: Failed to  query transaction by ID: ${err}`);
                throw new Error(`${fcnName}: Failed to query chaincode: ${err}`);
            }
        });
    }
}