#!/bin/bash

CURRENT_DIR=$(pwd)
cd ../dependencies/nodejs
npm install
cd $CURRENT_DIR
sam build --use-container -t fcn.yaml
sam local invoke -e tests/event.json