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

const AWS = require('aws-sdk');
const logger = require("./logging").getLogger("amb-client");
const Utils = require('./utils')

const AWS_REGION = process.env.AWS_REGION;

const AMB_TLS_CERT_BUCKET_NAME = `${AWS_REGION}.managedblockchain`;
const AMB_TLS_CERT_OBJECT_PATH = "etc/managedblockchain-tls-chain.pem";

module.exports = class AMB {
    constructor(context) {
        const fcnName = "[AMB.constructor]"
        let self = this;
        return new Promise(async (resolve, reject) => {

            try {
                // set a timeout on the AWS SDK calls, to ensure they complete before the Lambda timeout. We do not want to
                // throw an exception if the Lambda times out, otherwise this will raise a false CW alarm
                if (context) {
                    AWS.config.update({
                        httpOptions: {
                            connectTimeout: context.getRemainingTimeInMillis() - 2 * 1000, // timeout after failing to establish a connection
                            timeout: context.getRemainingTimeInMillis() - 1 * 1000 // timeout after a period of inactivity
                        }
                    });
                }

                self.AMB = new AWS.ManagedBlockchain({
                    apiVersion: '2018-09-24'
                });
                self.maxRetries = 10;
                resolve(self);
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
    getPeerInfo(networkId, memberId, peerId) {
        const fcnName = "[AMB.getPeerInfo]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Getting peer information`);

            try {
                if (!networkId || !networkId instanceof String || !networkId.length) {
                    throw new Error(`${fcnName} Please specify networkId, current value: ${JSON.stringify(networkId)}`)
                };
                if (!memberId || !memberId instanceof String || !memberId.length) {
                    throw new Error(`${fcnName} Please specify memberId, current value: ${JSON.stringify(memberId)}`)
                };
                if (!peerId || !peerId instanceof String || !peerId.length) {
                    throw new Error(`${fcnName} Please specify peerId, current value: ${JSON.stringify(peerId)}`)
                };
                const params = {
                    MemberId: memberId,
                    NetworkId: networkId,
                    NodeId: peerId
                };
                self.AMB.getNode(params, function (err, data) {
                    if (err) resolve(null);
                    else {
                        resolve(data.Node);
                    }
                });
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
    getMemberInfo(networkId, memberId) {
        const fcnName = "[AMB.getMemberInfo]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Getting member information`);

            try {
                if (!networkId || !networkId instanceof String || !networkId.length) {
                    throw new Error(`${fcnName} Please specify networkId, current value: ${JSON.stringify(networkId)}`)
                };
                if (!memberId || !memberId instanceof String || !memberId.length) {
                    throw new Error(`${fcnName} Please specify memberId, current value: ${JSON.stringify(memberId)}`)
                };
                const params = {
                    MemberId: memberId,
                    NetworkId: networkId
                };
                self.AMB.getMember(params, function (err, data) {
                    if (err) resolve(null);
                    else {
                        resolve(data.Member);
                    }
                });
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
    listAvailablePeersForMember(networkId, memberId) {
        const fcnName = "[AMB.listAvailablePeersForMember]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Getting peer information`);

            try {
                if (!networkId || !networkId instanceof String || !networkId.length) {
                    throw new Error(`${fcnName} Please specify networkId, current value: ${JSON.stringify(networkId)}`)
                };
                if (!memberId || !memberId instanceof String || !memberId.length) {
                    throw new Error(`${fcnName} Please specify memberId, current value: ${JSON.stringify(memberId)}`)
                };
                const params = {
                    MemberId: memberId,
                    NetworkId: networkId,
                    Status: "AVAILABLE"

                };
                self.AMB.listNodes(params, (err, data) => {
                    if (err) {
                        logger.error(`${fcnName} ${err}`);
                        resolve(null)
                    } else {
                        logger.debug(`${fcnName} Received peers info: ${JSON.stringify(data)}`);
                        resolve(data.Nodes);
                    }
                });
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
    getFullNetworkInfo(networkId) {
        const fcnName = "[AMB.getFullNetworkInfo]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Getting full network info`);

            try {
                if (!networkId || !networkId instanceof String || !networkId.length) {
                    throw new Error(`${fcnName} Please specify networkId, current value: ${JSON.stringify(networkId)}`)
                };

                let params = {
                    NetworkId: networkId
                };
                let networkProfile = {
                    network: {},
                    members: {},
                    peers: {},
                    ownedMemberId: ""
                };

                self.AMB.getNetwork(params, (err, data) => {
                    if (err) {
                        logger.error(`${fcnName} ${err}`);
                        resolve(null)
                    } else {
                        if (data.Network) {
                            networkProfile.network = data.Network;
                            self.AMB.listMembers(params, async (err, data) => {
                                if (err) {
                                    logger.error(`${fcnName} ${err}`);
                                    resolve(null)
                                } else {

                                    if (data.Members[0]) {
                                        await Utils.__arrayIterator(data.Members, async (member, index) => {
                                            if (member.IsOwned == true && member.Status == "AVAILABLE") {
                                                networkProfile.ownedMemberId = member.Id;
                                                networkProfile.members[member.Id] = await self.getMemberInfo(networkId, member.Id);
                                            }
                                            const peersList = await self.listAvailablePeersForMember(networkId, member.Id);
                                            if (peersList) {
                                                await Utils.__arrayIterator(peersList, async (peer) => {
                                                    let peerDeatils = await self.getPeerInfo(networkId, member.Id, peer.Id);
                                                    peerDeatils.MemberId = member.Id;
                                                    networkProfile.peers[peerDeatils.Id] = peerDeatils;
                                                })
                                            }
                                        })
                                        resolve(networkProfile);
                                    } else {
                                        resolve(networkProfile);
                                    }
                                }
                            });
                        } else {
                            logger.error(`${fcnName} Network with id ${networkId} does't seem to exist`);
                            resolve(null)
                        }
                    }
                })
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }

    /*Converts the output from getFullNetworkInfo into a Connection Profile format
    fullNetworkInfo = {
        network:{},         // Required
        members: {},        // Optional
        peers: {},          // Optional
        ownedMemberId: ""   // Optional
    }*/
    generateConnectionProfile(fullNetworkInfo) {
        const fcnName = "[AMB.generateConnectionProfile]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Generating connection profile from full network info`);

            try {
                let connectionProfile = {};
                // {
                //     name: "",
                //     description: "",
                //     organizations: {},
                //     orderers: {},
                //     certificateAuthorities:{},
                //     peers: {},
                //     client: {},
                //     amb: {}
                // }

                if (!fullNetworkInfo) {
                    throw new Error(`${fcnName} Parameter "fullNetworkInfo" should not be falsy`);
                }

                if (!fullNetworkInfo.network) {
                    throw new Error(`${fcnName} Parameter "fullNetworkInfo.network" should not be falsy`);
                } else {
                    logger.debug(`${fcnName} Generating orderers profiles`);
                    connectionProfile.name = fullNetworkInfo.network.Name;
                    connectionProfile.description = fullNetworkInfo.network.Description;
                    const ordererUrl = fullNetworkInfo.network.FrameworkAttributes.Fabric.OrderingServiceEndpoint;
                    connectionProfile.orderers = {
                        orderer1: {
                            name: "orderer1",
                            grpcOptions: {},
                            url: `grpcs://${ordererUrl}`,
                        }
                    }
                    connectionProfile.orderers.orderer1.grpcOptions["ssl-target-name-override"] = ordererUrl.split(':')[0];
                }

                if (!fullNetworkInfo.members) {
                    logger.info(`${fcnName} Network doesn't seem to have any members: ${JSON.stringify(fullNetworkInfo)}`)
                } else {
                    logger.debug(`${fcnName} Generating organizations profiles`);
                    connectionProfile.organizations = {};
                    await Utils.__objectIterator(fullNetworkInfo.members, (memberId, member) => {
                        connectionProfile.organizations[member.Id] = {
                            name: member.Id,
                            mspid: member.Id
                        }
                    });
                }

                if (!fullNetworkInfo.ownedMemberId) {
                    logger.info(`${fcnName} Seems like current account doesn't own any member in the network: ${JSON.stringify(fullNetworkInfo)}`)
                } else {
                    logger.debug(`${fcnName} Generating CA, client and AMB profiles`);
                    connectionProfile.certificateAuthorities = {};
                    connectionProfile.client = {};
                    connectionProfile.amb = {
                        networkId: fullNetworkInfo.network.Id,
                        networkName: fullNetworkInfo.network.Name,
                        tlsCertBucket: AMB_TLS_CERT_BUCKET_NAME,
                        tlsCertObject: AMB_TLS_CERT_OBJECT_PATH
                    };
                    await Utils.__objectIterator(fullNetworkInfo.members, (memberId, member) => {
                        if (fullNetworkInfo.ownedMemberId === member.Id) {
                            connectionProfile.client = {
                                organization: member.Id
                            }
                            connectionProfile.certificateAuthorities[member.Id] = {
                                name: member.Id,
                                url: `https://${member.FrameworkAttributes.Fabric.CaEndpoint}`,
                                adminUsername: member.FrameworkAttributes.AdminUsername
                            }
                            connectionProfile.amb.memberId = member.Id;
                            connectionProfile.amb.memberName = member.Name;
                            if (!connectionProfile.organizations[member.Id].certificateAuthorities) {
                                connectionProfile.organizations[member.Id].certificateAuthorities = []
                            }
                            connectionProfile.organizations[member.Id].certificateAuthorities.push(member.Id);
                        }
                    });
                }

                if (!fullNetworkInfo.peers) {
                    logger.info(`${fcnName} Network doesn't seem to have any peers: ${JSON.stringify(fullNetworkInfo)}`)
                } else {
                    logger.debug(`${fcnName} Generating peers profiles`);
                    connectionProfile.peers = {};
                    await Utils.__objectIterator(fullNetworkInfo.peers, (peerId, peer) => {
                        logger.debug(`${fcnName} Processing peer: ${JSON.stringify(peer)}`)
                        const peerUrl = `grpcs://${peer.FrameworkAttributes.Fabric.PeerEndpoint}`
                        const peerEventUrl = `grpcs://${peer.FrameworkAttributes.Fabric.PeerEventEndpoint}`
                        connectionProfile.peers[peer.Id] = {
                            name: peer.Id,
                            url: peerUrl,
                            eventUrl: peerEventUrl,
                            grpcOptions: {}
                        }
                        connectionProfile.peers[peer.Id].grpcOptions["ssl-target-name-override"] = peer.FrameworkAttributes.Fabric.PeerEndpoint.split(':')[0];

                        if (peer.MemberId === fullNetworkInfo.ownedMemberId) {
                            if (!connectionProfile.organizations[peer.MemberId].peers) {
                                connectionProfile.organizations[peer.MemberId].peers = []
                            }
                            connectionProfile.organizations[peer.MemberId].peers.push(peer.Id);
                        }
                    })
                }

                resolve(connectionProfile);
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
    deletePeer(networkId, memberId, peerId) {
        const fcnName = "[AMB.deletePeer]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Deleting peer`);
            try {
                if (!networkId || !networkId instanceof String || !networkId.length) {
                    throw new Error(`${fcnName} Please specify networkId, current value: ${JSON.stringify(networkId)}`)
                };
                if (!memberId || !memberId instanceof String || !memberId.length) {
                    throw new Error(`${fcnName} Please specify memberId, current value: ${JSON.stringify(memberId)}`)
                };
                if (!peerId || !peerId instanceof String || !peerId.length) {
                    throw new Error(`${fcnName} Please specify peerId, current value: ${JSON.stringify(peerId)}`)
                };
                const params = {
                    NetworkId: networkId,
                    MemberId: memberId,
                    NodeId: peerId
                };
                logger.debug(`${fcnName} Sending delete request with params: ${JSON.stringify(params)}`);
                self.AMB.deleteNode(params, function (err, data) {
                    if (err) throw new Error(`${fcnName}: ${err}`);
                    else {
                        resolve(data);
                    }
                });
            } catch (err) {
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
    createPeer(networkId, memberId, availabilityZone, instanceType) {
        const fcnName = "[AMB.createPeer]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Creting new peer`);
            try {
                if (!networkId || !networkId instanceof String || !networkId.length) {
                    throw new Error(`${fcnName} Please specify networkId, current value: ${JSON.stringify(networkId)}`)
                };
                if (!memberId || !memberId instanceof String || !memberId.length) {
                    throw new Error(`${fcnName} Please specify memberId, current value: ${JSON.stringify(memberId)}`)
                };
                if (!availabilityZone || !availabilityZone instanceof String || !availabilityZone.length) {
                    throw new Error(`${fcnName} Please specify availabilityZone, current value: ${JSON.stringify(availabilityZone)}`)
                };
                if (!instanceType || !instanceType instanceof String || !instanceType.length) {
                    throw new Error(`${fcnName} Please specify instanceType, current value: ${JSON.stringify(instanceType)}`)
                };
                const params = {
                    MemberId: memberId,
                    NetworkId: networkId,
                    NodeConfiguration: {
                        /* required */
                        AvailabilityZone: availabilityZone,
                        InstanceType: instanceType
                    }
                };
                self.AMB.createNode(params, function (err, data) {
                    if (err) {
                        if (err.toString().includes("TooManyRequestsException")) {
                            self.maxRetries--;
                            if (self.maxRetries == 0) {
                                throw new Error(`${fcnName}: ${err}`);
                            }
                            Utils.__timeout(1000);
                            self.createPeer(networkId, memberId, availabilityZone, instanceType)
                        } else {
                            reject(`${fcnName}: ${err}`);
                            throw new Error(`${fcnName}: ${err}`);
                        }
                    } else {
                        resolve(data.NodeId);
                    }
                });
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }

    //Waits when the supplied peer status will change to something else
    //Returns full peer information object from AMB service
    waitForPeerStatusChange(delayForChecks, status, networkId, memberId, peerId) {
        const fcnName = "[AMB.waitForPeerStatusChange]"
        let self = this;

        if (!delayForChecks || !(typeof delayForChecks === "number")) {
            throw new Error(`${fcnName} Please specify delayForChecks, current value: ${JSON.stringify(delayForChecks)}`)
        };
        if (!status || !status instanceof String || !status.length) {
            throw new Error(`${fcnName} Please specify status, current value: ${JSON.stringify(status)}`)
        };
        if (!networkId || !networkId instanceof String || !networkId.length) {
            throw new Error(`${fcnName} Please specify networkId, current value: ${JSON.stringify(networkId)}`)
        };
        if (!memberId || !memberId instanceof String || !memberId.length) {
            throw new Error(`${fcnName} Please specify memberId, current value: ${JSON.stringify(memberId)}`)
        };
        if (!peerId || !peerId instanceof String || !peerId.length) {
            throw new Error(`${fcnName} Please specify peerId, current value: ${JSON.stringify(peerId)}`)
        };

        return new Promise((resolve, reject) => {
            logger.debug(`${fcnName} Waiting for peer status change to ${status}, checking every ${delayForChecks}...`);
            setTimeout(async () => {
                try {
                    let info = await self.getPeerInfo(networkId, memberId, peerId);
                    if (info) {
                        if (info.Status === status) {
                            //logger.info(`${fcnName} Waiting for peer status change. Current status: ${info.Status}`);
                            resolve(await self.waitForPeerStatusChange(delayForChecks, status, networkId, memberId, peerId));
                        } else {
                            logger.info(`${fcnName} Peer status changed to ${info.Status}`);
                            resolve(info);
                        }
                    } else {
                        logger.info(`${fcnName} Peer seems to be deleted`);
                        resolve({
                            Status: "DELETED"
                        });
                    }
                } catch (err) {
                    reject(`${fcnName} ${err}`);
                    throw new Error(`${fcnName} ${err}`);
                }
            }, delayForChecks);
        });
    }

    getPeersWithStatus(networkId, memberId) {
        const fcnName = "[AMB.getPeersWithStatus]"
        let self = this;

        return new Promise(async (resolve, reject) => {
            try {
                if (!networkId || !networkId instanceof String || !networkId.length) {
                    throw new Error(`${fcnName} Please specify networkId, current value: ${JSON.stringify(networkId)}`)
                };
                if (!memberId || !memberId instanceof String || !memberId.length) {
                    throw new Error(`${fcnName} Please specify memberId, current value: ${JSON.stringify(memberId)}`)
                };

                const params = {
                    MemberId: memberId,
                    NetworkId: networkId
                };

                logger.info(`${fcnName} About to call listNodes: ${JSON.stringify(params)}`);
                const peers = await self.AMB.listNodes(params).promise();
                logger.debug(`${fcnName} Output of listNodes called during peer health check: ${JSON.stringify(peers)}`);

                let peersWithStatus = [];

                await Utils.__arrayIterator(peers.Nodes, (node) => {
                    const peer = {
                        nodeId: node.Id,
                        nodeStatus: node.Status,
                        nodeAvailabilityZone: node.AvailabilityZone,
                        nodeInstanceType: node.InstanceType
                    };

                    //if (peerStatusesArray.indexOf(node.Status) < 0) {
                    peersWithStatus.push(peer);
                    //}
                })

                resolve(peersWithStatus);

            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }

        })


    }
}