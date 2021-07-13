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

const semver = require('semver');
const logger = require("./logging").getLogger("chaincode-config-manager");

module.exports = class ChaincodeConfigManager {
    constructor(ambDeployspec, versionFromProfile, newVersionFromProfile) {
        const fcnName = "[ChaincodeConfigManager.constructor]";

        try {
            if (!ambDeployspec) {
                throw Error(` Please supply ambDeployspec parameter`);
            }

            this.name = ambDeployspec.name
            if (!this.name || !this.name instanceof String || !this.name.length) {
                throw new Error(` Please specify name in amb-deployspec.yaml`)
            };

            this.lang = ambDeployspec.lang
            if (!this.lang || !this.lang instanceof String || !this.lang.length) {
                throw new Error(` Please specify lang in amb-deployspec.yaml`)
            };

            this.init = ambDeployspec.init
            if (!this.init || !this.init instanceof String || !this.init.length) {
                throw new Error(` Please specify init parameter in amb-deployspec.yaml`)
            };

            this.channels = ambDeployspec.channels
            if (!ambDeployspec.channels) {
                throw new Error(` Please specify channels consfiguration in channels property in amb-deployspec.yaml`)
            };

            //Initializing all missing elements in channels configuration with empty strings
            for (const channelName in this.channels) {
                const channel = this.channels[channelName];
                if (!channel.endorsementPolicy || !channel.endorsementPolicy instanceof String || !channel.endorsementPolicy.length) {
                    this.channels[channelName].endorsementPolicy = ""
                }
                if (!channel.instantiationPolicy || !channel.instantiationPolicy instanceof String || !channel.instantiationPolicy.length) {
                    this.channels[channelName].instantiationPolicy = ""
                }
                if (!channel.collectionsConfig || !channel.collectionsConfig instanceof String || !channel.collectionsConfig.length) {
                    this.channels[channelName].collectionsConfig = ""
                }
                if (!channel.transientMap || !channel.transientMap instanceof String || !channel.transientMap.length) {
                    this.channels[channelName].transientMap = ""
                }
            }

            if (!ambDeployspec.version || !semver.valid(ambDeployspec.version)) {
                throw new Error(` Please specify correct version in a version parameter in amb-deployspec.yaml (see semver npm for valudation logic)`)
            };
            this.version = semver.clean(ambDeployspec.version);

            //Processing version number if connection Profile has one
            //const versionFromProfile = chaincodeProfile.version;
            if (newVersionFromProfile) {
                const cleanVersionFromProfile = semver.clean(versionFromProfile);
                const cleanNewVersionFromProfile = semver.clean(newVersionFromProfile);

                this.version = cleanVersionFromProfile;
                this.newVersion = cleanNewVersionFromProfile;
            } else {
                if (versionFromProfile) {
                    const cleanVersionFromProfile = semver.clean(versionFromProfile);
                    if (semver.valid(cleanVersionFromProfile)) {
                        if (semver.gte(cleanVersionFromProfile, this.version)) {
                            this.version = cleanVersionFromProfile;
                            this.newVersion = semver.inc(cleanVersionFromProfile, "patch");
                        } else if (semver.eq(cleanVersionFromProfile, this.version)) {
                            this.newVersion = semver.inc(cleanVersionFromProfile, "patch");
                        } else {
                            this.newVersion = this.version; //semver.inc(this.version, "patch");
                        }
                    }

                    // In case we did not specify a new version at all, we assume function will just 
                    // deploy the existing chaincode version
                } else {
                    this.newVersion = this.version;
                }
            }

            this.chaincodePath = ambDeployspec.chaincodePath ? ambDeployspec.chaincodePath : ".";
            this.metadataPath = ambDeployspec.metadataPath ? ambDeployspec.metadataPath : null;

        } catch (err) {
            throw Error(`${fcnName}: ${err}`);
        }
    }
    getChannelsNames() {
        const fcnName = "[ChaincodeConfigManager.getChannelsNames]";
        const self = this;
        const channelNames = [];

        for (const channel in self.channels) {
            channelNames.push(channel);
        }

        return channelNames;
    }
    getName() {
        const fcnName = "[ChaincodeConfigManager.getName]";
        const self = this;

        return self.name;
    }
    getLang() {
        const fcnName = "[ChaincodeConfigManager.getLang]";
        const self = this;

        return self.lang;
    }
    getChaincodePath() {
        const fcnName = "[ChaincodeConfigManager.getChaincodePath]";
        const self = this;

        return self.chaincodePath;
    }
    getMetadataPath() {
        const fcnName = "[ChaincodeConfigManager.getMetadataPath]";
        const self = this;

        return self.metadataPath;
    }
    getVersion() {
        const fcnName = "[ChaincodeConfigManager.getVersion]";
        const self = this;

        return self.version;
    }
    getNewVersion() {
        const fcnName = "[ChaincodeConfigManager.getNewVersion]";
        const self = this;

        return self.newVersion;
    }
    getChannel(channelName) {
        const fcnName = "[ChaincodeConfigManager.getChannel]";
        const self = this;
        const channel = self.channels[channelName]
        return channel;
    }
    getEndorsementPoliciesMap() {
        const fcnName = "[ChaincodeConfigManager.getEndorsementPoliciesMap]";
        const self = this;

        const channelsNamesArray = self.getChannelsNames();
        let endorsementPoliciesMap = {};

        for (let index = 0; index < channelsNamesArray.length; index++) {
            const channelName = channelsNamesArray[index];
            endorsementPoliciesMap[channelName] = self.getChannel(channelName).endorsementPolicy;
        }

        return endorsementPoliciesMap;
    }
    getEndorsementPolicyForChannel(channelName) {
        const fcnName = "[ChaincodeConfigManager.getEndorsementPolicyForChannel]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };

        const endorsementPoliciesMap = self.getEndorsementPoliciesMap();
        let endorsementPolicy = endorsementPoliciesMap[channelName];

        return endorsementPolicy;
    }
    getFcn() {
        const fcnName = "[ChaincodeConfigManager.getFcn]";
        const self = this;

        if (self.init) {
            try {
                const initObj = JSON.parse(self.init);
                if (initObj.Args instanceof Array || typeof initObj.Args === "object") {
                    const functionName = initObj.Args[0];
                    return functionName;
                } else {
                    logger.error(`${fcnName} init prarmeter can't be parsed as array please check amb-deployspec.yaml`);
                    return null;
                }
            } catch (err) {
                logger.error(`${fcnName} Can't parse init prarmeter as JSON from in amb-deployspec.yaml: ${err}`);
                return null;
            }

        }
        logger.error(`${fcnName} init parameter is not specified in amb-deployspec.yaml`);
        return null;
    }
    getArgs() {
        const fcnName = "[ChaincodeConfigManager.getArgs]";
        const self = this;

        if (self.init) {
            try {
                const initObj = JSON.parse(self.init);
                if (initObj.Args instanceof Array || typeof initObj.Args === "object") {
                    const args = initObj.Args.slice(1, initObj.Args.length);
                    return args;
                } else {
                    logger.error(`${fcnName} init prarmeter can't be parsed as array please check amb-deployspec.yaml`);
                    return null;
                }
            } catch (err) {
                logger.error(`${fcnName} Can't parse init prarmeter as JSON from in amb-deployspec.yaml: ${err}`);
                return null;
            }
        }

        logger.error(`${fcnName} init parameter is not specified in amb-deployspec.yaml`);
        return null;
    }
    getInit() {
        const fcnName = "[ChaincodeConfigManager.getInit]";
        const self = this;

        return self.init;
    }
    getTransientMapForChannel(channelName) {
        const fcnName = "[ChaincodeConfigManager.getTransientMapForChannel]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };

        const channelConfig = self.getChannel(channelName);
        const transientMap = channelConfig.transientMap;
        return transientMap;
    }
    getCollectionsConfigForChannel(channelName) {
        const fcnName = "[ChaincodeConfigManager.getCollectionsConfigForChannel]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };

        const channelConfig = self.getChannel(channelName);
        const collectionsConfig = channelConfig.collectionsConfig;
        return collectionsConfig;
    }
    generateChaincodeProfile() {
        const fcnName = "[ChaincodeConfigManager.generateChaincodeProfile]";

        const ccProfile = {
            name: this.getName(),
            endorsementPolicy: this.getEndorsementPoliciesMap(),
            version: this.getVersion(),
            newVersion: this.getNewVersion()
        }

        return ccProfile
    }
}