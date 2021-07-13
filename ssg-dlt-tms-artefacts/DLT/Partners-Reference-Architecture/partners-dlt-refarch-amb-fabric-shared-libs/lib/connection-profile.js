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

const YAML = require("yaml");
const Utils = require("./utils");
const logger = require("./logging").getLogger("connection-profile");

const TLS_CA_CERT_PATH = "/tmp/managedblockchain-tls-chain.pem";
const AWS_REGION = process.env.AWS_REGION;

module.exports = class ConnectionProfile {
    /* Retrieves connection profile from the KVS storage service and optionally can update/create new connection profile
    if "newConnectionProfile" id specified.
    newConnectionProfile = {
        name: "",
        version: "1.0",
        description: "",
        x-type: "hlfv1",
        organizations: {},
        orderers: {},
        certificateAuthorities:{},
        client: {},
        amb: {}
    }
    */
    constructor(kvs, newConnectionProfile, paramId) {
        const fcnName = "[ConnectionProfile.constructor]"
        var self = this;
        return new Promise(async (resolve, reject) => {

            try {
                if (!kvs) {
                    throw new Error(` Please provide key/value store object to work with Connection Profile`);
                }

                self.__kvs = kvs;
                self.paramId = paramId ? paramId : "connection-profile";
                self.__profile = await self.pullConnectionProfile();

                if (newConnectionProfile) {

                    if (!self.__profile) {
                        self.__profile = {}
                    }

                    if (!newConnectionProfile.organizations) {
                        throw new Error(`${fcnName} Please specify "organizations" parameter in submitted peer info`)
                    };

                    await Utils.__objectIterator(newConnectionProfile.organizations, async (organizationId, organization) => {
                        await self.setOrganizationProfile(organization)
                    });

                    if (!newConnectionProfile.orderers) {
                        throw new Error(`${fcnName} Please specify "orderers" parameter in submitted peer info`)
                    };

                    await Utils.__objectIterator(newConnectionProfile.orderers, async (ordererId, orderer) => {
                        await self.setOrdererProfile(orderer)
                    });

                    if (!newConnectionProfile.certificateAuthorities) {
                        throw new Error(`${fcnName} Please specify "certificateAuthorities" parameter in submitted peer info`)
                    };

                    await Utils.__objectIterator(newConnectionProfile.certificateAuthorities, async (caId, ca) => {
                        await self.setCaProfile(ca)
                    });

                    if (!newConnectionProfile.client) {
                        throw new Error(`${fcnName} Please specify "client" parameter in submitted peer info`)
                    };

                    await self.setClientProfile(newConnectionProfile.client);

                    if (!newConnectionProfile.amb) {
                        throw new Error(`${fcnName} Please specify "amb" parameter in submitted peer info`)
                    };

                    await self.setAmbProfile(newConnectionProfile.amb);

                    if (newConnectionProfile.peers) {
                        Utils.__objectIterator(newConnectionProfile.peers, async (peerId, peer) => {
                            await self.setPeerProfile(peer)
                        })
                    };

                    if (!self.__profile.name) {
                        self.__profile.name = newConnectionProfile.name ? newConnectionProfile.name : "ambnet"
                    }

                    if (!self.__profile.description) {
                        self.__profile.description = newConnectionProfile.description ? newConnectionProfile.description : "AMB Network"
                    }

                    if (!self.__profile.version) {
                        self.__profile.version = "1.0"
                    }

                    if (!self.__profile["x-type"]) {
                        self.__profile["x-type"] = "hlfv1"
                    }
                }

                resolve(self);
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
    ///GENERIC START////
    //
    //
    //Pulls connection profile and overwrites the current version in cache
    //
    pullConnectionProfile() {
        const fcnName = "[ConnectionProfile.pullConnectionProfile]"
        const self = this;

        //Caching the profile config in memory
        return new Promise(async (resolve, reject) => {
            try {
                const rawConnectionProfile = await self.__kvs.getValue(self.paramId);
                logger.debug(`${fcnName} Raw Connection Profile retrieved: ${rawConnectionProfile}`);
                if (rawConnectionProfile) {
                    self.__profile = YAML.parse(rawConnectionProfile);
                    resolve(self.__profile);
                } else {
                    resolve(null);
                }

            } catch (err) {
                reject(`${fcnName}: ${err}`)
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }

    //Get connection profile from cached version pilled during initialization
    //
    getConnectionProfile() {
        const fcnName = "[ConnectionProfile.getConnectionProfile]"
        const self = this;

        //Caching the profile config in memory
        return new Promise(async (resolve, reject) => {
            if (self.__profile === "") {
                const profile = await self.pullConnectionProfile(self.paramId);
                resolve(profile);
            } else {
                resolve(self.__profile);
            }
        });
    }

    //Push Connection Profile to the Key/Value store configured during initialization.
    //
    pushConnectionProfile() {
        const fcnName = "[ConnectionProfile.pushConnectionProfile]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                const profileInYaml = YAML.stringify(self.__profile);
                await self.__kvs.setValue(self.paramId, profileInYaml);
                resolve(self.__profile);
            } catch (err) {
                reject(`${fcnName}: ${err}`)
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    };

    //
    //
    ///GENERIC END////

    ///ORDERERS START////
    //
    //
    setOrdererProfile(ordererProfile) {
        const fcnName = "[ConnectionProfile.setOrdererProfile]"

        if (!ordererProfile.name || !ordererProfile.name instanceof String || !ordererProfile.name.length) {
            throw new Error(`${fcnName} Please specify "name" parameter in submitted orderer info`)
        };

        if (!ordererProfile.url || !ordererProfile.url instanceof String || !ordererProfile.url.length) {
            throw new Error(`${fcnName} Please specify "url" parameter in submitted orderer info`)
        };

        if (!ordererProfile.grpcOptions) {
            throw new Error(`${fcnName} Please specify "grpcOptions" parameter in submitted orderer info`)
        };

        if (!ordererProfile.grpcOptions["ssl-target-name-override"] || !ordererProfile.grpcOptions["ssl-target-name-override"] instanceof String || !ordererProfile.grpcOptions["ssl-target-name-override"].length) {
            throw new Error(`${fcnName} Please specify "grpcOptions["ssl-target-name-override"]" parameter in submitted orderer info`)
        };


        return new Promise((resolve, reject) => {
            try {

                let newOrgProfile = {
                    name: ordererProfile.name,
                    url: ordererProfile.url,
                    grpcOptions: {
                        "ssl-target-name-override": ordererProfile.grpcOptions["ssl-target-name-override"]
                    },
                    tlsCACerts: {
                        path: ordererProfile.tlsCACerts ? ordererProfile.tlsCACerts.path : TLS_CA_CERT_PATH
                    }
                }

                if (!this.__profile.orderers) {
                    this.__profile.orderers = {}
                }

                this.__profile.orderers[newOrgProfile.name] = newOrgProfile;

                resolve(newOrgProfile);

            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    }

    getOrdererAddress() {
        const fcnName = "[ConnectionProfile.getOrdererAddress]"
        const self = this;

        if (!self.__profile.orderers) {
            return null;
        } else {
            const ordererAssress = self.__profile.orderers.orderer1.url.split("//")[1];
            return ordererAssress;
        }
    }

    //
    //
    ///ORDERERS END////

    ///CA START////
    //
    //
    setCaProfile(caProfile) {
        const fcnName = "[ConnectionProfile.setCaProfile]"

        if (!caProfile.name || !caProfile.name instanceof String || !caProfile.name.length) {
            throw new Error(`${fcnName} Please specify "name" parameter in submitted orderer info`)
        };

        if (!caProfile.url || !caProfile.url instanceof String || !caProfile.url.length) {
            throw new Error(`${fcnName} Please specify "url" parameter in submitted orderer info`)
        };

        return new Promise((resolve, reject) => {
            try {

                let newCaProfile = {
                    name: caProfile.name,
                    url: caProfile.url,
                    httpOptions: caProfile.httpOptions ? caProfile.httpOptions : {
                        verify: false
                    },
                    tlsCACerts: {
                        path: caProfile.tlsCACerts ? caProfile.tlsCACerts.path : TLS_CA_CERT_PATH
                    }
                }

                if (!this.__profile.certificateAuthorities) {
                    this.__profile.certificateAuthorities = {}
                }

                this.__profile.certificateAuthorities[newCaProfile.name] = newCaProfile;

                resolve(newCaProfile);

            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    }

    getCaProfile(memberId) {
        const fcnName = "[ConnectionProfile.getCaProfile]"
        const self = this;

        if (!self.__profile.certificateAuthorities[memberId]) {
            return null;
        } else {
            return self.__profile.certificateAuthorities[memberId];
        }
    }

    getCaAddress(memberId) {
        const fcnName = "[ConnectionProfile.getCaAddress]"
        const self = this;

        const caProfile = self.getCaProfile(memberId);
        if (!caProfile) {
            return null;
        } else {
            const caAddress = caProfile.url.split("//")[1];
            return caAddress;
        }
    }

    //
    //
    ///CA END////

    ///CLIENT START////
    //
    //
    setClientProfile(clientProfile) {
        const fcnName = "[ConnectionProfile.setClientProfile]"

        if (!clientProfile.organization || !clientProfile.organization instanceof String || !clientProfile.organization.length) {
            throw new Error(`${fcnName} Please specify "organization" parameter in submitted orderer info`)
        };

        logger.debug(`${fcnName} Setting client profile for ${JSON.stringify(clientProfile)}`)

        return new Promise((resolve, reject) => {
            try {

                let newClientProfile = {
                    organization: clientProfile.organization
                }

                this.__profile.client = newClientProfile;

                resolve(newClientProfile);

            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    }

    //
    //
    ///CLIENT END////

    ///AMB START////
    //
    //
    setAmbProfile(ambProfile) {
        const fcnName = "[ConnectionProfile.setAmbProfile]"

        if (!ambProfile.networkId || !ambProfile.networkId instanceof String || !ambProfile.networkId.length) {
            throw new Error(`${fcnName} Please specify "networkId" parameter in submitted AMB profile`)
        };

        if (!ambProfile.memberId || !ambProfile.memberId instanceof String || !ambProfile.memberId.length) {
            throw new Error(`${fcnName} Please specify "memberId" parameter in submitted AMB profile`)
        };

        if (!ambProfile.networkName || !ambProfile.networkName instanceof String || !ambProfile.networkName.length) {
            throw new Error(`${fcnName} Please specify "networkName" parameter in submitted AMB profile`)
        };

        if (!ambProfile.memberName || !ambProfile.memberName instanceof String || !ambProfile.memberName.length) {
            throw new Error(`${fcnName} Please specify "memberName" parameter in submitted AMB profile`)
        };

        return new Promise((resolve, reject) => {
            try {

                let newAmbProfile = {
                    networkId: ambProfile.networkId,
                    memberId: ambProfile.memberId,
                    networkName: ambProfile.networkName,
                    memberName: ambProfile.memberName,
                    tlsCertBucket: ambProfile.tlsCertBucket ? ambProfile.tlsCertBucket : `${AWS_REGION}.managedblockchain`,
                    tlsCertObject: ambProfile.tlsCertObject ? ambProfile.tlsCertObject : "etc/managedblockchain-tls-chain.pem"
                }

                if (!this.__profile.amb) {
                    this.__profile.amb = {}
                }

                this.__profile.amb = newAmbProfile;

                resolve(newAmbProfile);

            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    }

    getAmbNetworkId() {
        const fcnName = "[ConnectionProfile.getAmbNetworkId]"
        const self = this;
        if (!self.__profile.amb) {
            return null;
        } else {
            return self.__profile.amb.networkId;
        }
    }

    getAmbMemberId() {
        const fcnName = "[ConnectionProfile.getAmbMemberId]"
        const self = this;
        if (!self.__profile.amb) {
            return null;
        } else {
            return self.__profile.amb.memberId;
        }
    }

    getAmbMemberName() {
        const fcnName = "[ConnectionProfile.getAmbMemberName]"
        const self = this;
        if (!self.__profile.amb) {
            return null;
        } else {
            return self.__profile.amb.memberName;
        }
    }

    getAmbTLSCertS3BucketName() {
        const fcnName = "[ConnectionProfile.getAmbTLSCertS3BucketName]"
        const self = this;
        if (!self.__profile.amb) {
            return null;
        } else {
            return self.__profile.amb.tlsCertBucket;
        }
    }

    getAmbTLSCertS3ObjectPath() {
        const fcnName = "[ConnectionProfile.getAmbTLSCertS3ObjectPath]"
        const self = this;
        if (!self.__profile.amb) {
            return null;
        } else {
            return self.__profile.amb.tlsCertObject;
        }
    }

    //
    //
    ///CLIENT END////

    ///CHANNELS START////
    //
    //
    getChannelProfile(channelName) {
        const fcnName = "[ConnectionProfile.getChannelProfile]"
        const self = this;
        if (!self.__profile.channels[channelName]) {
            return null;
        } else {
            return self.__profile.channels[channelName];
        }
    };

    getChannelS3BucketName(channelName) {
        const fcnName = "[ConnectionProfile.getChannelS3BucketName]"
        const self = this;
        const channelProfile = self.getChannelProfile(channelName);

        if (!channelProfile.s3BucketName) {
            return null;
        } else {
            return channelProfile.s3BucketName;
        }
    };

    getChannelsProfiles() {
        const fcnName = "[ConnectionProfile.getChannelsProfiles]"
        const self = this;
        if (!self.__profile.channels) {
            return null;
        } else {
            return self.__profile.channels;
        }
    }

    //Returns an array of all channels that current peer is a member of
    getChannelsByPeerName(peerName) {
        const fcnName = "[ConnectionProfile.getChannelsByPeerName]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            let channelsNamesArray = [];
            if (self.__profile.channels) {
                const channelsMap = self.__profile.channels;

                await Utils.__objectIterator(channelsMap, async (channelName, channelConfig) => {
                    if (channelConfig.peers) {
                        const peersMap = channelConfig.peers;
                        if (peersMap[peerName]) {
                            channelsNamesArray.push(channelName)
                        }
                    }
                })
                resolve(channelsNamesArray);
            } else {
                resolve(null);
            }
        })


    }

    setChannelProfile(channelProfile) {
        const fcnName = "[ConnectionProfile.setChannelProfile]"
        if (!channelProfile.name || !channelProfile.name instanceof String || !channelProfile.name.length) {
            throw new Error(`${fcnName} Please specify "name" parameter in submitted channel info`)
        };

        if (!channelProfile.s3BucketName || !channelProfile.s3BucketName instanceof String || !channelProfile.s3BucketName.length) {
            throw new Error(`${fcnName} Please specify "s3BucketName" parameter in submitted channel info`)
        };

        if (!channelProfile.s3BucketName || !channelProfile.s3BucketName instanceof String || !channelProfile.s3BucketName.length) {
            throw new Error(`${fcnName} Please specify "s3BucketName" parameter in submitted channel info`)
        };

        if (!channelProfile.orderers || !channelProfile.orderers instanceof Array || !channelProfile.orderers.length) {
            throw new Error(`${fcnName} Please specify "orderers" parameter in submitted channel info`)
        };

        return new Promise((resolve, reject) => {
            try {

                let newChannelProfile = {
                    name: channelProfile.name,
                    s3BucketName: channelProfile.s3BucketName,
                    orderers: channelProfile.orderers
                }

                if (!this.__profile.channels) {
                    this.__profile.channels = {}
                }

                this.__profile.channels[newChannelProfile.name] = newChannelProfile;

                resolve(newChannelProfile);

            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    };

    //
    //
    ///CHANNELS END////

    ///CHAINCODES START////
    //
    //
    setChaincodeProfile(chaincodeProfile) {
        const fcnName = "[ConnectionProfile.setChaincodeProfile]"
        const self = this;

        if (!chaincodeProfile.name || !chaincodeProfile.name instanceof String || !chaincodeProfile.name.length) {
            throw new Error(`${fcnName} Please specify "name" parameter in submitted chaincode profile info`)
        };

        if (!chaincodeProfile.endorsementPolicy || Object.entries(chaincodeProfile.endorsementPolicy).length === 0) {
            throw new Error(`${fcnName} Please specify non-empty "endorsementPolicy" parameter in submitted chaincode profile info`)
        };

        if (!chaincodeProfile.version || !chaincodeProfile.version instanceof String || !chaincodeProfile.version.length) {
            throw new Error(`${fcnName} Please specify "version" parameter in submitted chaincode profile info`)
        };

        return new Promise(async (resolve, reject) => {
            try {

                // Validating endorsement policies
                await Utils.__objectIterator(chaincodeProfile.endorsementPolicy, (channelName, endorsementPolicy) => {
                    const channelProfile = this.getChannelProfile(channelName);
                    if (!channelProfile) {
                        throw new Error(`${fcnName} Channel with name ${channelName} is not configured`);
                    }
                    if (typeof endorsementPolicy != "string") {
                        throw new Error(`${fcnName} Please specify endorsement policy for channel with name ${channelName} as a string`);
                    }
                })

                let newChaincodeProfile = {
                    name: chaincodeProfile.name,
                    endorsementPolicy: chaincodeProfile.endorsementPolicy,
                    version: chaincodeProfile.version
                }

                if (chaincodeProfile.peers) {
                    newChaincodeProfile.peers = haincodeProfile.peers;
                }

                if (!this.__profile.chaincodes) {
                    this.__profile.chaincodes = {}
                }

                this.__profile.chaincodes[newChaincodeProfile.name] = newChaincodeProfile;

                resolve(newChaincodeProfile);

            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    };

    getChaincodeProfile(chaincodeName) {
        const fcnName = "[ConnectionProfile.getChaincodeProfile]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            const chaincodesMap = self.__profile.chaincodes;
            if (!chaincodesMap) {
                logger.error(`${fcnName} Can't find find chaincodes section in Connection Profile`);
                resolve(null);
            } else {
                if (chaincodesMap[chaincodeName]) {
                    resolve(chaincodesMap[chaincodeName]);
                } else {
                    logger.error(`${fcnName} Can't find chaincode profile for chaincode with name ${chaincodeName}`);
                    resolve(null);
                }
            }
        });
    };

    getChaincodesProfiles() {
        const fcnName = "[ConnectionProfile.getChaincodesProfiles]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            const chaincodesMap = self.__profile.chaincodes;
            if (!chaincodesMap) {
                resolve(null);
            } else {

                resolve(chaincodesMap);
            }

        });
    }

    //Returns an array of all chaincode names installed on a specified peer
    getChaincodesByPeerName(peerName) {
        const fcnName = "[ConnectionProfile.getChannelsByPeerName]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            let chaincodesNamesArray = [];
            if (self.__profile.chaincodes) {
                const chaincodesMap = self.__profile.chaincodes;

                await Utils.__objectIterator(chaincodesMap, async (chaincodeName, chaincodeConfig) => {
                    if (Array.isArray(chaincodeConfig.peers)) {
                        const peersArray = chaincodeConfig.peers;
                        if (peersArray.includes(peerName)) {
                            chaincodesNamesArray.push(chaincodeName)
                        }
                    }
                })
                resolve(chaincodesNamesArray);
            } else {
                resolve(null);
            }
        })


    }

    getChaincodeDeployableChannels(chaincodeName) {
        const fcnName = "[ConnectionProfile.getChaincodeDeployableChannels]";
        const self = this;

        if (!chaincodeName || !chaincodeName instanceof String || !chaincodeName.length) {
            throw new Error(`${fcnName} Please specify chaincodeName`)
        };

        return new Promise(async (resolve, reject) => {
            const chaincodeProfile = await self.getChaincodeProfile(chaincodeName);
            if (!chaincodeProfile) {
                resolve(null);
            } else {
                if (!chaincodeProfile.deployableChannels) {
                    resolve(null);
                } else {
                    if (!chaincodeProfile.deployableChannels.length) {
                        resolve(null);
                    } else {
                        resolve(chaincodeProfile.deployableChannels);
                    }
                }
            }

        });
    }

    // Sets new version of the chaincode to be available
    //
    setChaincodeNewVersion(chaincodeName, chaincodeNewVersion) {
        const fcnName = "[ConnectionProfile.setChaincodeNewVersionAvailable]";
        const self = this;

        if (!chaincodeName || !chaincodeName instanceof String || !chaincodeName.length) {
            throw new Error(`${fcnName} Please specify chaincodeName`)
        };

        if (!chaincodeNewVersion || !chaincodeNewVersion instanceof String || !chaincodeNewVersion.length) {
            throw new Error(`${fcnName} Please specify chaincodeNewVersion. It should be String and not 0 length.`)
        };

        if (this.__profile.chaincodes) {
            //Initializing chaincode profile if it doesn't exists
            if (!this.__profile.chaincodes[chaincodeName]) {
                this.__profile.chaincodes[chaincodeName] = {
                    version: chaincodeNewVersion
                }
            }
            if (this.__profile.chaincodes[chaincodeName]) {
                this.__profile.chaincodes[chaincodeName].newVersion = chaincodeNewVersion;
                return this.__profile.chaincodes[chaincodeName];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    // Adds peer name to the list of peers of the specified chaincode
    setChaincodeInstalledOnPeer(chaincodeId, peerName) {
        const fcnName = "[ConnectionProfile.setChaincodeInstalledOnPeer]";
        const self = this;

        if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
            throw new Error(`${fcnName} Please specify chaincodeId`)
        };

        if (!peerName || !peerName instanceof String || !peerName.length) {
            throw new Error(`${fcnName} Please specify peerName name`)
        };

        return new Promise(async (resolve, reject) => {
            try { //Checking specified peer has proper config
                const peerProfile = this.getPeerProfile(peerName);
                if (!peerProfile) {
                    throw new Error(`${fcnName} Peer with name ${peerName} doesn't seem to have a profile`)
                };

                let chaincodeProfile = await this.getChaincodeProfile(chaincodeId);

                if (!chaincodeProfile.peers) {
                    chaincodeProfile.peers = [];
                }
                if (chaincodeProfile.peers.indexOf(peerName) < 0) {
                    chaincodeProfile.peers.push(peerName);
                    this.__profile.chaincodes[chaincodeId] = chaincodeProfile;
                }

                resolve(chaincodeProfile);
            } catch (err) {
                throw new Error(`${fcnName}: ${err}`)
            }
        });
    }

    // Adds list of peer names to the list of peers of the specified chaincode
    setChaincodeInstalledOnPeers(chaincodeId, peersNamesArray) {
        const fcnName = "[ConnectionProfile.setChaincodeInstalledOnPeers]";
        const self = this;

        if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
            throw new Error(`${fcnName} Please specify chaincodeId`)
        };

        if (!peersNamesArray || !peersNamesArray instanceof Array || !peersNamesArray.length) {
            throw new Error(`${fcnName} Please specify list of names in peersNamesArray`)
        };

        return new Promise(async (resolve, reject) => {
            try {
                await Utils.__arrayIterator(peersNamesArray, async (peerName) => {
                    await self.setChaincodeInstalledOnPeer(chaincodeId, peerName);
                })
                resolve(self);
            } catch (err) {
                throw new Error(`${fcnName}: ${err}`)
            }
        });
    }

    //Adds or changes the endorsement policy and collections config for a specific chaincode
    setChaincodeInstantiatedOnChannel(chaincodeName, chaincodeVersion, channelName, endorsementPolicy, transientMap) {
        const fcnName = "[ConnectionProfile.setChaincodeInstantiatedOnChannel]"
        let self = this;

        if (!chaincodeName || !chaincodeName instanceof String || !chaincodeName.length) {
            throw new Error(`${fcnName} Please specify chaincodeName`)
        };

        if (!chaincodeVersion || !chaincodeVersion instanceof String || !chaincodeVersion.length) {
            throw new Error(`${fcnName} Please specify chaincodeVersion`)
        };

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName`)
        };

        // if (!endorsementPolicy || !endorsementPolicy instanceof String || !endorsementPolicy.length) {
        //     throw new Error(`${fcnName} Please specify endorsementPolicy`)
        // };

        return new Promise(async (resolve, reject) => {
            try { //Checking specified peer has proper config
                const channelProfile = this.getChannelProfile(channelName);
                if (!channelProfile) {
                    throw new Error(`${fcnName} Channel with name ${channelName} doesn't seems to have a profile`)
                };

                let chaincodeProfile = await this.getChaincodeProfile(chaincodeName);

                if (!chaincodeProfile.endorsementPolicy) {
                    chaincodeProfile.endorsementPolicy = {};
                }
                chaincodeProfile.endorsementPolicy[channelName] = endorsementPolicy;

                chaincodeProfile.version = chaincodeVersion;

                this.__profile.chaincodes[chaincodeName] = chaincodeProfile;
                resolve(chaincodeProfile);
            } catch (err) {
                reject(`${fcnName}: ${err}`)
                throw new Error(`${fcnName}: ${err}`)
            }
        });
    };

    //Adds or changes the endorsement policy and collections config for a specific chaincode
    setChaincodeDeployableChannels(chaincodeName, channelsArray) {
        const fcnName = "[ConnectionProfile.setChaincodeDeployableChannels]"
        let self = this;
        if (!chaincodeName || !chaincodeName instanceof String || !chaincodeName.length) {
            throw new Error(`${fcnName} Please specify chaincodeName`)
        };

        if (!channelsArray || !channelsArray instanceof Array) {
            throw new Error(`${fcnName} Please specify channelsArray of type Array`)
        };

        return new Promise(async (resolve, reject) => {
            try { //Checking specified peer has proper config

                let chaincodeProfile = await this.getChaincodeProfile(chaincodeName);

                chaincodeProfile.deployableChannels = channelsArray;

                this.__profile.chaincodes[chaincodeName] = chaincodeProfile;
                resolve(chaincodeProfile);
            } catch (err) {
                reject(`${fcnName}: ${err}`)
                throw new Error(`${fcnName}: ${err}`)
            }
        });
    };

    //Adds or changes the endorsement policy and collections config for a specific chaincode
    removeNewChaincodeVersionNumber(chaincodeName) {
        const fcnName = "[ConnectionProfile.removeNewChaincodeVersionNumber]"
        let self = this;

        if (!chaincodeName || !chaincodeName instanceof String || !chaincodeName.length) {
            throw new Error(`${fcnName} Please specify chaincodeName`)
        };

        // if (!endorsementPolicy || !endorsementPolicy instanceof String || !endorsementPolicy.length) {
        //     throw new Error(`${fcnName} Please specify endorsementPolicy`)
        // };

        return new Promise(async (resolve, reject) => {
            try { //Checking specified peer has proper config

                let chaincodeProfile = await this.getChaincodeProfile(chaincodeName);

                if (chaincodeProfile.newVersion) {
                    delete chaincodeProfile.newVersion;
                }

                this.__profile.chaincodes[chaincodeName] = chaincodeProfile;
                resolve(chaincodeProfile);
            } catch (err) {
                reject(`${fcnName}: ${err}`)
                throw new Error(`${fcnName}: ${err}`)
            }
        });
    };

    //Adds or changes the endorsement policy and collections config for a specific chaincode
    removeChaincodeDeployableChannels(chaincodeName, channelsArray) {
        const fcnName = "[ConnectionProfile.removeChaincodeDeployableChannels]"
        let self = this;
        if (!chaincodeName || !chaincodeName instanceof String || !chaincodeName.length) {
            throw new Error(`${fcnName} Please specify chaincodeName`)
        };
        if (!channelsArray || !channelsArray instanceof Array) {
            throw new Error(`${fcnName} Please specify channelsArray of type Array`)
        };

        return new Promise(async (resolve, reject) => {
            try { //Checking specified peer has proper config

                let chaincodeProfile = await this.getChaincodeProfile(chaincodeName);

                if (chaincodeProfile.deployableChannels) {
                    if (channelsArray.length === 0) {
                        delete chaincodeProfile.deployableChannels;
                    } else {
                        channelsArray.forEach(channelName => {
                            if (chaincodeProfile.deployableChannels[channelName]) {
                                delete chaincodeProfile.deployableChannels[channelName]
                                if (chaincodeProfile.deployableChannels.length === 0) {
                                    delete chaincodeProfile.deployableChannels;
                                }
                            }
                        });
                    }
                }

                this.__profile.chaincodes[chaincodeName] = chaincodeProfile;
                resolve(chaincodeProfile);
            } catch (err) {
                reject(`${fcnName}: ${err}`)
                throw new Error(`${fcnName}: ${err}`)
            }
        });
    };

    //
    //
    ///CHAINCODES END////

    ///ORGANIZATIONS START////
    //
    //

    //Generates new organization profile
    setOrganizationProfile(orgProfile) {
        const fcnName = "[ConnectionProfile.setOrganizationProfile]"

        logger.debug(`${fcnName} Setting organization profile: ${JSON.stringify(orgProfile)}`);

        if (!orgProfile.name || !orgProfile.name instanceof String || !orgProfile.name.length) {
            throw new Error(`${fcnName} Please specify "name" parameter in submitted organization info`)
        };

        if (!orgProfile.mspid || !orgProfile.mspid instanceof String || !orgProfile.mspid.length) {
            throw new Error(`${fcnName} Please specify "mspid" parameter in submitted organization info`)
        };

        if (!orgProfile.certificateAuthorities || !orgProfile.certificateAuthorities instanceof Array || !orgProfile.certificateAuthorities.length) {
            throw new Error(` Please specify "certificateAuthorities" array in submitted organization info`)
        };

        return new Promise((resolve, reject) => {
            try {

                let newOrgProfile = {
                    name: orgProfile.name,
                    mspid: orgProfile.mspid,
                    peers: orgProfile.peers ? orgProfile.peers : [],
                    certificateAuthorities: orgProfile.certificateAuthorities
                }

                if (!this.__profile.organizations) {
                    this.__profile.organizations = {}
                }

                this.__profile.organizations[newOrgProfile.name] = newOrgProfile;

                resolve(newOrgProfile);

            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    }

    getOrganizationProfile(organizationName) {
        const fcnName = "[ConnectionProfile.getOrganizationProfile]"
        const self = this;

        if (!self.__profile.organizations[organizationName]) {
            return null;
        } else {
            return self.__profile.organizations[organizationName];
        }
    }

    getCurrentOrganizationProfile() {
        const fcnName = "[ConnectionProfile.getCurrentOrganizationProfile]"
        const self = this;

        if (!self.getAmbMemberId()) {
            return null;
        } else {
            return self.getOrganizationProfile(self.getAmbMemberId());
        }
    }

    getCurrentOrganizationPeers() {
        const fcnName = "[ConnectionProfile.getCurrentOrganizationPeers]"
        const self = this;

        if (self.getAmbMemberId()) {
            const orgProfile = self.getOrganizationProfile(self.getAmbMemberId());
            if (orgProfile) {
                if (orgProfile.peers) {
                    return orgProfile.peers
                }
            }
        }
        return null
    }

    //
    //
    ///ORGANIZATIONS END////

    ///PEERS START////
    //
    //

    // TODO: Add function cp.deletePeerFromOrg(config.peerId, config.memberId)

    // TODO: TO REFACTOR using the new function above.
    // Delete peer id to the current organization
    deletePeerFromCurrentOrg(peerId) {
        const fcnName = "[ConnectionProfile.deletePeerFromCurrentOrg]"
        const self = this;

        return new Promise((resolve, reject) => {
            if (!self.__profile.amb || !self.__profile.amb.memberId) {
                logger.debug(`${fcnName} amb.memberId is not set in Connection Profile`)
                resolve(null);
            }
            if (!self.__profile.organizations) {
                logger.debug(`${fcnName} organizations parameter is not set in Connection Profile`)
                resolve(null);
            }
            if (!self.__profile.organizations[self.__profile.amb.memberId]) {
                logger.debug(`${fcnName} organizations parameter does not seems to have organization with id ${self.__profile.amb.memberId}`)
                resolve(null);
            }
            const peersArray = self.__profile.organizations[self.__profile.amb.memberId].peers;
            if (!peersArray || !peersArray instanceof Array || !peersArray.length) {
                logger.debug(`${fcnName} Organization ${self.__profile.amb.memberId} doesn't have any peers configured`)
                resolve(null);
            }
            const indexOfPeerId = this.__profile.organizations[this.__profile.amb.memberId].peers.indexOf(peerId);
            if (indexOfPeerId < 0) {
                logger.debug(`${fcnName} Organization ${self.__profile.amb.memberId} doesn't have peer with id ${peerId}`)
                resolve(null);
            }
            const result = this.__profile.organizations[this.__profile.amb.memberId].peers.splice(indexOfPeerId, 1);
            if (this.__profile.organizations[this.__profile.amb.memberId].peers.length === 0) {
                delete this.__profile.organizations[this.__profile.amb.memberId].peers;
            }
            resolve(result);
        })
    }

    //Assign peer id to the current organization
    setPeerToCurrentOrg(peerId) {
        const fcnName = "[ConnectionProfile.setPeerToCurrentOrg]"
        const self = this;

        return new Promise((resolve, reject) => {
            try {
                if (!peerId || !peerId instanceof String || !peerId.length) {
                    throw new Error(`Please specify newPeerId`)
                };

                if (!self.__profile.amb || !self.__profile.amb.memberId) {
                    throw new Error(`amb.memberId is not set in Connection Profile`)

                }
                if (!self.__profile.organizations) {
                    throw new Error(`organizations parameter is not set in Connection Profile`)

                }
                if (!self.__profile.organizations[self.__profile.amb.memberId]) {
                    throw new Error(`organizations parameter does not seems to have organization with id ${self.__profile.amb.memberId}`)

                }
                if (!self.__profile.organizations[self.__profile.amb.memberId].peers) {
                    self.__profile.organizations[self.__profile.amb.memberId].peers = []
                }

                if (self.__profile.organizations[self.__profile.amb.memberId].peers.indexOf(peerId) < 0) {
                    self.__profile.organizations[self.__profile.amb.memberId].peers.push(peerId);
                    this.__profile.organizations = self.__profile.organizations;
                }

                resolve(this);
            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    }

    //Add peer to channel
    setPeerToChannel(channelName, peerName) {
        const fcnName = "[ConnectionProfile.setPeerToChannel]"
        const self = this;

        return new Promise((resolve, reject) => {
            try {
                if (!peerName || !peerName instanceof String || !peerName.length) {
                    throw new Error(`Please specify peerName`)
                };

                if (!channelName || !channelName instanceof String || !channelName.length) {
                    throw new Error(`Please specify channelName`)
                };

                if (!self.__profile.channels) {
                    throw new Error(`channels parameter is not set in Connection Profile`)

                }
                if (!self.__profile.channels[channelName]) {
                    throw new Error(`channels parameter does not seems to have a channel with id ${channelName}`)

                }
                if (!self.__profile.channels[channelName].peers) {
                    self.__profile.channels[channelName].peers = {}
                }

                const peerConfigObject = {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                }

                self.__profile.channels[channelName].peers[peerName] = peerConfigObject;
                this.__profile.channels = self.__profile.channels;

                resolve(this);
            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    }

    //Remove peer from channel
    deletePeerFromChannel(channelName, peerName) {
        const fcnName = "[ConnectionProfile.deletePeerFromChannel]"
        const self = this;

        return new Promise((resolve, reject) => {
            try {
                if (!peerName || !peerName instanceof String || !peerName.length) {
                    throw new Error(`Please specify peerName`)
                };

                if (!channelName || !channelName instanceof String || !channelName.length) {
                    throw new Error(` Please specify channelName`)
                };

                if (!self.__profile.channels) {
                    throw new Error(` channels parameter is not set in Connection Profile`)

                }
                if (!self.__profile.channels[channelName]) {
                    throw new Error(` channels parameter does not seems to have a channel with id ${channelName}`)

                }
                if (!self.__profile.channels[channelName].peers) {
                    throw new Error(` channel ${channelName} doesn't have any peers confugured in Connection Profile`)
                }

                delete self.__profile.channels[channelName].peers[peerName];
                this.__profile.channels = self.__profile.channels;

                if (!this.__profile.channels[channelName].peers) {
                    delete this.__profile.channels[channelName].peers;
                }

                resolve(this);
            } catch (err) {
                logger.error(`${fcnName} ${err}`);
                logger.debug(`${err.stack}`);
                resolve(null);
            }
        })
    }

    //Remove peer from all channels
    deletePeerFromAllChannels(peerName) {
        const fcnName = "[ConnectionProfile.deletePeerFromAllChannels]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                if (!peerName || !peerName instanceof String || !peerName.length) {
                    throw new Error(`Please specify peerName`)
                };

                const channelsMap = this.getChannelsProfiles();
                await Utils.__objectIterator(channelsMap, async (channelName, channelConfig) => {
                    await this.deletePeerFromChannel(channelName, peerName);
                })

                resolve(this);

            } catch (err) {
                logger.error(`${fcnName} ${err}`);
                logger.debug(`${err.stack}`);
                resolve(null);
            }
        })
    }

    //Remove peer from chaincode
    deletePeerFromChaincode(chaincodeId, peerName) {
        const fcnName = "[ConnectionProfile.deletePeerFromChaincode]"
        const self = this;

        return new Promise((resolve, reject) => {
            try {
                if (!peerName || !peerName instanceof String || !peerName.length) {
                    throw new Error(`Please specify peerName`)
                };

                if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
                    throw new Error(` Please specify chaincodeId`)
                };

                if (!self.__profile.chaincodes) {
                    logger.debug(`${fcnName} chaincodes parameter is not set in Connection Profile`);
                    resolve(null);
                }

                if (!self.__profile.chaincodes[chaincodeId]) {
                    logger.debug(`${fcnName} can't find chaincode with id ${chaincodeId} chaincodes parameter of Connection Profile`);
                    resolve(null);

                }

                const peersArray = self.__profile.chaincodes[chaincodeId].peers;
                if (!peersArray || !peersArray instanceof Array || !peersArray.length) {
                    logger.debug(`${fcnName} Chaincode ${chaincodeId} doesn't have any peers configured`)
                    resolve(null);
                }
                const indexOfPeerId = peersArray.indexOf(peerName);
                if (indexOfPeerId < 0) {
                    logger.debug(`${fcnName} Chaincode ${chaincodeId} doesn't have a peer with id ${peerName}`)
                    resolve(null);
                }
                const result = this.__profile.chaincodes[chaincodeId].peers.splice(indexOfPeerId, 1);
                if (this.__profile.chaincodes[chaincodeId].peers.length === 0) {
                    delete this.__profile.chaincodes[chaincodeId].peers;
                }

                resolve(result);
            } catch (err) {
                logger.error(`${fcnName} ${err}`);
                logger.debug(`${err.stack}`);
                resolve(null);
            }
        })
    }

    //Remove peer from all chaincodes
    deletePeerFromAllChaincodes(peerName) {
        const fcnName = "[ConnectionProfile.deletePeerFromAllChaincodes]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                if (!peerName || !peerName instanceof String || !peerName.length) {
                    throw new Error(`Please specify peerName`)
                };

                const chaincodesNamesArray = await this.getChaincodesByPeerName(peerName);
                logger.debug(`${fcnName} Got list of chaincodes: ${JSON.stringify(chaincodesNamesArray)}`)
                await Utils.__arrayIterator(chaincodesNamesArray, async (chaincodeId) => {
                    await this.deletePeerFromChaincode(chaincodeId, peerName);
                })

                resolve(this);

            } catch (err) {
                logger.error(`${fcnName} ${err}`);
                logger.debug(`${err.stack}`);
                resolve(null);
            }
        })
    }

    //Replace old peer with a new peer for all the channels
    swapPeersInChannels(oldPeerId, newPeerId) {
        const fcnName = "[ConnectionProfile.swapPeersInChannels]"
        const self = this;

        if (!oldPeerId || !oldPeerId instanceof String || !oldPeerId.length) {
            throw new Error(`${fcnName} Please specify oldPeerId`)
        };
        if (!newPeerId || !newPeerId instanceof String || !newPeerId.length) {
            throw new Error(`${fcnName} Please specify newPeerId`)
        };

        const channelsProfilesMap = self.getChannelsProfiles();

        return new Promise(async (resolve, reject) => {
            if (!channelsProfilesMap) {
                resolve(null);
            } else {
                let modifiedChannelsArray = [];
                await Utils.__objectIterator(channelsProfilesMap, async (channelProfileName, channelProfile) => {
                    if (channelProfile.peers) {
                        if (channelProfile.peers[oldPeerId]) {
                            channelsProfilesMap[channelProfileName].peers[newPeerId] = channelsProfilesMap[channelProfileName].peers[oldPeerId];
                            delete channelsProfilesMap[channelProfileName].peers[oldPeerId];
                            modifiedChannelsArray.push(channelProfileName);
                        }
                    }
                })
                this.__profile.channels = channelsProfilesMap;
                resolve(modifiedChannelsArray);
            }
        });
    }

    getPeerProfile(peerName) {
        const fcnName = "[ConnectionProfile.getPeerProfile]"
        const self = this;

        if (!self.__profile.peers[peerName]) {
            return null;
        } else {
            return self.__profile.peers[peerName];
        }
    }

    getFaultyPeersInfo() {
        const fcnName = "[ConnectionProfile.getFaultyPeersInfo]"
        const self = this;

        if (!self.__profile.delete) {
            return null;
        } else {
            return self.__profile.delete;
        }
    }

    getPeerAddress(peerName) {
        const fcnName = "[ConnectionProfile.getPeerAddress]"
        const self = this;

        const peerProfile = self.getPeerProfile(peerName);
        if (!peerProfile) {
            return null;
        } else {
            const peerAddress = peerProfile.url.split("//")[1];
            return peerAddress;
        }
    }

    getPeerNamesByChannelName(channelName) {
        const fcnName = "[ConnectionProfile.getPeerNamesByChannelName]"
        const self = this;

        const channelProfile = self.getChannelProfile(channelName);

        return new Promise(async (resolve, reject) => {
            if (!channelProfile) {
                resolve(null);
            } else {
                if (!channelProfile.peers) {
                    resolve(null);
                } else {
                    let peerNamesArray = [];
                    await Utils.__objectIterator(channelProfile.peers, async (peerName, peerConfig) => {
                        peerNamesArray.push(peerName);
                    })
                    resolve(peerNamesArray);
                }
            }
        });
    };

    // Gets an array of peer names belonging to current organization
    //
    getPeersNamesArrayByCurrentOrganization() {
        const fcnName = "[ConnectionProfile.getPeersNamesArrayByCurrentOrganization]"
        const self = this;

        const organizationProfile = self.getCurrentOrganizationProfile();

        if (!organizationProfile) {
            return null;
        } else {
            if (organizationProfile.peers) {
                return organizationProfile.peers;
            } else {
                return null;
            }
        }
    }

    // Gets an array of peer names belonging to current organization and members of specified channel
    //
    getPeerNamesArrayByChannelNameAndCurrentOrg(channelName) {
        const fcnName = "[ConnectionProfile.getPeerNamesArrayByChannelNameAndCurrentOrg]"
        const self = this;

        return new Promise(async (resolve, reject) => {
            const peerNamesOfCurrentOrg = self.getPeersNamesArrayByCurrentOrganization();
            const peerNamesOfChannel = await self.getPeerNamesByChannelName(channelName);

            if (!peerNamesOfCurrentOrg || !peerNamesOfCurrentOrg.length) {
                resolve(null);
            }
            logger.debug(`${fcnName}: peerNamesOfCurrentOrg ${JSON.stringify(peerNamesOfCurrentOrg)}`);
            if (!peerNamesOfChannel || !peerNamesOfChannel.length) {
                resolve(null);
            }
            logger.debug(`${fcnName}: peerNamesOfChannel ${JSON.stringify(peerNamesOfChannel)}`);

            // let peersNamesArray = [];
            // await Utils.__arrayIterator(peerNamesOfCurrentOrg, async (peerNameOfOrg) => {
            //     await Utils.__arrayIterator(peerNamesOfChannel, async (peerNameOfChannel) => {
            //         logger.debug(`${fcnName}: Comparing ${peerNameOfOrg} with ${peerNameOfChannel}`);
            //         if (peerNameOfOrg == peerNameOfChannel) {
            //             logger.debug(`${fcnName}: Got the following list of peers ${peerNameOfOrg}`);
            //             peersNamesArray.push(peerNameOfOrg);
            //         }
            //     })
            // })
            const peersNamesArray = peerNamesOfCurrentOrg.filter(name => peerNamesOfChannel.includes(name));
            logger.debug(`${fcnName}: Got the following list of peers ${JSON.stringify(peersNamesArray)}`);
            resolve(peersNamesArray.length != 0 ? peersNamesArray : null);
        });
    }

    // Gets an array of peers with specified chaincode installed
    //
    // getPeersNamesArrayByChaincodeName(chaincodeName) {
    //     const fcnName = "[ConnectionProfile.getPeersNamesArrayByChaincodeName]"
    //     const self = this;

    //     return new Promise(async (resolve, reject) => {
    //         let peersNamesArray = [];
    //         if (self.__profile.channels) {
    //             const channelsMap = self.__profile.channels;

    //             await Utils.__objectIterator(channelsMap, async (channelName, channelConfig) => {
    //                 if (channelConfig.peers) {
    //                     const peersMap = channelConfig.peers;
    //                     await Utils.__objectIterator(peersMap, (peerName, peerConfig) => {
    //                         if (peerConfig.chaincodes) {
    //                             const chaincodesArray = peerConfig.chaincodes;
    //                             if (chaincodesArray.includes(chaincodeName)) {
    //                                 peersNamesArray.push(peerName);
    //                             }
    //                         }
    //                     })
    //                 }
    //             })
    //             resolve(peersNamesArray);
    //         } else {
    //             resolve(null);
    //         }
    //     })
    // }

    //Generates new peer profile based on the info retrieved from the AMB API service
    generatePeerProfile(newPeerInfo) {
        const fcnName = "[ConnectionProfile.generatePeerProfile]"

        if (!newPeerInfo.Id || !newPeerInfo.Id instanceof String || !newPeerInfo.Id.length) {
            throw new Error(`${fcnName} Please specify Id parameter in submitted peer info`)
        };

        if (!newPeerInfo.FrameworkAttributes.Fabric.PeerEndpoint) {
            throw new Error(`${fcnName} Please specify FrameworkAttributes.Fabric.PeerEndpoint parameter in submitted peer info`)
        }
        if (!newPeerInfo.FrameworkAttributes.Fabric.PeerEventEndpoint) {
            throw new Error(`${fcnName} Please specify FFrameworkAttributes.Fabric.PeerEventEndpoint parameter in submitted peer info`)
        }

        return new Promise((resolve, reject) => {
            try {
                const peerRequestsURL = `grpcs://${newPeerInfo.FrameworkAttributes.Fabric.PeerEndpoint}`;
                const peerEventssURL = `grpcs://${newPeerInfo.FrameworkAttributes.Fabric.PeerEventEndpoint}`;
                const sslTargetNameOverride = newPeerInfo.FrameworkAttributes.Fabric.PeerEndpoint.split(":")[0];

                let newPeerProfile = {
                    name: newPeerInfo.Id,
                    url: peerRequestsURL,
                    eventUrl: peerEventssURL,
                    grpcOptions: {
                        "ssl-target-name-override": sslTargetNameOverride
                    },
                    tlsCACerts: {
                        path: TLS_CA_CERT_PATH
                    }
                }
                resolve(newPeerProfile);

            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    }

    //Sets new peer profile based on the specified profile object
    setPeerProfile(peerProfile) {
        const fcnName = "[ConnectionProfile.setPeerProfile]"

        return new Promise((resolve, reject) => {
            try {

                if (!peerProfile.name || !peerProfile.name instanceof String || !peerProfile.name.length) {
                    throw new Error(`${fcnName} Please specify peerProfile.name`)
                };

                if (!peerProfile.url || !peerProfile.url instanceof String || !peerProfile.url.length) {
                    throw new Error(`${fcnName} Please specify peerProfile.url`)
                };

                if (!peerProfile.eventUrl || !peerProfile.eventUrl instanceof String || !peerProfile.eventUrl.length) {
                    throw new Error(`${fcnName} Please specify peerProfile.eventUrl`)
                };

                const sslTargetNameOverride = peerProfile.url.split(":")[1].replace("//", "");

                let newPeerProfile = {
                    name: peerProfile.name,
                    url: peerProfile.url,
                    eventUrl: peerProfile.eventUrl,
                    grpcOptions: {
                        "ssl-target-name-override": sslTargetNameOverride
                    },
                    tlsCACerts: {
                        path: TLS_CA_CERT_PATH
                    }
                }
                if (!this.__profile.peers) {
                    this.__profile.peers = {}
                }

                this.__profile.peers[peerProfile.name] = newPeerProfile;

                resolve(this);
            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })
    }

    //Sets faulty peer for replacement
    setFaultyPeerInfo(peerName, availabilityZone, instanceType) {
        const fcnName = "[ConnectionProfile.setFaultyPeerInfo]"

        if (!peerName || !peerName instanceof String || !peerName.length) {
            throw new Error(`${fcnName} Please specify peerName`)
        };

        if (!availabilityZone || !availabilityZone instanceof String || !availabilityZone.length) {
            throw new Error(`${fcnName} Please specify availabilityZone`)
        };

        if (!instanceType || !instanceType instanceof String || !instanceType.length) {
            throw new Error(`${fcnName} Please specify instanceType`)
        };

        return new Promise(async (resolve, reject) => {

            const channelsNamesArray = await this.getChannelsByPeerName(peerName);
            const chaincodesNamesArray = await this.getChaincodesByPeerName(peerName);

            if (!this.__profile.delete) {
                this.__profile.delete = {}
            }

            if (!this.__profile.delete.peers) {
                this.__profile.delete.peers = {}
            }

            this.__profile.delete.peers[peerName] = {
                availabilityZone: availabilityZone,
                instanceType: instanceType,
                channelsNamesArray: channelsNamesArray,
                chaincodesNamesArray: chaincodesNamesArray
            };

            resolve(this);
        })
    }

    //Removes faulty peer information
    removeFaultyPeerInfo(peerName) {
        const fcnName = "[ConnectionProfile.removeFaultyPeerInfo]"

        if (!peerName || !peerName instanceof String || !peerName.length) {
            throw new Error(`${fcnName} Please specify peerName`)
        };

        return new Promise(async (resolve, reject) => {

            if (this.__profile.delete) {
                if (this.__profile.delete.peers) {
                    delete this.__profile.delete.peers[peerName]
                    if (Object.keys(this.__profile.delete.peers).length === 0) {
                        delete this.__profile.delete.peers
                    }
                    if (Object.keys(this.__profile.delete).length === 0) {
                        delete this.__profile.delete
                    }
                }
            }

            resolve(this);
        })
    }

    //Deleting peer profile from configurations object
    deletePeerProfile(peerId) {
        const fcnName = "[ConnectionProfile.deletePeerProfile]"
        const self = this;

        return new Promise((resolve, reject) => {
            if (!self.__profile.peers) {
                resolve(null)
            }
            if (!self.__profile.peers[peerId]) {
                resolve(null)
            }
            delete this.__profile.peers[peerId]
            if (Object.keys(this.__profile.peers).length === 0) {
                delete this.__profile.peers;
            }
            resolve(this)
        })
    }

    //Replacing all entrences of old peer with new peer. Making changes in two places: 
    // 1. All channel profiles with old peer info
    // 2. Replaces old peer's profile
    // 3. Replaces peer in the organization config
    // 4. Replaces peer in chaincode config
    replacePeerConfig(oldPeerId, newPeerId, newPeerProfile) {
        const fcnName = "[ConnectionProfile.replacePeerConfig]"
        const self = this;

        if (!oldPeerId || !oldPeerId instanceof String || !oldPeerId.length) {
            throw new Error(`${fcnName} Please specify oldPeerId`)
        };
        if (!newPeerId || !newPeerId instanceof String || !newPeerId.length) {
            throw new Error(`${fcnName} Please specify newPeerId`)
        };
        if (!newPeerProfile) {
            throw new Error(`${fcnName} Please specify newPeerProfile`)
        };

        return new Promise(async (resolve, reject) => {

            try {
                //Replacing old peer id with new peer id in the current organization
                await this.deletePeerFromCurrentOrg(oldPeerId);
                await this.setPeerToCurrentOrg(newPeerId);

                //Replacing old peer id with new peer id in all channels the old peer was member of
                await this.swapPeersInChannels(oldPeerId, newPeerId);

                //Replacing old peer profile with new peer profile
                await this.deletePeerProfile(oldPeerId);
                await this.setPeerProfile(newPeerProfile);

                //Replacing peer ids for all chaincodes
                this.swapPeersInChaincodes(oldPeerId, newPeerId);

                resolve(this);
            } catch (err) {
                throw new Error(`${fcnName} ${err}`);
            }
        })

    }
    //
    //
    ///PEERS END////
}