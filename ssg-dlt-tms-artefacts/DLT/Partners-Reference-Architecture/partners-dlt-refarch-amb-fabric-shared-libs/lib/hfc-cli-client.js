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

let logger = require("./logging").getLogger("hfc-cli-client");
const Utils = require("./utils");
const Util = require('util');
const runCMD = require("./run-cmd");
const ParameterStoreKVS = require("./parameterstore-kvs");
const SecretsManagerKVS = require("./secretsmanager-kvs");
const ConnectionProfile = require("./connection-profile");
const S3Client = require("./s3-client.js");
const fs = require('fs-extra');
const YAML = require('yaml')

const YAML_ORG_ANCHOR_PREFIX = "Org";
const ADMIN_CREDS_KEY = "adminCreds";
const LIB_PATH = "/opt/nodejs/lib";
const CLI_PATH = `${LIB_PATH}/hlf-cli/bin`;
const ADMIN_MSP_ROOT_PATH = "/tmp/admin-msp"; // Stores admin user crypto material
const TMP_MSP_ROOT_PATH = "/tmp/user-msp"; // Temporary stores user's cryptomaterial during enrollment
const ADMIN_SIGNER_CERTS_PATH = `${ADMIN_MSP_ROOT_PATH}/signcerts`
const ADMIN_CERTS_PATH = `${ADMIN_MSP_ROOT_PATH}/admincerts`
const ADMIN_KEYSTORE_PATH = `${ADMIN_MSP_ROOT_PATH}/keystore`
const CA_ROOT_CERT_PATH = `${ADMIN_MSP_ROOT_PATH}/cacerts`
const CHANNELS_STORAGE = "/tmp/channels"
const TLS_CA_CERT_PATH = "/tmp/managedblockchain-tls-chain.pem";
const PASSWORD_LENGTH = 12;
const SIGNING_IDENTITY_LENGTH = 64;

const outputFile = Util.promisify(fs.outputFile);
const readFile = Util.promisify(fs.readFile);
const readdir = Util.promisify(fs.readdir);
const emptyDir = Util.promisify(fs.emptyDir);

const __generateChannelConfig = (orgsArray) => {
    const fcnName = "[HFCCLI __generateChannelConfig]";

    const __createOrgStrWithAnchor = (prefix, index, Name, ID, MSPDir, AnchorPeerHost, AnchorPeerPort) => {
        const fcnName = "[__createOrgStrWithAnchors]";

        const string = `&${prefix}${index}{
            "Name": "${Name}",
            "ID": "${ID}",
            "MSPDir": "${MSPDir}",
            "AnchorPeers": [{
                "Host": ${AnchorPeerHost},
                "Port": ${AnchorPeerPort}
            }]
        }`;
        return string
    }

    const __createOrgAleasesString = (prefix, total) => {
        const fcnName = "[__createOrgAleasesString]";
        let string = `*${prefix}1`;
        if (total > 1) {
            for (let i = 2; i <= total; i++) {
                string = `${string}, *${prefix}${i}`
            }
        }
        return string
    }

    const __createOrgsAnchorsString = (orgsStringArray) => {
        const fcnName = "[__createOrgsAnchorsString]";
        let string = orgsStringArray[0];
        if (orgsStringArray.length > 1) {
            for (let i = 1; i <= orgsStringArray.length; i++) {
                if (orgsStringArray[i] === undefined) {
                    continue
                }
                string = `${string}, ${orgsStringArray[i]}`
            }
        }
        return string
    }

    try {

        let orgsStringArray = [];

        for (let index = 0; index < orgsArray.length; index++) {
            const orgName = orgsArray[index];
            orgsStringArray.push(__createOrgStrWithAnchor(YAML_ORG_ANCHOR_PREFIX, index + 1, orgName, orgName, `${CHANNELS_STORAGE}/${orgName}-msp`, null, null))
        }

        const config = `{
        "Organizations": [${__createOrgsAnchorsString(orgsStringArray)}],
        "Application": &ApplicationDefaults{
            "Organizations": null
        },
        "Profiles": {
            "MultiOrgChannel": {
                "Consortium": "AWSSystemConsortium",
                "Application": {
                    "<<": *ApplicationDefaults,
                    "Organizations": [${__createOrgAleasesString(YAML_ORG_ANCHOR_PREFIX, orgsStringArray.length)}]
                }
            }
        }
    }`;

        logger.debug(`${fcnName} Generated channel config string for processing: ${config}`);

        let jsonObj = YAML.parse(config, {
            anchorPrefix: "anchor"
        });

        let yamlObj = YAML.stringify(jsonObj, {
            anchorPrefix: "anchor",
            merge: true
        }).replace(/\?\s/g, "")

        yamlObj = yamlObj.replace(/Organizations\n/g, "Organizations:\n")
        yamlObj = yamlObj.replace(/Application:\n[\s]*\&/g, "Application: &")
        yamlObj = yamlObj.replace(/Host\n/g, "Host:\n")
        yamlObj = yamlObj.replace(/Port\n/g, "Port:\n")

        logger.debug(`${fcnName} Generated channel config yaml: ${yamlObj}`);

        return yamlObj
    } catch (error) {
        throw new Error(`${fcnName} Failed to generate channel configuration file: ${err}`)
    }
}

const __configtxlatorTransform = (transform, sourceFilePath, targetFilePath) => {
    const fcnName = "[HFCCLI __configtxlatorTransform]";

    let command = "proto_encode";
    let type = "common.Config";
    switch (transform) {
        case "ENCODE_CONFIG":
            command = "proto_encode";
            type = "common.Config";
            break;
        case "DECODE_CONFIG":
            command = "proto_decode";
            type = "common.Config";
            break;
        case "ENCODE_BLOCK":
            command = "proto_encode";
            type = "common.Block"
            break;
        case "DECODE_BLOCK":
            command = "proto_decode";
            type = "common.Block"
            break;
        case "ENCODE_CONFIG_UPDATE":
            command = "proto_encode";
            type = "common.ConfigUpdate"
            break;
        case "DECODE_CONFIG_UPDATE":
            command = "proto_decode";
            type = "common.ConfigUpdate"
            break;
        case "ENCODE_ENVELOPE":
            command = "proto_encode";
            type = "common.Envelope"
            break;
        case "DECODE_ENVELOPE":
            command = "proto_decode";
            type = "common.Envelope"
            break;
        default:
            throw new Error(`${fcnName} Please specify "transform", as ENCODE_<CONFIG | BLOCK | CONFIG_UPDATE | ENVELOPE> or DECODE_<CONFIG | BLOCK | CONFIG_UPDATE | ENVELOPE>  current value: ${JSON.stringify(transform)}`)
    }

    if (!sourceFilePath || !sourceFilePath instanceof String || !sourceFilePath.length) {
        throw new Error(`${fcnName} Please specify "sourceFilePath", current value: ${JSON.stringify(sourceFilePath)}`)
    };
    if (!targetFilePath || !targetFilePath instanceof String || !targetFilePath.length) {
        throw new Error(`${fcnName} Please specify "targetFilePath", current value: ${JSON.stringify(targetFilePath)}`)
    };

    return new Promise(async (resolve, reject) => {
        try {
            const CONFIGTXLATOR_ENCODE_CMD = `${CLI_PATH}/configtxlator ${command} `
            const CONFIGTXLATOR_CMD_PARAMS = `--input ${sourceFilePath} --type ${type} --output ${targetFilePath}`
            const CONFIGTXLATOR_CMD_W_PARAMS = `${CONFIGTXLATOR_ENCODE_CMD} ${CONFIGTXLATOR_CMD_PARAMS}`;

            logger.debug(`${fcnName} Executing command: ${CONFIGTXLATOR_CMD_W_PARAMS}`);
            const result = await runCMD(CONFIGTXLATOR_CMD_W_PARAMS);
            logger.debug(`${fcnName} Result from configtxlator: ${result}`);
            resolve(result);
        } catch (err) {
            //reject(`${fcnName}: Failed to ${transform} from ${sourceFilePath} to ${targetFilePath} : ${err}`)
            throw new Error(`${fcnName}: Failed to ${transform} from ${sourceFilePath} to ${targetFilePath} : ${err}`);
        }
    })
}

const __configtxlatorComputeUpdate = (channelName, originalFilePath, modifiedFilePath, outputFilePath) => {
    const fcnName = "[HFCCLI __configtxlatorComputeUpdate]";

    if (!channelName || !channelName instanceof String || !channelName.length) {
        throw new Error(`${fcnName} Please specify "channelName", current value: ${JSON.stringify(channelName)}`)
    };
    if (!originalFilePath || !originalFilePath instanceof String || !originalFilePath.length) {
        throw new Error(`${fcnName} Please specify "originalFilePath", current value: ${JSON.stringify(originalFilePath)}`)
    };
    if (!modifiedFilePath || !modifiedFilePath instanceof String || !modifiedFilePath.length) {
        throw new Error(`${fcnName} Please specify "modifiedFilePath", current value: ${JSON.stringify(modifiedFilePath)}`)
    };
    if (!outputFilePath || !outputFilePath instanceof String || !outputFilePath.length) {
        throw new Error(`${fcnName} Please specify "outputFilePath", current value: ${JSON.stringify(outputFilePath)}`)
    };
    return new Promise(async (resolve, reject) => {
        try {
            const CONFIGTXLATOR_ENCODE_CMD = `${CLI_PATH}/configtxlator compute_update`
            const CONFIGTXLATOR_CMD_PARAMS = ` --channel_id ${channelName} --original ${originalFilePath} --updated ${modifiedFilePath} --output ${outputFilePath}`
            const CONFIGTXLATOR_CMD_W_PARAMS = `${CONFIGTXLATOR_ENCODE_CMD} ${CONFIGTXLATOR_CMD_PARAMS}`;

            logger.debug(`${fcnName} Executing command: ${CONFIGTXLATOR_CMD_W_PARAMS}`);
            const result = await runCMD(CONFIGTXLATOR_CMD_W_PARAMS);
            logger.debug(`${fcnName} Result from configtxlator: ${result}`);
            resolve(result);
        } catch (err) {
            //reject(`${fcnName}: Failed to ${transform} from ${sourceFilePath} to ${targetFilePath} : ${err}`)
            throw new Error(`${fcnName}: Failed to compute update for channel ${channelName}. Orig file: ${originalFilePath}, Modified file: ${modifiedFilePath}, Output file: ${outputFilePath}: ${err}`);
        }
    })
}

class UserObject {
    constructor(username, mspid, roles, affiliation, enrollmentSecret, signingIdentity, certificate) {
        this.name = username;
        this.mspid = mspid;
        this.roles = roles;
        this.affiliation = affiliation;
        this.enrollmentSecret = enrollmentSecret;
        this.enrollment = {
            signingIdentity: signingIdentity,
            identity: {
                certificate: certificate
            }
        }
        return this
    }
    getName() {
        return this.name
    }
}

module.exports = class HFCCLI {
    constructor(connectionProfileObject) {
        const fcnName = "[HFCCLI.constructor]";

        return new Promise(async (resolve, reject) => {
            try {

                if (!connectionProfileObject instanceof ConnectionProfile) {
                    throw new Error(`${fcnName} Please make sure "connectionProfileObject" is an instance of ConnectionProfile class`)
                }

                this.ConnectionProfileObject = connectionProfileObject;

                this.MEMBER_NAME = this.ConnectionProfileObject.getAmbMemberName();
                this.MEMBER_ID = this.ConnectionProfileObject.getAmbMemberId();
                if (!this.MEMBER_NAME) {
                    throw new Error(`${fcnName} Please check that connection profile has property amb.memberName`)
                }

                if (!fs.pathExistsSync(TLS_CA_CERT_PATH)) {
                    //Downloading AMB cert from s3://us-east-1.managedblockchain/etc/managedblockchain-tls-chain.pem
                    const s3 = new S3Client();
                    await s3.download(this.ConnectionProfileObject.getAmbTLSCertS3BucketName(), this.ConnectionProfileObject.getAmbTLSCertS3ObjectPath(), TLS_CA_CERT_PATH);
                }

                //Setting up admin MSP
                this.USERS_KVS = await new ParameterStoreKVS({
                    prefix: `/amb/${this.ConnectionProfileObject.getAmbNetworkId()}/${this.ConnectionProfileObject.getAmbMemberId()}/users`
                });

                const secretsManagerOptions = {
                    prefix: `/amb/${this.ConnectionProfileObject.getAmbNetworkId()}/${this.ConnectionProfileObject.getAmbMemberId()}/users`
                };

                this.SECRETS_KVS = await new SecretsManagerKVS(secretsManagerOptions);

                const bcAdminCreds = await this.SECRETS_KVS.getValue(ADMIN_CREDS_KEY);

                if (!bcAdminCreds) {
                    throw new Error(`${fcnName} Please put admin credentials to the System's Manager Parameter Store under key ${ADMIN_CREDS_KEY} in a format: {name:<ADMIN_USER_NAME>, password: <PASSWORD>}`);
                }

                const adminName = bcAdminCreds.name;
                const adminPass = bcAdminCreds.password;

                this.__registrar = {
                    username: adminName,
                    password: adminPass
                };

                //Getting peer and oderer address from config
                const peersArray = this.ConnectionProfileObject.getCurrentOrganizationPeers();
                if (!peersArray) {
                    throw new Error(`${fcnName} Please configure peers for your organization.`)
                }
                // Getting a random peer from the array of peers associated with current organization
                this.PEER_ADDRESS = this.ConnectionProfileObject.getPeerAddress(peersArray[Math.floor(Math.random() * Math.floor(peersArray.length - 1))]);
                this.ORDERER_ADDRESS = this.ConnectionProfileObject.getOrdererAddress();
                this.CA_URL = `https://${this.ConnectionProfileObject.getCaAddress(this.MEMBER_ID)}`;
                this.CA_REGISTRAR_URL = `https://${adminName}:${adminPass}@${this.ConnectionProfileObject.getCaAddress(this.MEMBER_ID)}`;
                this.MSP_ID = this.ConnectionProfileObject.getAmbMemberId();


                this.PEER_CLI_CONFIG_SETUP = `export FABRIC_CFG_PATH=${LIB_PATH}/hlf-cli/config && \
                export CORE_PEER_MSPCONFIGPATH=${ADMIN_MSP_ROOT_PATH} && \
                export CORE_PEER_LOCALMSPID=${this.MSP_ID} &&\
                export ORDERER=${this.ORDERER_ADDRESS} &&\
                export CAFILE=${TLS_CA_CERT_PATH}`
                //export CORE_PEER_ADDRESS=${this.PEER_ADDRESS} && \
                this.PEER_CLI_CONFIG_TLS = `export CORE_PEER_TLS_ENABLED=true && export CORE_PEER_TLS_ROOTCERT_FILE=${TLS_CA_CERT_PATH}`

                this.PEER_CMD_SETUP = `${this.PEER_CLI_CONFIG_SETUP} && ${this.PEER_CLI_CONFIG_TLS} && ${CLI_PATH}/`

                this.CA_CMD_SETUP = `export FABRIC_CA_CLIENT_HOME=/tmp && ${CLI_PATH}/`

                // Initializing channels folder
                await runCMD(`rm -rf ${CHANNELS_STORAGE} && mkdir ${CHANNELS_STORAGE}`)

                //export MSP_PATH=/opt/home/admin-msp
                // export MSP=$MEMBERID
                // export ORDERER=$ORDERINGSERVICEENDPOINT
                // export PEER=$PEERSERVICEENDPOINT
                // export CHANNEL=mychannel
                // export CAFILE=/opt/home/managedblockchain-tls-chain.pem
                // export CHAINCODENAME=mycc
                // export CHAINCODEVERSION=v0
                // export CHAINCODEDIR=/tmp/cc

                resolve(this);
            } catch (err) {
                await this.clearCryptoMaterial()
                throw `${fcnName} ${err}`
            }
        })

    }

    getAdminName() {
        const fcnName = "[HFCCLI.getAdminName]"
        return this.__registrar.username;
    }

    getOrgPeerAddress() {
        const fcnName = "[HFCCLI.getOrgPeerAddress]"
        return this.PEER_ADDRESS;
    }

    getPeerCmdSetup() {
        const fcnName = "[HFCCLI.getPeerCmdSetup]"
        return this.PEER_CMD_SETUP;
    }

    getCaCmdSetup() {
        const fcnName = "[HFCCLI.getCaCmdSetup]"
        return this.CA_CMD_SETUP;
    }

    getCurrentOrgId() {
        const fcnName = "[HFCCLI.getCurrentOrgId]"
        return this.MSP_ID;
    }

    getOrdererAddress() {
        const fcnName = "[HFCCLI.getOrdererAddress]"
        return this.ORDERER_ADDRESS
    }

    registerAndEnrollUser(username, doRegister, doEnroll, password, isAdmin) {
        const fcnName = "[HFCCLI.registerAndEnrollUser]"
        const self = this;

        let register = true;
        let enroll = true;
        let setAdmin = false;

        if (doRegister === false) {
            register = false;
        }
        if (doEnroll === false) {
            enroll = false;
        }
        if (isAdmin === true) {
            setAdmin = true;
        }

        logger.debug(`${fcnName} Starting user registration/enrollment with the following params: username: ${username}, register: ${register}, enroll: ${enroll}, setAdmin: ${setAdmin}`)

        return new Promise(async (resolve, reject) => {
            try {

                if (!username || !username instanceof String || !username.length) {
                    throw new Error(`${fcnName} Please specify username. Current value: ${username}`)
                };

                //Check if user is registered
                let userObject = await this.USERS_KVS.getValue(username);

                if (!userObject) {
                    if (register) {
                        const newPassword = password ? password : Utils.__genRandomString(PASSWORD_LENGTH);

                        // Reference command from here: https://docs.aws.amazon.com/managed-blockchain/latest/managementguide/managed-blockchain-hyperledger-create-admin.html
                        // except we don't need an admin
                        //
                        //   fabric-ca-client register --url "https://admin:PaSSme1nto@ca.m-6bcewebgkrgt7gamy6sgoclaei.n-kcecjrdqnvcoffcps5cj6hfuda.managedblockchain.us-east-1.amazonaws.com:30002" \
                        // --id.name user1 --id.secret Password456 \
                        // --id.type user --id.affiliation Nik \
                        // --id.attrs ‘hf.Admin=false’ --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem \
                        // --mspdir /home/ec2-user/admin-msp
                        //
                        //Sample output:
                        // 2020/01/02 09:32:20 [INFO] Configuration file location: /home/ec2-user/.fabric-ca-client/fabric-ca-client-config.yaml
                        // 2020/01/02 09:32:20 [INFO] TLS Enabled
                        // 2020/01/02 09:32:20 [INFO] TLS Enabled
                        // Password: Password456

                        const REGISTER_CMD = `${this.getCaCmdSetup()}fabric-ca-client register`;
                        const REGISTER_CMD_PARAMS = `--url ${this.CA_REGISTRAR_URL} \
                        --id.name ${username} --id.secret ${newPassword} \
                        --id.type user --id.affiliation ${this.MEMBER_NAME} \
                        --id.attrs ‘hf.Admin=${setAdmin}’ --tls.certfiles ${TLS_CA_CERT_PATH} \
                        -M ${ADMIN_MSP_ROOT_PATH}`
                        const REGISTER_CMD_W_PARAMS = `${REGISTER_CMD} ${REGISTER_CMD_PARAMS}`
                        logger.debug(`${fcnName} Executing command: ${REGISTER_CMD_W_PARAMS}`);
                        const resultRegister = await runCMD(REGISTER_CMD_W_PARAMS);

                        logger.debug(`${fcnName} Result from user registration: ${resultRegister}`)

                        await this.SECRETS_KVS.setValue(username, {
                            name: username,
                            password: newPassword
                        })
                    }

                    if (enroll) {
                        // Reference command from here: https://docs.aws.amazon.com/managed-blockchain/latest/managementguide/managed-blockchain-hyperledger-create-admin.html
                        //    fabric-ca-client enroll \
                        // -u https://AdminUser2:Password456@ca.m-K46ICRRXJRCGRNNS4ES4XUUS5A.n-MWY63ZJZU5HGNCMBQER7IN6OIU.managedblockchain.us-east-1.amazonaws.com:30002 \
                        // --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem \
                        // -M /home/ec2-user/admin-msp
                        //
                        // Sample output:
                        // 2020/01/02 09:35:17 [INFO] TLS Enabled
                        // 2020/01/02 09:35:17 [INFO] generating key: &{A:ecdsa S:256}
                        // 2020/01/02 09:35:17 [INFO] encoded CSR
                        // 2020/01/02 09:35:17 [INFO] Stored client certificate at /home/ec2-user/admin-msp/signcerts/cert.pem
                        // 2020/01/02 09:35:17 [INFO] Stored root CA certificate at /home/ec2-user/admin-msp/cacerts/ca-m-6bcewebgkrgt7gamy6sgoclaei-n-kcecjrdqnvcoffcps5cj6hfuda-managedblockchain-us-east-1-amazonaws-com-30002.pem
                        const ENROLL_CMD = `${this.getCaCmdSetup()}fabric-ca-client enroll`;
                        const ENROLL_CMD_PARAMS = `--url ${this.CA_REGISTRAR_URL} --tls.certfiles ${TLS_CA_CERT_PATH} -M ${TMP_MSP_ROOT_PATH}`
                        const ENROLL_CMD_W_PARAMS = `${ENROLL_CMD} ${ENROLL_CMD_PARAMS}`
                        logger.debug(`${fcnName} Executing command: ${ENROLL_CMD_W_PARAMS}`);
                        const resultEnroll = await runCMD(ENROLL_CMD_W_PARAMS);
                        logger.debug(`${fcnName} Result from user enrollment: ${resultEnroll}`)

                        // Creating user object with certificate from the temporary file stored on the file system
                        const certPath = `${TMP_MSP_ROOT_PATH}/signcerts/cert.pem`
                        logger.debug(`${fcnName} Reading user certificate from: ${certPath}`);
                        const userCertRaw = await readFile(certPath, 'utf8');

                        const userCert = userCertRaw;
                        const signingId = Utils.__genRandomString(SIGNING_IDENTITY_LENGTH);
                        userObject = new UserObject(
                            username, // name
                            this.MSP_ID, // mspid
                            null, // roles
                            this.MEMBER_NAME, // affiliation
                            "", // enrollmentSecret
                            signingId, // signingIdentity
                            userCert); // userCertificate
                        logger.debug(`${fcnName} Generated user object: ${JSON.stringify(userObject)}`);

                        logger.debug(`${fcnName} Saving user object to users Key-Value store`)
                        await this.USERS_KVS.setValue(username, JSON.stringify(userObject));

                        // Saving user's private key from the file system to the Secrets KVS.
                        const filesNamesInKeystore = await readdir(`${TMP_MSP_ROOT_PATH}/keystore`)
                        const pKeyName = filesNamesInKeystore[0];
                        logger.debug(`${fcnName} User's private key is stored under ${TMP_MSP_ROOT_PATH}/keystore/${pKeyName}`)

                        const userPrivateKeyRaw = await readFile(`${TMP_MSP_ROOT_PATH}/keystore/${pKeyName}`, 'utf8')
                        const userPrivateKey = userPrivateKeyRaw;

                        logger.debug(`${fcnName} Saving user's private key to secrets Key-Value store`)
                        await this.SECRETS_KVS.setValue(signingId + "-priv", userPrivateKey);

                        // Deleting all temporary stored cryptomaterial
                        await emptyDir(TMP_MSP_ROOT_PATH);
                        logger.debug(`${fcnName} Removed all temporary stored cryptomaterial from the file system`);
                    }
                    resolve(userObject);
                } else {
                    resolve(userObject)
                }
            } catch (err) {
                reject(`${fcnName}: Failed to get registered user: ${username} with error ${err}`);
                throw new Error(`${fcnName}: Failed to get registered user: ${username} with error ${err}`);
            }
        });
    }

    setAdminUserContext() {
        const fcnName = "[HFCCLI.setAdminUserContext]"
        return new Promise(async (resolve, reject) => {
            try {

                const adminName = this.getAdminName();

                if (!adminName) {
                    logger.error(`${fcnName} Seems like admin user credentials are not configured. Please check admin name and password exists in the configured secrets key-value store. You need to enroll the admin user with username and password specified during the creation of the network member.`);
                    throw new Error(`${fcnName} Seems like admin user credentials are not configured. Please check admin name and password exists in the configured secrets key-value store. You need to enroll the admin user with username and password specified during the creation of the network member.`)
                }
                //Downloading admin cert to msp/admincerts/cert.pem
                let adminUserObject = JSON.parse(await this.USERS_KVS.getValue(adminName));

                if (!adminUserObject) {
                    //adminUserObject = await this.registerAndEnrollUser(adminName, false, true, adminPass, true)
                    logger.error(`${fcnName} Seems like admin user is not enrolled yet. Please check admin user object exists in the configured users key-value store. You need to enroll the admin user with username and password specified during the creation of the network member.`);
                    throw new Error(`${fcnName} Seems like admin user is not enrolled yet. Please check admin user object exists in the configured users key-value store. You need to enroll the admin user with username and password specified during the creation of the network member.`)
                }

                const adminUserCert = adminUserObject.enrollment.identity.certificate;
                await outputFile(`${ADMIN_SIGNER_CERTS_PATH}/cert.pem`, adminUserCert)
                logger.debug(`${fcnName} Saved admin cert to ${ADMIN_SIGNER_CERTS_PATH}/cert.pem`);
                //TODO: DELETE ME
                //await runCMD(`cat ${ADMIN_SIGNER_CERTS_PATH}/cert.pem`);

                await outputFile(`${ADMIN_CERTS_PATH}/cert.pem`, adminUserCert)

                logger.debug(`${fcnName} Saved admin cert to ${ADMIN_CERTS_PATH}/cert.pem`);
                //TODO: DELETE ME
                //await runCMD(`cat ${ADMIN_CERTS_PATH}/cert.pem`);

                //TODO: DELETE ME
                // logger.debug(`${fcnName} ls -lah ${ADMIN_MSP_ROOT_PATH}`);
                // await runCMD(`ls -lah ${ADMIN_MSP_ROOT_PATH}`);
                // logger.debug(`${fcnName} ls -lah ${CA_ROOT_CERT_PATH}`);
                // await runCMD(`ls -lah ${CA_ROOT_CERT_PATH}`);
                // logger.debug(`${fcnName} ls -lah ${ADMIN_SIGNER_CERTS_PATH}`);
                // await runCMD(`ls -lah ${ADMIN_SIGNER_CERTS_PATH}`);
                // logger.debug(`${fcnName} ls -lah ${ADMIN_CERTS_PATH}`);
                // await runCMD(`ls -lah ${ADMIN_CERTS_PATH}`);

                //Download admin private key to msp/keystore/cert.pem
                const adminUserPKID = adminUserObject.enrollment.signingIdentity + "-priv";
                const adminUserPK = await this.SECRETS_KVS.getValue(adminUserPKID);

                await outputFile(`${ADMIN_KEYSTORE_PATH}/admin_sk`, adminUserPK);

                logger.debug(`${fcnName} Saved admin secret key to ${ADMIN_KEYSTORE_PATH}/admin_sk`);

                //TODO: DELETE ME
                //await runCMD(`cat ${ADMIN_KEYSTORE_PATH}/admin_sk`);

                //Getting current CA's certificate
                if (!fs.existsSync(`${CA_ROOT_CERT_PATH}`)) {
                    // let CMD_PRE_COND = `export FABRIC_CA_CLIENT_HOME=/tmp &&`
                    // const CMD = `${CLI_PATH}/fabric-ca-client getcacert`
                    const CMD = `${this.getCaCmdSetup()}fabric-ca-client getcacert`
                    const CMD_CA_PARAMS = `-u ${this.CA_URL} -M ${ADMIN_MSP_ROOT_PATH} --tls.certfiles ${TLS_CA_CERT_PATH}`
                    //const commandCA = `${CMD_PRE_COND} ${CMD} ${CMD_CA_PARAMS}`
                    const commandCA = `${CMD} ${CMD_CA_PARAMS}`
                    logger.debug(`${fcnName} Executing command: ${commandCA}`);
                    const resultCA = await runCMD(commandCA);

                    logger.debug(`${fcnName} Retrieved CA cert: ${resultCA}`)
                }

                resolve(adminUserObject);
            } catch (err) {
                logger.error(`${fcnName} Failed to set admin context due to an error: ${JSON.stringify(err)}`);
                reject(`${fcnName}: Failed to set admin context due to an error: ${err}`);
            }
        });
    }


    getCAcert() {
        const fcnName = "[HFCCLI.GetCaCert]"
        return new Promise(async (resolve, reject) => {
            try {

                if (!fs.existsSync(`${CA_ROOT_CERT_PATH}`)) {
                    // let CMD_PRE_COND = `export FABRIC_CA_CLIENT_HOME=/tmp &&`
                    // const CMD = `${CLI_PATH}/fabric-ca-client getcacert`
                    const CMD = `${this.getCaCmdSetup()}fabric-ca-client getcacert`
                    const CMD_CA_PARAMS = `-u ${this.CA_URL} -M ${ADMIN_MSP_ROOT_PATH} --tls.certfiles ${TLS_CA_CERT_PATH}`
                    //const commandCA = `${CMD_PRE_COND} ${CMD} ${CMD_CA_PARAMS}`
                    const commandCA = `${CMD} ${CMD_CA_PARAMS}`
                    logger.debug(`${fcnName} Executing command: ${commandCA}`);
                    const resultCA = await runCMD(commandCA);

                    logger.debug(`${fcnName} Retrieved CA cert: ${resultCA}`);
                } else {
                    logger.debug(`${fcnName} could not find ${CA_ROOT_CERT_PATH}`);
                }

                resolve(true);
            } catch (err) {
                logger.error(`${fcnName} Failed to get CAcert due to an error: ${JSON.stringify(err)}`);
                reject(`${fcnName}: Failed to get CAcert due to an error: ${err}`);
            }
        });
    }


    installChaincodeOnPeers(peersNamesArray, chaincodePath, chaincodePackagePath, chaincodeId, chaincodeLang, chaincodeVersion, metadataPath) {
        const fcnName = "[HFCCLI.installChaincodeOnPeers]";
        const self = this;
        const HFCCLI = self.__hfc;
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
                let peerCertsArray = [];
                logger.debug(`${fcnName} Specified array of peer names: ${JSON.stringify(peersNamesArray)}`);

                await Utils.__arrayIterator(peersNamesArray, (peerName) => {
                    const peerObj = this.ConnectionProfileObject.getPeerAddress(peerName);
                    peerConfigObjectsArray.push(peerObj);
                    peerCertsArray.push(TLS_CA_CERT_PATH);
                })

                if (!peerConfigObjectsArray[0] || !peerConfigObjectsArray.length) {
                    logger.error(`${fcnName} Looks like there is no peers to install chaincode to. Exiting.`);
                    resolve(null);
                }

                logger.debug(`${fcnName} Chaincode ${chaincodeId} will be installed on the following peers: ${JSON.stringify(peerConfigObjectsArray)}`);

                // Installing chaincode on peers
                // Sample command:
                // peer chaincode install -n ngo -l node -v v0 -p /opt/gopath/src/github.com/ngo --cafile /opt/home/managedblockchain-tls-chain.pem --tls --peerAddresses <PEER_ADDRESSES>

                const INSTALL_CC_CMD = `${this.getPeerCmdSetup()}peer chaincode install`
                //const INSTALL_CC_PARAMS = `${chaincodePackagePath} -n ${chaincodeId} -l ${chaincodeLang} -v ${chaincodeVersion} --cafile $CAFILE --tls --tlsRootCertFiles ${peerCertsArray.join(" ")} --peerAddresses ${peerConfigObjectsArray.join(" ")}`
                const INSTALL_CC_PARAMS = `${chaincodePackagePath} --cafile $CAFILE --tls --tlsRootCertFiles ${peerCertsArray.join(" ")} --peerAddresses ${peerConfigObjectsArray.join(" ")}`
                const INSTALL_CC_CMD_W_PARAMS = `${INSTALL_CC_CMD} ${INSTALL_CC_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${INSTALL_CC_CMD_W_PARAMS}`);
                const resultInstall = await runCMD(INSTALL_CC_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result from installing ${chaincodeId} on requested peers ${JSON.stringify(peerConfigObjectsArray)}: ${resultInstall}`)

                // Unfortunately fabric CLI writes the output into the stderr instead of stdout, 
                // therefore we need to parse the output message and detect the error by ourselves...
                if (resultInstall.includes("status:500")) {
                    throw resultInstall;
                }

                logger.debug(`${fcnName} Received response to chaincode installation request: ${JSON.stringify(resultInstall)}`);

                // Removing all unnecessary files
                await emptyDir(CHANNELS_STORAGE);
                resolve(resultInstall);

            } catch (err) {
                logger.error(`${fcnName} Caught an error ${JSON.stringify(err)}, creating a new Error`);
                reject(`${fcnName}: Failed to send install proposal due to an error: ${err}`);
            }
        });
    }

    __instantiateUpgradeChaincodeOnChannel(isInstantiate, peerAddress, channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig) {
        const fcnName = "[HFCCLI.instantiateUpgradeChaincodeOnChannel]";
        const self = this;

        if (!peerAddress || !peerAddress instanceof String) {
            throw new Error(`${fcnName} Please specify peerAddress. Current value: ${peerAddress}`)
        };

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName. Current value: ${channelName}`)
        };
        if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
            throw new Error(`${fcnName} Please specify chaincodeId. Current value: ${chaincodeId}`)
        };
        if (!chaincodeLang || !chaincodeLang instanceof String || !chaincodeLang.length) {
            throw new Error(`${fcnName} Please specify chaincodeLang. Current value: ${chaincodeLang}`)
        };

        logger.debug(`${fcnName} Received parametes: ${JSON.stringify({
            isInstantiate: isInstantiate, 
            channelName: channelName, 
            chaincodeId: chaincodeId, 
            chaincodeLang: chaincodeLang, 
            chaincodeVersion: chaincodeVersion, 
            endorsementPolicy: endorsementPolicy, 
            fcn: fcn, 
            args: args, 
            transientMap: transientMap, 
            collectionsConfig: collectionsConfig
        })}`)

        return new Promise(async (resolve, reject) => {
            try {

                // Constructing initialization string in case fcn && args parameters are specified
                let constructorMsg = null;
                if (fcn && fcn !== "") {
                    if (!fcn || !(fcn instanceof String || typeof fcn === 'string') || !fcn.length) {
                        throw new Error(`${fcnName} Please make sure "fcn" is of type String`)
                    };
                    let argsString = "";
                    if (args && args.length) {
                        if (!(args instanceof Array || typeof args === 'object')) {
                            throw new Error(`${fcnName} Please make sure "args" is of type Array`)
                        }
                        argsString = args.join('","');
                    };
                    constructorMsg = `{"Args":["${fcn}" ${argsString ? `, "${argsString}"` : ""}]}`;
                    logger.debug(`${fcnName} Generated initialization message: ${constructorMsg}`);
                }

                // Sample command:
                // peer chaincode instantiate -o $ORDERER -C $CHANNEL -n $CHAINCODENAME -v $CHAINCODEVERSION \
                // -c '{"Args":["init","a","100","b","200"]}' -P "AND('Org1.admin','Org2.admin')" --cafile $CAFILE --tls

                const INS_PEER_ADDRESS = peerAddress.length ? peerAddress : this.getOrgPeerAddress();
                const INSTANTIATE_CC_CMD = `${this.getPeerCmdSetup()}peer chaincode instantiate`
                const UPGRADE_CC_CMD = `${this.getPeerCmdSetup()}peer chaincode upgrade`
                const INS_UP_CC_PARAMS = `-o $ORDERER -C ${channelName} -n ${chaincodeId}${chaincodeVersion ? ` -v ${chaincodeVersion}` : ""}\
                 ${constructorMsg ? ` -c '${constructorMsg}'` : ""}${endorsementPolicy ? ` -P '${endorsementPolicy}'` : ""} --cafile $CAFILE --tls --tlsRootCertFiles $CAFILE --peerAddresses ${INS_PEER_ADDRESS}`
                const INS_UP_CC_CMD_W_PARAMS = `${isInstantiate ? INSTANTIATE_CC_CMD : UPGRADE_CC_CMD} ${INS_UP_CC_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${INS_UP_CC_CMD_W_PARAMS}`);
                const resultUpgrade = await runCMD(INS_UP_CC_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result from instantiation/upgrage ${chaincodeId} on channel ${channelName}: ${resultUpgrade}`);
                resolve(resultUpgrade);

            } catch (err) {
                reject(`${fcnName}: Failed to instantiate or upgrade chaincode: ${err}`);
            }
        });

    }

    instantiateChaincodeOnChannel(peerAddress, channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig) {
        const fcnName = "[HFCCLI.instantiateChaincodeOnChannel]";
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                const result = await self.__instantiateUpgradeChaincodeOnChannel(true, peerAddress, channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig);
                resolve(result);
            } catch (err) {
                reject(`${fcnName}: Failed to instantiate chaincode: ${err}`)
                throw new Error(`${fcnName}: Failed to instantiate chaincode: ${err}`);
            }
        });
    }

    upgradeChaincodeOnChannel(peerAddress, channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig) {
        const fcnName = "[HFCCLI.upgradeChaincodeOnChannel]";
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                const result = await self.__instantiateUpgradeChaincodeOnChannel(false, peerAddress, channelName, chaincodeId, chaincodeLang, chaincodeVersion, endorsementPolicy, fcn, args, transientMap, collectionsConfig);
                resolve(result);
            } catch (err) {
                reject(`${fcnName}: Failed to upgrade chaincode: ${err}`)
                throw new Error(`${fcnName}: Failed to upgrade chaincode: ${err}`);
            }
        });
    }

    createChannel(channelName, orgsArray, channelS3BucketName) {
        const fcnName = "[HFCCLI.createChannel]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify "channelName", current value: ${JSON.stringify(channelName)}`)
        };

        if (channelName.length > 250) {
            throw new Error(`${fcnName} The value of "channelName" should not be longer than 250 lower-case alpha-numeric characters, dots (.), and dashes (-) starting with a letter`)
        }

        const regex = RegExp('^[a-z][a-z0-9\-\.]*', 's');
        if (!regex.test(channelName)) {
            throw new Error(`${fcnName} The value of "channelName" should not be a lower-case alpha-numeric characters string with dots (.), and dashes (-), and starting with a letter`)
        }

        if (!orgsArray || !orgsArray instanceof Array || !orgsArray.length) {
            throw new Error(`${fcnName} Please specify "orgsArray", current value: ${JSON.stringify(orgsArray)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {

                //Initializing current org's msp folder for the channel
                const currentOrgMspPath = `${CHANNELS_STORAGE}/${this.getCurrentOrgId()}-msp`
                // await copy(ADMIN_SIGNER_CERTS_PATH, `${currentOrgMspPath}/`)
                // await copy(ADMIN_CERTS_PATH, `${currentOrgMspPath}/`)
                // await copy(CA_ROOT_CERT_PATH, `${currentOrgMspPath}/`)
                await runCMD(`mkdir ${currentOrgMspPath}`)
                await runCMD(`cp -r ${ADMIN_CERTS_PATH} ${currentOrgMspPath}/`)
                await runCMD(`cp -r ${CA_ROOT_CERT_PATH} ${currentOrgMspPath}/`)

                //TODO: Delete me
                await runCMD(`ls -lah ${currentOrgMspPath}`)

                // TODO: Download required MSP configs for the rest of the the organizations:
                // - Admin cert from s3://<CHANNEL_S3_BUCKET_NAME>/channels/<CHANNEL_NAME>/msps/<ORG_NAME>-msp/admincerts
                // -- To: /tmp/<ORG_NAME>-msp/admincerts
                // - Root CA cert from s3://<CHANNEL_S3_BUCKET_NAME>/channels/<CHANNEL_NAME>/msps/<ORG_NAME>-msp/cacerts
                // -- To: /tmp/<ORG_NAME>-msp/cacerts

                // Generate configuration file for configtx
                const channelConfig = __generateChannelConfig(orgsArray);
                logger.debug(`${fcnName} Generated channel config: ${channelConfig}`);

                await outputFile(`${CHANNELS_STORAGE}/configtx.yaml`, channelConfig);

                // TODO: Delete
                await runCMD(`cat ${CHANNELS_STORAGE}/configtx.yaml`);

                // Run configtx and generate channel creation transaction file
                // Sample command:
                //
                // configtxgen \
                // -outputCreateChannelTx /opt/home/mychannel.pb \
                // -profile OneOrgChannel -channelID mychannel \
                // -configPath /opt/home/
                const CONFIGTXGEN_CMD = `${CLI_PATH}/configtxgen `
                const CONFIGTXGEN_CMD_PARAMS = `-outputCreateChannelTx ${CHANNELS_STORAGE}/${channelName}.pb \
                 -profile MultiOrgChannel -channelID ${channelName} \
                 --configPath ${CHANNELS_STORAGE}/`
                const CONFIGTXGEN_CMD_W_PARAMS = `${CONFIGTXGEN_CMD} ${CONFIGTXGEN_CMD_PARAMS}`;

                logger.debug(`${fcnName} Executing command: ${CONFIGTXGEN_CMD_W_PARAMS}`);
                const resultConfigTxGen = await runCMD(CONFIGTXGEN_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result from configtxgen: ${resultConfigTxGen}`);

                // TODO: Run peer CLI to create a new channel
                // Sample command:
                // peer channel create -c mychannel -f /opt/home/mychannel.pb -o $ORDERER

                const NEW_CHANNEL_TX_FILE_NAME = `${CHANNELS_STORAGE}/${channelName}.pb`
                const NEW_CHANNEL_TX_CMD = `${this.getPeerCmdSetup()}peer channel create `
                const NEW_CHANNEL_TX_PARAMS = `-c ${channelName} -f ${NEW_CHANNEL_TX_FILE_NAME} --outputBlock ${CHANNELS_STORAGE}/${channelName}.block --orderer $ORDERER --cafile $CAFILE --tls --timeout 900s`

                const NEW_CHANNEL_TX_CMD_W_PARAMS = `${NEW_CHANNEL_TX_CMD} ${NEW_CHANNEL_TX_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${NEW_CHANNEL_TX_CMD_W_PARAMS}`);
                const result = await runCMD(NEW_CHANNEL_TX_CMD_W_PARAMS);

                logger.debug(`${fcnName} Received response to create channel request: ${JSON.stringify(result)}`);

                // Removing all unnecessary files
                await emptyDir(CHANNELS_STORAGE);
                resolve(result);
            } catch (err) {
                await this.clearCryptoMaterial()
                reject(`${fcnName}: Failed to create a new channel ${channelName}: ${err}`)
                throw new Error(`${fcnName}: Failed to create a new channel ${channelName}: ${err}`);
            }
        })
    }

    getChannelConfig(channelName) {
        const fcnName = "[HFCCLI.getChannelConfig]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify "channelName", current value: ${JSON.stringify(channelName)}`)
        };

        if (channelName.length > 250) {
            throw new Error(`${fcnName} The value of "channelName" should not be longer than 250 lower-case alpha-numeric characters, dots (.), and dashes (-) starting with a letter`)
        }

        const regex = RegExp('^[a-z][a-z0-9\-\.]*', 's');
        if (!regex.test(channelName)) {
            throw new Error(`${fcnName} The value of "channelName" should not be a lower-case alpha-numeric characters string with dots (.), and dashes (-), and starting with a letter`)
        }

        return new Promise(async (resolve, reject) => {
            try {

                //Initializing current org's msp folder for the channel
                const currentOrgMspPath = `${CHANNELS_STORAGE}/${this.getCurrentOrgId()}-msp`
                // await copy(ADMIN_SIGNER_CERTS_PATH, `${currentOrgMspPath}/`)
                // await copy(ADMIN_CERTS_PATH, `${currentOrgMspPath}/`)
                // await copy(CA_ROOT_CERT_PATH, `${currentOrgMspPath}/`)
                await runCMD(`mkdir ${currentOrgMspPath}`)
                await runCMD(`cp -r ${ADMIN_CERTS_PATH} ${currentOrgMspPath}/`)
                await runCMD(`cp -r ${CA_ROOT_CERT_PATH} ${currentOrgMspPath}/`)

                //TODO: Delete me
                await runCMD(`ls -lah ${currentOrgMspPath}`)

                // Run peer CLI to get channel config
                // Sample command:
                // peer channel fetch config config_block.pb -o orderer.example.com:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
                const GET_CHANNEL_CFG_FILE_NAME = `${CHANNELS_STORAGE}/${channelName}.pb`
                const GET_CHANNEL_CFG_CMD = `${this.getPeerCmdSetup()}peer channel fetch config `
                const GET_CHANNEL_CFG_PARAMS = `${GET_CHANNEL_CFG_FILE_NAME} -c ${channelName} --orderer $ORDERER --cafile $CAFILE --tls`

                const GET_CHANNEL_CFG_CMD_W_PARAMS = `${GET_CHANNEL_CFG_CMD} ${GET_CHANNEL_CFG_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${GET_CHANNEL_CFG_CMD_W_PARAMS}`);
                const resultFetchChannelConfig = await runCMD(GET_CHANNEL_CFG_CMD_W_PARAMS);

                logger.debug(`${fcnName} Received response to create channel request: ${JSON.stringify(resultFetchChannelConfig)}`);

                // Converting channel config from PB to JSON
                // Sample command:
                //
                // configtxlator proto_decode --input config_block.pb \
                // --type common.Block | jq .data.data[0].payload.data.config > config.json
                const CHANNEL_CFG_JSON_FILE_NAME = `${CHANNELS_STORAGE}/config.json`;

                await __configtxlatorTransform("DECODE_BLOCK", GET_CHANNEL_CFG_FILE_NAME, CHANNEL_CFG_JSON_FILE_NAME)

                const channelConfigWithEnvelope = await readFile(CHANNEL_CFG_JSON_FILE_NAME, 'utf8');
                logger.debug(`${fcnName} channelConfigWithEnvelope: ${JSON.stringify(JSON.parse(channelConfigWithEnvelope))}`);
                const channelConfig = JSON.parse(channelConfigWithEnvelope).data.data[0].payload.data.config;
                logger.debug(`${fcnName} channelConfig: ${JSON.stringify(channelConfig)}`);

                const result = channelConfig;

                // Removing all unnecessary files
                await emptyDir(CHANNELS_STORAGE);
                resolve(result);
            } catch (err) {
                await this.clearCryptoMaterial()
                reject(`${fcnName}: Failed to retrieve config for channel ${channelName}: ${err}`)
                throw new Error(`${fcnName}: Failed to retrieve config for channel ${channelName}: ${err}`);
            }
        })
    }

    __updateChannelConfig(channelName, origChannelConfig, modChannelConfig) {
        const fcnName = "[HFCCLI.updateChannelConfig]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify "channelName", current value: ${JSON.stringify(channelName)}`)
        };

        if (channelName.length > 250) {
            throw new Error(`${fcnName} The value of "channelName" should not be longer than 250 lower-case alpha-numeric characters, dots (.), and dashes (-) starting with a letter`)
        }

        const regex = RegExp('^[a-z][a-z0-9\-\.]*', 's');
        if (!regex.test(channelName)) {
            throw new Error(`${fcnName} The value of "channelName" should not be a lower-case alpha-numeric characters string with dots (.), and dashes (-), and starting with a letter`)
        }

        if (!origChannelConfig) {
            throw new Error(`${fcnName} Please specify "origChannelConfig", current value: ${JSON.stringify(origChannelConfig)}`)
        };

        if (!modChannelConfig) {
            throw new Error(`${fcnName} Please specify "modChannelConfig", current value: ${JSON.stringify(modChannelConfig)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {
                logger.debug(`${fcnName} Staring to process update for channel config`)
                logger.debug(`${fcnName} Original channel config: ${JSON.stringify(origChannelConfig)}`);
                logger.debug(`${fcnName} Modified channel config: ${JSON.stringify(modChannelConfig)}`);

                // Save JSON objects to the files on the file system
                const ORIG_CHANNEL_CFG_JSON_FILE_NAME = `${CHANNELS_STORAGE}/config-orig.json`
                await outputFile(ORIG_CHANNEL_CFG_JSON_FILE_NAME, JSON.stringify(origChannelConfig));

                const MOD_CHANNEL_CFG_JSON_FILE_NAME = `${CHANNELS_STORAGE}/config-mod.json`
                await outputFile(MOD_CHANNEL_CFG_JSON_FILE_NAME, JSON.stringify(modChannelConfig));

                // Convert original channel config from JSON to BP
                // configtxlator proto_encode --input config-orig.json --type common.Config --output config-orig.pb
                const ORIG_CHANNEL_CFG_PB_FILE_NAME = `${CHANNELS_STORAGE}/config-orig.pb`
                await __configtxlatorTransform("ENCODE_CONFIG", ORIG_CHANNEL_CFG_JSON_FILE_NAME, ORIG_CHANNEL_CFG_PB_FILE_NAME);

                // Convert modified channel config from JSON to BP
                // configtxlator proto_encode --input config-mod.json --type common.Config --output config-mod.pb
                const MOD_CHANNEL_CFG_PB_FILE_NAME = `${CHANNELS_STORAGE}/config-mod.pb`
                await __configtxlatorTransform("ENCODE_CONFIG", MOD_CHANNEL_CFG_JSON_FILE_NAME, MOD_CHANNEL_CFG_PB_FILE_NAME)

                // Calculate the difference between original and modified configs
                // configtxlator compute_update --channel_id ${channelName} --original config-orig.pb --updated config-mod.pb --output config-diff.pb
                const DIFF_CHANNEL_CFG_PB_FILE_NAME = `${CHANNELS_STORAGE}/config-diff.pb`
                await __configtxlatorComputeUpdate(channelName, ORIG_CHANNEL_CFG_PB_FILE_NAME, MOD_CHANNEL_CFG_PB_FILE_NAME, DIFF_CHANNEL_CFG_PB_FILE_NAME)

                // Convert BP with difference  in the update back to JSON
                // configtxlator proto_decode --input config-diff.pb --type common.ConfigUpdate > config-diff.json
                const DIFF_CHANNEL_CFG_JSON_FILE_NAME = `${CHANNELS_STORAGE}/config-diff.json`
                await __configtxlatorTransform("DECODE_CONFIG_UPDATE", DIFF_CHANNEL_CFG_PB_FILE_NAME, DIFF_CHANNEL_CFG_JSON_FILE_NAME)

                // Read JSON file with config update difference into a JSON object
                const channelConfigDiffWithoutEnvelopeStr = await readFile(DIFF_CHANNEL_CFG_JSON_FILE_NAME, 'utf8');
                //const channelConfigDiffWithoutEnvelopeStr = await Buffer.from(channelConfigDiffWithoutEnvelopeRaw).toString('base64')
                const channelConfigDiffWithoutEnvelopeJSON = JSON.parse(channelConfigDiffWithoutEnvelopeStr);

                logger.debug(`${fcnName} Channel Config Diff without envelope: ${JSON.stringify(channelConfigDiffWithoutEnvelopeJSON)}`)

                // Put envelope around config diff
                // '{"payload":{"header":{"channel_header":{"channel_id":"${channelName}", type:2}},"data":{"config_update":'$(cat `${CHANNELS_STORAGE}/config-diff.json`)'}}}'
                const channelConfigDiffInEnvelope = {
                    payload: {
                        header: {
                            channel_header: {
                                channel_id: channelName,
                                type: 2
                            }
                        },
                        data: {
                            config_update: channelConfigDiffWithoutEnvelopeJSON
                        }
                    }
                }

                logger.debug(`${fcnName} Channel Config Diff in envelope: ${JSON.stringify(channelConfigDiffInEnvelope)}`)

                // Save config diff in the invelope to the file system
                const DIFF_CHANNEL_CFG_JSON_IN_ENVELOPE_FILE_NAME = `${CHANNELS_STORAGE}/config-diff-in-envelope.json`
                await outputFile(DIFF_CHANNEL_CFG_JSON_IN_ENVELOPE_FILE_NAME, JSON.stringify(channelConfigDiffInEnvelope));

                // Convert config diff with envelope back from JSON to PB
                // configtxlator proto_encode --input config-diff-in-envelope.json --type common.Envelope --output ${CHANNELS_STORAGE}/config-diff-in-envelope.pb
                const DIFF_CHANNEL_CFG_PB_IN_ENVELOPE_FILE_NAME = `${CHANNELS_STORAGE}/config-diff-in-envelope.pb`
                await __configtxlatorTransform("ENCODE_ENVELOPE", DIFF_CHANNEL_CFG_JSON_IN_ENVELOPE_FILE_NAME, DIFF_CHANNEL_CFG_PB_IN_ENVELOPE_FILE_NAME)

                // Submit an update to the channel config
                // peer channel update -f ${CHANNELS_STORAGE}/config-diff-in-envelope.pb -c ${channelName} -o orderer.example.com:7050 --tls --cafile $ORDERER_CA

                //Initializing current org's msp folder for the channel
                const currentOrgMspPath = `${CHANNELS_STORAGE}/${this.getCurrentOrgId()}-msp`
                // await copy(ADMIN_SIGNER_CERTS_PATH, `${currentOrgMspPath}/`)
                // await copy(ADMIN_CERTS_PATH, `${currentOrgMspPath}/`)
                // await copy(CA_ROOT_CERT_PATH, `${currentOrgMspPath}/`)
                await runCMD(`mkdir ${currentOrgMspPath}`)
                await runCMD(`cp -r ${ADMIN_CERTS_PATH} ${currentOrgMspPath}/`)
                await runCMD(`cp -r ${CA_ROOT_CERT_PATH} ${currentOrgMspPath}/`)

                //TODO: Delete me
                await runCMD(`ls -lah ${currentOrgMspPath}`)

                const UPDATE_CHANNEL_CFG_CMD = `${this.getPeerCmdSetup()}peer channel update`
                const UPDATE_CHANNEL_CFG_PARAMS = ` -f ${DIFF_CHANNEL_CFG_PB_IN_ENVELOPE_FILE_NAME} -c ${channelName} --orderer $ORDERER --cafile $CAFILE --tls`

                const UPDATE_CHANNEL_CFG_CMD_W_PARAMS = `${UPDATE_CHANNEL_CFG_CMD} ${UPDATE_CHANNEL_CFG_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${UPDATE_CHANNEL_CFG_CMD_W_PARAMS}`);
                const result = await runCMD(UPDATE_CHANNEL_CFG_CMD_W_PARAMS);

                logger.debug(`${fcnName} Received response to update channel request: ${JSON.stringify(result)}`);

                // Removing all unnecessary files
                await emptyDir(CHANNELS_STORAGE);
                resolve(result);
            } catch (err) {
                await this.clearCryptoMaterial()
                reject(`${fcnName}: Failed to update config for channel ${channelName}: ${err}`)
                throw new Error(`${fcnName}: Failed to update config for channel ${channelName}: ${err}`);
            }
        })
    }

    addChannelMember(channelName, newOrgId, channelS3BucketName) {
        const fcnName = "[HFCCLI.addChannelMember]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify "channelName", current value: ${JSON.stringify(channelName)}`)
        };

        if (channelName.length > 250) {
            throw new Error(`${fcnName} The value of "channelName" should not be longer than 250 lower-case alpha-numeric characters, dots (.), and dashes (-) starting with a letter`)
        }

        const regex = RegExp('^[a-z][a-z0-9\-\.]*', 's');
        if (!regex.test(channelName)) {
            throw new Error(`${fcnName} The value of "channelName" should not be a lower-case alpha-numeric characters string with dots (.), and dashes (-), and starting with a letter`)
        }

        if (!newOrgId || !newOrgId instanceof String || !newOrgId.length) {
            throw new Error(`${fcnName} Please specify "newOrgId", current value: ${JSON.stringify(newOrgId)}`)
        };

        if (!channelS3BucketName || !channelS3BucketName instanceof String || !channelS3BucketName.length) {
            throw new Error(`${fcnName} Please specify "channelS3BucketName", current value: ${JSON.stringify(channelS3BucketName)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {

                // TODO: Download required MSP certs for the new member organizations:
                // - Admin cert from s3://<CHANNEL_S3_BUCKET_NAME>/channels/<CHANNEL_NAME>/msps/<ORG_NAME>-msp/admincerts
                // -- To: /tmp/<ORG_NAME>-msp/admincerts
                // - Root CA cert from s3://<CHANNEL_S3_BUCKET_NAME>/channels/<CHANNEL_NAME>/msps/<ORG_NAME>-msp/cacerts
                // -- To: /tmp/<ORG_NAME>-msp/cacerts

                //Initializing new member org's msp folder for the channel
                const newOrgMspPath = `${CHANNELS_STORAGE}/${newOrgId}-msp`
                const newOrgAdminCertsPath = `${newOrgMspPath}/admincerts`
                const newOrgCACertsPath = `${newOrgMspPath}/cacerts`
                await runCMD(`mkdir ${newOrgMspPath}`)
                await runCMD(`mkdir ${newOrgAdminCertsPath}`)
                await runCMD(`mkdir ${newOrgCACertsPath}`)
                const newOrgAdminCertFilePath = `${newOrgAdminCertsPath}/cert.pem`
                const newOrgCACertFilePath = `${newOrgCACertsPath}/cert.pem`

                const s3 = new S3Client();
                const newOrgAdminCertObjectPath = `channels/${channelName}/members/${newOrgId}/admincerts/cert.pem`;
                await s3.download(channelS3BucketName, newOrgAdminCertObjectPath, newOrgAdminCertFilePath);
                const newOrgCACertObjectPath = `channels/${channelName}/members/${newOrgId}/cacerts/cert.pem`;
                await s3.download(channelS3BucketName, newOrgCACertObjectPath, newOrgCACertFilePath);

                // Converting all certificates to base64 encoding to add them to the oreganization's config later
                const newOrgAdminCertRawString = await readFile(newOrgAdminCertFilePath);
                const newOrgCACertRawString = await readFile(newOrgCACertFilePath);

                const newOrgAdminCertBase64String = await Buffer.from(newOrgAdminCertRawString).toString('base64');
                const newOrgCACertBase64String = await Buffer.from(newOrgCACertRawString).toString('base64');

                // Generating new organization's config
                const newOrgConfig = {
                    mod_policy: "Admins",
                    policies: {
                        Admins: {
                            mod_policy: "Admins",
                            policy: {
                                type: 1,
                                value: {
                                    identities: [{
                                        principal: {
                                            msp_identifier: "AWSMSP",
                                            role: "ADMIN"
                                        },
                                        principal_classification: "ROLE"
                                    }, {
                                        principal: {
                                            msp_identifier: newOrgId,
                                            role: "ADMIN"
                                        },
                                        principal_classification: "ROLE"
                                    }],
                                    rule: {
                                        n_out_of: {
                                            n: 1,
                                            rules: [{
                                                signed_by: 0
                                            }, {
                                                signed_by: 1
                                            }]
                                        }
                                    },
                                    version: 0
                                }
                            },
                            version: "0"
                        },
                        Readers: {
                            mod_policy: "Admins",
                            policy: {
                                type: 1,
                                value: {
                                    identities: [{
                                        principal: {
                                            msp_identifier: newOrgId,
                                            role: "MEMBER"
                                        },
                                        principal_classification: "ROLE"
                                    }],
                                    rule: {
                                        n_out_of: {
                                            n: 1,
                                            rules: [{
                                                signed_by: 0
                                            }]
                                        }
                                    },
                                    version: 0
                                }
                            },
                            version: "0"
                        },
                        Writers: {
                            mod_policy: "Admins",
                            policy: {
                                type: 1,
                                value: {
                                    identities: [{
                                        principal: {
                                            msp_identifier: newOrgId,
                                            role: "MEMBER"
                                        },
                                        principal_classification: "ROLE"
                                    }],
                                    rule: {
                                        n_out_of: {
                                            n: 1,
                                            rules: [{
                                                signed_by: 0
                                            }]
                                        }
                                    },
                                    version: 0
                                }
                            },
                            version: "0"
                        }
                    },
                    values: {
                        MSP: {
                            mod_policy: "Admins",
                            value: {
                                config: {
                                    admins: [newOrgAdminCertBase64String],
                                    crypto_config: {
                                        identity_identifier_hash_function: "SHA256",
                                        signature_hash_family: "SHA2"
                                    },
                                    name: newOrgId,
                                    root_certs: [newOrgCACertBase64String]
                                },
                                type: 0
                            },
                            version: "0"
                        }
                    },
                    version: "0"
                }

                // Retreive channel config
                const origChannelConfig = await this.getChannelConfig(channelName);
                logger.debug(`${fcnName} Original channel config: ${JSON.stringify(origChannelConfig)}`);

                // Don't ask why...
                let modChannelConfig = JSON.parse(JSON.stringify(origChannelConfig));

                // TODO: Reconsider this once we will have a better way to collect signatures from network members
                // If channel_group.groups.Application.policies.Admins.policy.value.rule == "MAJORITY", 
                // change it to "ANY" to simplify channel management
                if (origChannelConfig.channel_group.groups.Application.policies.Admins.policy.value.rule === "MAJORITY") {
                    modChannelConfig.channel_group.groups.Application.policies.Admins.policy.value.rule = "ANY";
                }

                // Add org config JSON to the channel config
                modChannelConfig.channel_group.groups.Application.groups[newOrgId] = newOrgConfig;
                logger.debug(`${fcnName} Modified channel config: ${JSON.stringify(modChannelConfig)}`);

                // Update channel config
                const result = await this.__updateChannelConfig(channelName, origChannelConfig, modChannelConfig);

                // Removing all unnecessary files
                await emptyDir(CHANNELS_STORAGE);
                resolve(result);
            } catch (err) {
                await this.clearCryptoMaterial()
                reject(`${fcnName}: Failed to create a new channel ${channelName}: ${err}`)
                throw new Error(`${fcnName}: Failed to create a new channel ${channelName}: ${err}`);
            }
        })
    }

    joinChannel(channelName, peerName) {
        const fcnName = "[HFCCLI.joinChannel]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };

        if (!peerName || !peerName instanceof String || !peerName.length) {
            throw new Error(`${fcnName} Please specify peerName, current value: ${JSON.stringify(peerName)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {

                //Receiving genesis block from Ordering service
                //Example: peer channel fetch 0  -c mychannel --orderer orderer.example.com:7050
                const GEN_BLK_FILE_NAME = `${CHANNELS_STORAGE}/${channelName}.block`
                const GEN_BLK_CMD = `${this.getPeerCmdSetup()}peer channel fetch 0 ${GEN_BLK_FILE_NAME}`
                const GEN_BLK_CMD_PARAMS = `-c ${channelName} --orderer $ORDERER --cafile $CAFILE --tls --connTimeout 60s`

                const GEN_BLK_CMD_W_PARAMS = `${GEN_BLK_CMD} ${GEN_BLK_CMD_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${GEN_BLK_CMD_W_PARAMS}`);
                const resultFetch = await runCMD(GEN_BLK_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result from fetching the genesis block: ${resultFetch}`)

                //Get new peer config
                const peerAddress = this.ConnectionProfileObject.getPeerAddress(peerName);

                if (!peerAddress) {
                    throw new Error(`${fcnName} Peer with name ${peerName} doesn't seem have address set in Connection Profile. Please refresh the cache if it was updated.`)
                }

                // Joining peer to the channel
                // Sample command:
                //peer channel join -b /opt/home/ourchannel.block \
                //-o $ORDERER --cafile /opt/home/managedblockchain-tls-chain.pem --tls

                const PEER_ADDRESS_SETUP = `export CORE_PEER_ADDRESS=${peerAddress} && `
                const JOIN_CHANNEL_CMD = `${PEER_ADDRESS_SETUP} ${this.getPeerCmdSetup()}peer channel join`
                const JOIN_CHANNEL_PARAMS = `-b ${GEN_BLK_FILE_NAME} --orderer $ORDERER --cafile $CAFILE --tls --connTimeout 60s`
                const JOIN_CHANNEL_CMD_W_PARAMS = `${JOIN_CHANNEL_CMD} ${JOIN_CHANNEL_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${JOIN_CHANNEL_CMD_W_PARAMS}`);
                const resultJoin = await runCMD(JOIN_CHANNEL_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result from joining peer ${peerName} to channel ${channelName}: ${resultJoin}`)


                // Unfortunately fabric CLI writes the output into the stderr instead of stdout, 
                // therefore we need to parse the output message and detect the error by ourselves...
                if (resultJoin.includes("status:500")) {
                    throw resultJoin;
                }

                logger.debug(`${fcnName} Received response to join channel request: ${JSON.stringify(resultJoin)}`);

                // Removing all unnecessary files
                await emptyDir(CHANNELS_STORAGE);
                resolve(resultJoin);
            } catch (err) {
                await this.clearCryptoMaterial()
                reject(`${fcnName}: Failed to join the channel ${channelName}: ${err}`)
                throw new Error(`${fcnName}: Failed to join the channel ${channelName}: ${err}`);
            }
        })
    }

    getInstantiatedChaincodesFromChannel(channelName) {
        const fcnName = "[HFCCLI.getInstantiatedChaincodesFromChannel]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {
                // Sample CLI command:
                // peer chaincode list --instantiated --cafile $CAFILE --tls
                //
                // Sample response:
                // Get instantiated chaincodes on peer:
                // Name: mycc, Version: v0, Escc: escc, Vscc: vscc
                const LIST_INSTANT_CC_CMD = `${this.getPeerCmdSetup()}peer chaincode list`
                const LIST_INSTANT_CC_CMD_PARAMS = `-C ${channelName} --instantiated --cafile $CAFILE --tls --tlsRootCertFiles $CAFILE --peerAddresses ${this.getOrgPeerAddress()} `

                const LIST_INSTANT_CC_CMD_W_PARAMS = `${LIST_INSTANT_CC_CMD} ${LIST_INSTANT_CC_CMD_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${LIST_INSTANT_CC_CMD_W_PARAMS}`);
                const resultStrings = await runCMD(LIST_INSTANT_CC_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result from listing the instantiated chaincodes: ${resultStrings}`)

                let resultStringsArray = resultStrings.split("\n");
                logger.debug(`${fcnName} Parsed list of instantiated chaincoces: ${JSON.stringify(resultStringsArray)}`);
                //Removing first string "Get instantiated chaincodes on peer:"
                resultStringsArray.splice(0, 1);
                logger.debug(`${fcnName} Removed first item from the list: ${JSON.stringify(resultStringsArray)}`);
                // Transforming list of strings into a JSON object similar to the one produced by SDK
                let ccObjectsArray = [];
                if (resultStringsArray.length > 0) {
                    await Utils.__arrayIterator(resultStringsArray, async (ccString) => {
                        const ccStringArray = ccString.split(",");
                        if (ccStringArray.length >= 4) {
                            logger.debug(`${fcnName} Parsed raw from the list of instantiated chaicnodes: ${JSON.stringify(ccStringArray)}`);
                            ccObjectsArray.push({
                                name: ccStringArray[0].split(':')[1].split(' ')[1],
                                version: ccStringArray[1].split(':')[1].split(' ')[1],
                                path: ccStringArray[2].split(':')[1].split(' ')[1],
                                id: ccStringArray[3].split(':')[1].split(' ')[1]
                            })
                        }
                    })
                }
                logger.debug(`${fcnName} Received response get instantiated chaincodes request: ${JSON.stringify(ccObjectsArray)}`);
                resolve(ccObjectsArray);
            } catch (err) {
                reject(`${fcnName}: Failed to instantiate chaincodes on channel ${channelName}: ${err}`);
            }
        })
    }

    getInstantiatedChaincodeVersionOnChannel(channelName, chaincodeId) {
        const fcnName = "[HFCCLI.getInstantiatedChaincodeVersionOnChannel]";
        const self = this;

        if (!channelName || !channelName instanceof String || !channelName.length) {
            throw new Error(`${fcnName} Please specify channelName, current value: ${JSON.stringify(channelName)}`)
        };
        if (!chaincodeId || !chaincodeId instanceof String || !chaincodeId.length) {
            throw new Error(`${fcnName} Please specify chaincodeId, current value: ${JSON.stringify(chaincodeId)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {
                const instantiatedChaincodesArray = await self.getInstantiatedChaincodesFromChannel(channelName);
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

    getChannelsJoinedByPeer(peerName) {
        const fcnName = "[HFCCLI.getChannelsJoinedByPeer]";
        const self = this;

        if (!peerName || !peerName instanceof String || !peerName.length) {
            throw new Error(`${fcnName} Please specify peerName, current value: ${JSON.stringify(peerName)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {
                // Sample CLI command:
                // peer channels list --cafile $CAFILE --tls
                //
                // Sample response:
                // 2020-01-15 08:31:39.161 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
                // Channels peers has joined:
                // mychannel
                // mychannel6
                //Get peer config
                const peerAddress = this.ConnectionProfileObject.getPeerAddress(peerName);

                if (!peerAddress) {
                    throw new Error(`${fcnName} Peer with name ${peerName} doesn't seem have address set in Connection Profile. Please refresh the cache if it was updated.`)
                }

                const PEER_ADDRESS_SETUP = `export CORE_PEER_ADDRESS=${peerAddress} && `
                const LIST_CHANNELS_CMD = `${PEER_ADDRESS_SETUP} ${this.getPeerCmdSetup()}peer channel list`
                //const LIST_CHANNELS_PARAMS = `--cafile $CAFILE --tls`
                const LIST_CHANNELS_CMD_W_PARAMS = `${LIST_CHANNELS_CMD}` // ${LIST_CHANNELS_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${LIST_CHANNELS_CMD_W_PARAMS}`);
                const resultStrings = await runCMD(LIST_CHANNELS_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result listing channels joined by ${peerName}: ${resultStrings}`)

                let resultStringsArray = resultStrings.split("\n");
                logger.debug(`${fcnName} Parsed list of channels joined: ${JSON.stringify(resultStringsArray)}`);
                // Removing first two strings "2020-01-15 08:31:39.161 UTC " and "Channels peers has joined:"
                resultStringsArray.splice(0, 2);

                // Removing last unmeaningful elment
                if (resultStringsArray[resultStringsArray.length - 1] === "") {
                    resultStringsArray.splice(-1, 1);
                }
                logger.debug(`${fcnName} Removed unnecessary items from the list: ${JSON.stringify(resultStringsArray)}`);

                logger.debug(`${fcnName} Received response from get channels joined request: ${JSON.stringify(resultStringsArray)}`);
                resolve(resultStringsArray);
                //logger.debug(`${fcnName} Received response get instantiated chaincodes request: ${JSON.stringify(resultStrings)}`);
                // resolve(resultStrings);
            } catch (err) {
                reject(`${fcnName}: Failed to list channels joined by peer ${peerName}: ${err}`);
            }
        })
    }

    getChaincodesInstalledOnPeer(peerName) {
        const fcnName = "[HFCCLI.getChaincodesInstalledOnPeer]";
        const self = this;

        if (!peerName || !peerName instanceof String || !peerName.length) {
            throw new Error(`${fcnName} Please specify peerName, current value: ${JSON.stringify(peerName)}`)
        };

        return new Promise(async (resolve, reject) => {
            try {
                // Sample CLI command:
                // peer chaincode list --installed --cafile $CAFILE --tls
                //
                // Sample response:
                // TBD
                // Get instantiated chaincodes on peer:
                // Name: ngo, Version: 1.0.6, Path: /tmp/ngo.zip, Id: bafbb62e46bd31074533491634c996d104e1dad2d22e0297b8826371ad5e32ea
                //Get new peer config
                const peerAddress = this.ConnectionProfileObject.getPeerAddress(peerName);

                if (!peerAddress) {
                    throw new Error(`${fcnName} Peer with name ${peerName} doesn't seem have address set in Connection Profile. Please refresh the cache if it was updated.`)
                }

                const PEER_ADDRESS_SETUP = `export CORE_PEER_ADDRESS=${peerAddress} && `
                const LIST_CHAINCODES_CMD = `${PEER_ADDRESS_SETUP} ${this.getPeerCmdSetup()}peer chaincode list`
                const LIST_CHAINCODES_PARAMS = `--installed --cafile $CAFILE --tls`
                const LIST_CHAINCODES_CMD_W_PARAMS = `${LIST_CHAINCODES_CMD} ${LIST_CHAINCODES_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${LIST_CHAINCODES_CMD_W_PARAMS}`);
                const resultStrings = await runCMD(LIST_CHAINCODES_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result from listing chaincodes installed on peer ${peerName}: ${resultStrings}`)

                let resultStringsArray = resultStrings.split("\n");
                logger.debug(`${fcnName} Parsed list of installed chaincodes: ${JSON.stringify(resultStringsArray)}`);
                //Removing first string "Get installed chaincodes on peer:"
                resultStringsArray.splice(0, 1);
                logger.debug(`${fcnName} Removed first item from the list: ${JSON.stringify(resultStringsArray)}`);
                //Transforming list of strings into a JSON object similar to the one produced by SDK
                let ccObjectsArray = [];
                if (resultStringsArray.length > 0) {
                    await Utils.__arrayIterator(resultStringsArray, async (ccString) => {
                        const ccStringArray = ccString.split(",");
                        if (ccStringArray.length >= 4) {
                            logger.debug(`${fcnName} Parsed raw from the list of installed chaicnodes: ${JSON.stringify(ccStringArray)}`);
                            ccObjectsArray.push({
                                name: ccStringArray[0].split(':')[1].split(' ')[1],
                                version: ccStringArray[1].split(':')[1].split(' ')[1],
                                path: ccStringArray[2].split(':')[1].split(' ')[1],
                                id: ccStringArray[3].split(':')[1].split(' ')[1]
                            })
                        }
                    })
                }
                logger.debug(`${fcnName} Received response get installed chaincodes request: ${JSON.stringify(ccObjectsArray)}`);
                resolve(ccObjectsArray);
                //logger.debug(`${fcnName} Received response get installed chaincodes request: ${JSON.stringify(resultStrings)}`);
                //resolve(resultStrings);
            } catch (err) {
                reject(`${fcnName}: Failed to list chaincodes for peer ${peerName}: ${err}`);
            }
        })
    }

    packageChaincode(outputPath, ccName, ccPath, ccVersion, ccType, ccInit) {
        const fcnName = "[HFCCLI.packageChaincode]";
        const self = this;

        if (!outputPath || !outputPath instanceof String || !outputPath.length) {
            throw new Error(`${fcnName} Please specify "outputPath" in the function request parameters`)
        };

        if (!ccName || !ccName instanceof String || !ccName.length) {
            throw new Error(`${fcnName} Please specify "ccName" in the function request parameters`)
        };

        if (!ccPath || !ccPath instanceof String || !ccPath.length) {
            throw new Error(`${fcnName} Please specify "ccPath" in the function request parameters`)
        };

        if (!ccVersion || !ccVersion instanceof String || !ccVersion.length) {
            throw new Error(`${fcnName} Please specify "ccVersion" in the function request parameters`)
        };

        let type = ccType ? ccType : 'golang';
        logger.debug(`${fcnName} Start packaging chaincode. name: ${ccName}, path: ${ccPath}, type: ${type}, version: ${ccVersion}, output: ${outputPath}`);

        //let constructorMsg = null;
        // if (ccInitFcn && ccInitArgs) {
        //     if (!ccInitFcn || !(ccInitFcn instanceof String || typeof ccInitFcn === 'string') || !ccInitFcn.length) {
        //         throw new Error(`${fcnName} Please make sure "ccInitFcn" is of type String`)
        //     };
        //     if (!ccInitArgs || !(ccInitArgs instanceof Array || typeof ccInitArgs === 'object') || !ccInitArgs.length) {
        //         throw new Error(`${fcnName} Please make sure "ccInitArgs" is of type Array`)
        //     };
        //     const ccInitArgsString = ccInitArgs.join('","');
        //     constructorMsg = `{"Args":["${ccInitFcn}", "${ccInitArgsString}"]}`;
        //     logger.debug(`${fcnName} Constructed the constructor message: ${constructorMsg}`);
        // }

        return new Promise(async (resolve, reject) => {
            try {

                // Sample command:
                // peer chaincode package -n mycc -l "node" -p github.com/hyperledger/fabric/examples/chaincode/go/chaincode_example02 -v 1.1 mycc.out

                const CC_PKG_CMD = `${this.getPeerCmdSetup()}peer chaincode package`
                const CC_PKG_CMD_PARAMS = `-n ${ccName} -l ${type} -p ${ccPath} -v ${ccVersion} ${ccInit ? `-c ${JSON.stringify(ccInit)}`: ``} ${outputPath}`

                const CC_PKG_CMD_W_PARAMS = `${CC_PKG_CMD} ${CC_PKG_CMD_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${CC_PKG_CMD_W_PARAMS}`);
                const resultPackage = await runCMD(CC_PKG_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result from packaging chaincode: ${resultPackage}`)

                // Removing all unnecessary files
                await emptyDir(CHANNELS_STORAGE);
                resolve(resultPackage);
            } catch (err) {
                // Removing all unnecessary files
                await emptyDir(CHANNELS_STORAGE);
                reject(`${fcnName}: Failed to create chaincode package: ${err}`)
                throw new Error(`${fcnName}: Failed to create chaincode package: ${err}`);
            }
        })
    }

    clearCryptoMaterial() {
        const fcnName = "[HFCCLI.clearCryptoMaterial]";
        const self = this;

        return new Promise(async (resolve, reject) => {
            try {
                await emptyDir(ADMIN_SIGNER_CERTS_PATH);
                await emptyDir(ADMIN_CERTS_PATH);
                await emptyDir(ADMIN_KEYSTORE_PATH);
                resolve(true)
            } catch (err) {
                throw `${fcnName} ${err}`
            }
        })
        //
    }

    invokeOrQueryChaincodeOnChannel(isInvoke, channelName, chaincodeId, fcn, args, transientMap) {
        const fcnName = "[HFCCLI.invokeOrQueryChaincodeOnChannel]";
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

        logger.debug(`${fcnName} Received parametes: ${JSON.stringify({
            isInvoke: isInvoke, 
            channelName: channelName, 
            chaincodeId: chaincodeId, 
            fcn: fcn, 
            args: args, 
            transientMap: transientMap
        })}`)

        return new Promise(async (resolve, reject) => {
            try {

                // Constructing initialization string in case fcn && args parameters are specified
                let fcnTriggerMsg = null;
                if (fcn && fcn !== "") {
                    if (!fcn || !(fcn instanceof String || typeof fcn === 'string') || !fcn.length) {
                        throw new Error(`${fcnName} Please make sure "fcn" is of type String`)
                    };
                    let argsString = "";
                    if (args && args.length) {
                        if (!(args instanceof Array || typeof args === 'object')) {
                            throw new Error(`${fcnName} Please make sure "args" is of type Array`)
                        }
                        argsString = args.join('","');
                    };
                    fcnTriggerMsg = `{"Args":["${fcn}" ${argsString ? `, "${JSON.stringify(argsString)}"` : ""}]}`;
                    logger.debug(`${fcnName} Generated initialization message: ${fcnTriggerMsg}`);
                }

                // Sample command:
                // peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME
                //  '{"Args":["invoke","a","b","10"]}' \
                // -cafile $CAFILE --tls

                // Sample command:
                // peer chaincode query -C mychannel \
                //-n mycc -c '{"Args":["query","a"]}'

                const INVOKE_CC_CMD = `${this.getPeerCmdSetup()}peer chaincode invoke`
                const QUERY_CC_CMD = `${this.getPeerCmdSetup()}peer chaincode query`
                const INV_QUERY_CC_PARAMS = `-o $ORDERER -C ${channelName} -n ${chaincodeId}\
                 ${fcnTriggerMsg ? ` -c '${fcnTriggerMsg}'` : ""} --cafile $CAFILE --tls --tlsRootCertFiles $CAFILE --peerAddresses ${this.getOrgPeerAddress()}`
                const INV_QUERY_CC_CMD_W_PARAMS = `${isInvoke ? INVOKE_CC_CMD : QUERY_CC_CMD} ${INV_QUERY_CC_PARAMS}`

                logger.debug(`${fcnName} Executing command: ${INV_QUERY_CC_CMD_W_PARAMS}`);
                const result = await runCMD(INV_QUERY_CC_CMD_W_PARAMS);
                logger.debug(`${fcnName} Result from invoke/query ${chaincodeId} on channel ${channelName}: ${result}`)

            } catch (err) {
                reject(`${fcnName}: Failed to instantiate or upgrade chaincode: ${err}`);
            }
        });

    }
}