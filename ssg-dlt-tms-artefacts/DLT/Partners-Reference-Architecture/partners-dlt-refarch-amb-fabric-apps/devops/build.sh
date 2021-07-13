#!/bin/bash
echo "Executing BUILD script for The Synchronizer with following environment: "

source ./devops/setConfigVariables.sh

cp -r ./devops/lib/ ./dependencies/nodejs/lib
cd dependencies/nodejs
npm install --production
cd ..

# cp -r lib amb-apps-sam/fcn-invoke-query-chaincode/
# cd amb-apps-sam/fcn-invoke-query-chaincode/
# npm install --production
# cd ../..

# cp -r lib amb-apps-sam/fcn-poll-inc-sqs/
# cd amb-apps-sam/fcn-poll-inc-sqs/
# npm install --production
# cd ../..
