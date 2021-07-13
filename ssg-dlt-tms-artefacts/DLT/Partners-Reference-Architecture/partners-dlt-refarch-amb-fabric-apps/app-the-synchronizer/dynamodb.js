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

// Load the SDK for JavaScript
var AWS = require('aws-sdk');
const logger = require("./lib/logging").getLogger("dynamo-driver");

const LATEST_BLOCK_NUMBER_ID = "latestBlockNumber";

const _parseMultiItemResponse = (data, ddbCoverter) => {
  const fcnName = "[DynamoDB _parseMultiItemResponse]";

  try {
    let tmpData = {
      items: [],
      count: data.Count,
      scannedCount: data.ScannedCount,
    }

    if (data.Items.length > 0) {
      data.Items.forEach((item, index) => {
        tmpData.items[index] = ddbCoverter.unmarshall(item);
      })
    }

    if (data.LastEvaluatedKey) {
      tmpData.lastEvaluatedKey = data.LastEvaluatedKey._id.S
    }

    return tmpData;
  } catch (err) {
    throw new Error(`${fcnName} ${err}`);
  }
};

/**
 * Helps to construct DynamoDB client.
 * @class
 * @classdesc
 * @prop {string} config.tableName - Name of the table.
 * @prop {Object} ddb - Instance of the DynamoDB client.
 */

module.exports = class DynamoDB {
  /**
   * Constructor for DynamoDB class.
   * @constructor
   * @prop {Object} config - DynamoDB configuration object.
   * @prop {string} config.region - Region where DynamoDB table resides.
   * @prop {string} config.tableName - Name of the table.
   * @prop {string} config.profile - Name of the profile to be used to populate credentials.
   */
  constructor(config) {
    const fcnName = "[DynamoDB.constructor]";
    if (!config) {
      throw new Error(`${fcnName} Please supply "config" parameter to constructor.`);
    }
    if (typeof tableName === "string") {
      throw new Error(`${fcnName} Please supply "tableName" in the "dynamodb" config object.`);
    }

    if (typeof paginationIndex === "string") {
      throw new Error(`${fcnName} Please supply "paginationIndex" in the "dynamodb" config object.`);
    }

    AWS.config.update({
      region: config.region
    });
    if (process.env.AWS_SDK_LOAD_CONFIG) {
      let credentials = new AWS.SharedIniFileCredentials({
        profile: config.profile
      });
      AWS.config.credentials = credentials;
      // logger.debug(`${fcnName} Loaded credentials from file: ${JSON.stringify(credentials)}`)
    }

    AWS.config.logger = logger;

    this.config = {};
    this.config.tableName = config.tableName;
    this.config.paginationIndex = config.paginationIndex;
    // Create the DynamoDB service object
    this.ddb = new AWS.DynamoDB({
      apiVersion: '2012-08-10'
    });
  }

  /**
   * Submits item to DynamoDB. Adds "_id" attribute to make partition key more unique (ideally should be randomised, but also in sync with Blockchain)
   * @method
   * @param {Object} item - Object containing the item to be put to DynamoDB
   * @param {boolean} noPk - Instructs method to skip generation of Partition Key (_id attribute).
   */
  putItem(item, noPk) {
    const fcnName = "[DynamoDB.putItem]";
    const self = this;

    const ddb = self.ddb;

    return new Promise((resolve, reject) => {

      if (noPk !== false) {
        item._id = item.docType + item.id;
      }

      let itemTmp = AWS.DynamoDB.Converter.marshall(item);
      let params = {
        TableName: self.config.tableName,
        Item: itemTmp
      };

      // Call DynamoDB to add the item to the table
      ddb.putItem(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          logger.debug(`${fcnName}: Success for item _id: ${item._id}`);
          resolve(true);
        }
      });
    });

  }

  /**
   * Retrieves items by Partition Key (_id attribute)
   * @method
   * @param {string} itemId - The ID of a Partition Key (_id attribute) to be used to retrieve item from DynamoDB
   * @returns {Object}  
   */
  async getItemById(itemId) {
    const fcnName = "[DynamoDB.getItemById]";
    const self = this;

    const ddb = self.ddb;
    const tableName = self.config.tableName;

    if (!itemId) {
      throw new Error(`${fcnName} Please specify trouthy value for itemId`);
    }
    return new Promise((resolve, reject) => {

      const params = {
        Key: {
          "_id": {
            S: itemId
          }
        },
        TableName: tableName
      };

      ddb.getItem(params, async (err, data) => {
        if (err) {
          reject(err); // an error occurred
        } else {
          logger.debug(`${fcnName} ${JSON.stringify(data)}`);
          let unmarshalledData = await AWS.DynamoDB.Converter.unmarshall(data.Item);
          logger.debug(`${fcnName} ${JSON.stringify(unmarshalledData)}`);
          // successful response
          if (unmarshalledData) {
            resolve(unmarshalledData);
          } else {
            reject(`${fcnName} ${err}`);
          }
        }
      });
    })
  }

  /**
   * Retrieves items of docType starting from the beginning or from startKey and request in pages of size pageSize. Also my start scaning from backwards if scanForward=false 
   * @method
   * @param {string} docType - Type of the items to be retrieved from DynamoDB (should contain string attribute "docType")
   * @param {string} startKey - (optional) The _id of the item to start/continue pagination from. Default: start from the first item.
   * @param {number} pageSize - (optional) Number of items to return in the query. Default: 10.
   * @param {boolean} scanForward - (optional) Specifying if we should start querying from the start (true) or in reverse (false). Default: true.
   * @returns {Object} - {items:[{Object}],count:{number},scannedCount:{number},lastEvaluatedKey:{string}}.
   */
  async getItemsWithPagination(docType, startKey, pageSize, scanForward) {
    const fcnName = "[DynamoDB.getItemsWithPagination]";
    const self = this;

    const ddb = self.ddb;
    const tableName = self.config.tableName;
    const paginationIndex = self.config.paginationIndex;

    let tmpDocType;
    const tmpStartKey = startKey;
    let tmpPageSize;
    let scanIndexForward = true;

    if (typeof scanForward === "boolean") {
      scanIndexForward = scanForward ? scanForward : false;
    }

    try {
      if (typeof docType === "string") {
        tmpDocType = docType;
      } else {
        throw new Error(`${fcnName} Please make sure you  specify docType parameter. Current value: ${docType}`);
      }

      if (typeof pageSize === "number") {
        tmpPageSize = pageSize;
      } else {
        tmpPageSize = 10;
      }

      let params = {
        IndexName: paginationIndex,
        ExpressionAttributeValues: {
          ":docType": {
            "S": tmpDocType
          }
        },
        ExpressionAttributeNames: {
          "#docType": "docType"
        },
        Limit: tmpPageSize,
        KeyConditionExpression: `#docType = :docType`,
        ScanIndexForward: scanIndexForward,
        TableName: tableName
      };

      if (typeof tmpStartKey === "string") {
        params.ExclusiveStartKey = {
          "docType": {
            "S": tmpDocType
          },
          "_id": {
            "S": tmpStartKey
          }
        }
      }

      logger.debug(`${fcnName} Quering table with following params: ${JSON.stringify(params)}`);
      let data = await ddb.query(params).promise();

      logger.debug(`${fcnName} Raw data from DynamoDB: ${JSON.stringify(data)}`);

      let tmpData = _parseMultiItemResponse(data, AWS.DynamoDB.Converter);

      return tmpData;

    } catch (err) {
      throw new Error(`${fcnName} ${err}`);
    }
  }

  // deleteItem (not implemented)
  deleteItemById(itemId) {
    const fcnName = "[DynamoDB.deleteItemById]";
    throw new Error(`${fcnName} Is not implemented.`);
  }

  /**
   * Updates the latest syncronised block number to DynamoDB
   * @method
   * @param {Number} blockNumber - Number of the latest block
   */
  async putLatestBlockNumber(blockNumber) {
    const fcnName = "[DynamoDB.putLatestBlockNumber]";
    const self = this;

    try {
      if (typeof blockNumber === "number") {
        const blockObject = {
          "_id": LATEST_BLOCK_NUMBER_ID,
          "number": blockNumber
        }

        await self.putItem(blockObject, false);

      } else {
        throw new Error(`${fcnName} blockNumber has to be of type number `);
      }
    } catch (err) {
      throw new Error(`${fcnName} ${err}`);
    }
  }

  /**
   * Gets the latest syncronised block number from DynamoDB
   * @method
   * @param {Number} blockNumber - Number of the latest block
   */
  async getLatestBlockNumber() {
    const fcnName = "[DynamoDB.getLatestBlockNumber]";
    const self = this;

    return new Promise(async (resolve, reject) => {
      const latestBlockNumberObject = await self.getItemById(LATEST_BLOCK_NUMBER_ID);
      logger.debug(`${fcnName} Received latest block number: ${JSON.stringify(latestBlockNumberObject.number)}`);
      resolve(latestBlockNumberObject.number);
    })
  }

}