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

const logger = require("/opt/nodejs/lib/logging").getLogger("share-certs");
const fs = require('fs');
const S3Client = require("/opt/nodejs/lib/s3-client.js");
const ParameterStoreKVS = require("/opt/nodejs/lib/parameterstore-kvs");
const SecretsManagerKVS = require("/opt/nodejs/lib/secretsmanager-kvs");
const ConnectionProfile = require("/opt/nodejs/lib/connection-profile");
const HFCClient = require("/opt/nodejs/lib/hfc-cli-client.js");
const ADMIN_CREDS_KEY = "adminCreds";
const Config = require("./config");

exports.handler = async (event, context) => {

    const fcnName = "[share-certs]";
    return new Promise(async (resolve, reject) => {
        try {
            logger.debug(`event: ${JSON.stringify(event)}`);
            logger.debug(`context: ${JSON.stringify(context)}`);

            const config = await new Config(event);

            logger.debug(`Config Object: ${JSON.stringify(config)}`);
            // Initializing Connection Profile
            const connectionProfilePMS = await new ParameterStoreKVS({
                prefix: `/amb/${config.networkId}/${config.memberId}`
            });

            const cp = await new ConnectionProfile(connectionProfilePMS);

            // Getting admin user name from ADMIN_CREDS_KEY path in SecretsManager
            const secretsManagerOptions = {
                prefix: `/amb/${config.networkId}/${config.memberId}/users`
            };

            const sm = await new SecretsManagerKVS(secretsManagerOptions);

            const bcAdminCreds = await sm.getValue(ADMIN_CREDS_KEY);

            if (!bcAdminCreds) {
                throw new Error(`${fcnName} Please put admin credentials to the System's Manager Parameter Store under key ${ADMIN_CREDS_KEY} in a format: {name:<ADMIN_USER_NAME>, password: <PASSWORD>}`);
            }

            const adminName = bcAdminCreds.name;

            // Loading UserObject which contains the admin certificate
            const adminCertsPMS = await new ParameterStoreKVS({
                prefix: `/amb/${config.networkId}/${config.memberId}/users`
            });

            const userObjectStr = await adminCertsPMS.getValue(adminName);
            if (!userObjectStr) {
                throw new Error(`${fcnName} It can not find userobject in the parameter store`);
            }

            const userObject = JSON.parse(userObjectStr);
            if (!userObject.hasOwnProperty('enrollment')) {
                throw new Error(`${fcnName} Invalid userObject: ${userObjectStr}`);
            }
            const adminCert = userObject.enrollment.identity.certificate;

            const connectionProfileUpdate = config.connectionProfileUpdate;
            const channelProfile = connectionProfileUpdate.channelProfile;
            const endorsingPeerProfiles = connectionProfileUpdate.endorsingPeerProfiles ? connectionProfileUpdate.endorsingPeerProfiles : null;
            const organizationProfile = connectionProfileUpdate.organizationProfile ? connectionProfileUpdate.organizationProfile : null;

            if (channelProfile) {
                await cp.setChannelProfile(channelProfile);
            } else {
                logger.debug(`${fcnName} Could not info find a channelProfile`);
                // This is fatal, so have to stop execution
                throw new Error(`${fcnName} Please specify connectionProfileUpdate.channelProfile. Current value: ${JSON.stringify(connectionProfileUpdate)}`)
            }

            if (endorsingPeerProfiles) {
                if (Array.isArray(endorsingPeerProfiles) && endorsingPeerProfiles.length) {
                    for (let index = 0; index < endorsingPeerProfiles.length; index++) {
                        var peer = endorsingPeerProfiles[index];
                        logger.debug(`${fcnName} Adding peer: ${JSON.stringify(peer)}`);
                        await cp.setPeerProfile(peer);
                        await cp.setPeerToChannel(channelProfile.name, peer.name)
                    };
                }
            } else {
                logger.debug(`${fcnName} Could not find any endorsingPeerProfiles`);
            }

            if (organizationProfile) {
                await cp.setOrganizationProfile(organizationProfile);
            } else {
                logger.debug(`${fcnName} Could not find an organizationProfile`);
            }

            // Uploading the adminCert to channel S3 bucket
            const channelName = channelProfile.name;
            const bucketName = cp.getChannelS3BucketName(channelName);

            const objectKeyAdminCert = `channels/${channelName}/members/${config.memberId}/admincerts/cert.pem`;

            logger.debug(`${fcnName} Trying to upload adminCerts to ${bucketName} with objectkey: ${objectKeyAdminCert}`);

            const s3Client = new S3Client();
            await s3Client.uploadDataWithoutSSE(bucketName, objectKeyAdminCert, adminCert);

            // // ------ Get cacert and upload to S3 bucket
            logger.debug(`${fcnName} Setting HFCClient to get CAcert`);

            hfcClient = await new HFCClient(cp);

            await hfcClient.getCAcert();

            const objectKeyCaCert = `channels/${channelName}/members/${config.memberId}/cacerts/cert.pem`;

            const cacertFolderpath = '/tmp/admin-msp/cacerts';

            logger.debug(`${fcnName} Trying to upload cacerts to ${bucketName} with objectkey: ${objectKeyCaCert}`);

            var cacertFilepath = null;

            fs.readdirSync(cacertFolderpath)
                .filter(file => (file.slice(-4) === '.pem'))
                .forEach(file => {
                    if (!cacertFilepath) {
                        cacertFilepath = `${cacertFolderpath}/${file}`;
                    } else {
                        reject(`${fcnName}: There should not be multiple .pem files in the folder: ${cacertFolderpath}`);
                        throw new Error(`${fcnName} There should not be multiple .pem files in the folder: ${cacertFolderpath}`);
                    }
                });

            if (cacertFilepath) {
                await s3Client.uploadFileWithoutSSE(bucketName, objectKeyCaCert, cacertFilepath);
            } else {
                logger.error(`${fcnName} No cacert found in ${cacertFolderpath}`);
            }

            //Don't forget to clear cryptomaterial from local file system if we are using CLI
            if (hfcClient.clearCryptoMaterial) {
                await hfcClient.clearCryptoMaterial()
            }

            //Updating the connection profile
            logger.debug(`${fcnName} Trying to update connection profile with endorsing peers and channelProfile`);
            await cp.pushConnectionProfile();

            // Retrieving Connection Profile for org and peers
            const currentOrganizationProfile = await cp.getCurrentOrganizationProfile();
            const currentPeersProfiles = []
            cp.getPeersNamesArrayByCurrentOrganization().forEach((peerName) => {
                currentPeersProfiles.push(cp.getPeerProfile(peerName));
            })

            const result = {
                newMemberAccountId: config.awsAccountId,
                newMemberId: config.memberId,
                connectionProfileUpdate: {
                    channelProfile: cp.getChannelProfile(channelName),
                    organizationProfile: currentOrganizationProfile,
                    endorsingPeerProfiles: currentPeersProfiles
                }

            }

            logger.debug(`Finishing lambda execution`);
            resolve(JSON.stringify(result));
        } catch (err) {
            logger.error(`${fcnName}: ${err}`);
            logger.debug(`${err.stack}`);
            const output = {
                error: `${fcnName}: ${err}`
            }
            reject(JSON.stringify("ERROR"));
        }
    })
};