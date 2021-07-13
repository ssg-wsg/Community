#!/bin/bash
echo "Executing BUILD script"

cp -r ./devops/lib/ ./dependencies/nodejs/lib
cd dependencies/nodejs
npm install --production
cd ..

# cp -r lib fcn-publish-chaincode/
# cd fcn-publish-chaincode
# npm install --production
# cd ..

# cp -r lib fcn-install-chaincode/
# cd fcn-install-chaincode
# npm install
# cd ..

# cp -r lib fcn-instantiate-chaincode/
# cd fcn-instantiate-chaincode
# npm install
# cd ..

# cp -r lib fcn-create-amb-node/
# cd fcn-create-amb-node
# npm install
# cd ..

# cp -r lib fcn-delete-amb-node/
# cd fcn-delete-amb-node
# npm install
# cd ..

# cp -r lib fcn-create-channel/
# cd fcn-create-channel
# npm install
# cd ..

# cp -r lib fcn-add-channel-member/
# cd fcn-add-channel-member
# npm install
# cd ..

# cp -r lib fcn-get-channel-config/
# cd fcn-get-channel-config
# npm install
# cd ..

# cp -r lib fcn-join-channels/
# cd fcn-join-channels
# npm install
# cd ..

# # cp -r lib fcn-peer-cli/
# # cd fcn-peer-cli
# # npm install
# # cd ..

# cp -r lib fcn-peer-recovery/
# cd fcn-peer-recovery
# npm install
# cd ..

# cp -r lib fcn-setup/
# cd fcn-setup
# npm install
# cd ..

# cp -r lib fcn-register-enroll-user/
# cd fcn-register-enroll-user
# npm install
# cd ..

# cp -r lib fcn-get-peer-info/
# cd fcn-get-peer-info
# npm install
# cd ..

# cp -r lib fcn-peer-status-check/
# cd fcn-peer-status-check
# npm install
# cd ..

# cp -r lib fcn-share-certs/
# cd fcn-share-certs
# npm install
# cd ..

# cp -r lib fcn-share-channel/
# cd fcn-share-channel
# npm install
# cd ..