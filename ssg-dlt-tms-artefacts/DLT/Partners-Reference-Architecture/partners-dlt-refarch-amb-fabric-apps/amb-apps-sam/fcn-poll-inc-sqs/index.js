/*
# Copyright 2020 EY or its affiliates. All Rights Reserved.
# 
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
*/
const logger = require("/opt/nodejs/lib/logging").getLogger("fcn-poll-inc-sqs");

("use strict");

var AWS = require("aws-sdk");
var cw = new AWS.CloudWatch();

var WORKER_LAMBDA_NAME = process.env.WORKER_LAMBDA_NAME;
var AWS_REGION_NAME = process.env.AWS_REGION_NAME;
var NAMESPACE = process.env.NAMESPACE;
var METRIC_NAME = process.env.METRIC_NAME;
var INC_DLQ_URL=process.env.INC_DLQ_URL;

var lambda = new AWS.Lambda({
  region: AWS_REGION_NAME
});
var sqs = new AWS.SQS({region: AWS_REGION_NAME});
var fcnName = "fcn-poll-inc-sqs";

// Function to invoke the Invoke/Query
function invokeLambda(lambdaName, task) {
  logger.debug("Lambda Name: " + lambdaName);
  logger.debug("Payload: " + JSON.stringify(task));

  const params = {
    FunctionName: lambdaName,
    InvocationType: "RequestResponse",
    LogType: "Tail",
    Payload: typeof task === "string" ? task : JSON.stringify(task)
  };

  return new Promise(async (resolve, reject) => {
    try {
      const data = await lambda.invoke(params).promise();
      if (data.StatusCode != 200) {
        const errorMessage = data.FunctionError ? data.FunctionError : data.Payload;
        throw errorMessage;
      }
      logger.debug(`Finished lambda execution, received following data: ${JSON.stringify(data)}`);

      const payload = JSON.parse(data.Payload);

      const logResult = (Buffer.from(data.LogResult, 'base64')).toString('utf8');

      logger.debug(`${fcnName} Logs from invoked lambda with name ${lambdaName}: ${logResult}`);

      if (payload && payload.errorMessage) {
        // Check for retry condition in invokeQueryResult
        if (payload.errorMessage.includes("REQUEST_TIMEOUT") ||
        payload.errorMessage.includes("SERVICE_UNAVAILABLE") ||
        payload.errorMessage.includes("Cannot read property") ||
        payload.errorMessage.includes("DNS resolution failed") ||
        payload.errorMessage.includes("Failed to get user context") ||
        payload.errorMessage.includes("Failed to find start line or end line of the certificate")) {
          payload.retry = true;
        }
        else {
          payload.retry = false;
        }
        logger.error("Error message from invoked lambda: " + JSON.stringify(payload));
        //logger.error("Invoke-query error: "+ JSON.stringify(output));
        throw payload;
        //throw `${fcnName} Received error message from function: ${JSON.stringify(payload.errorMessage)}`;
      }
      resolve(payload);

    } catch (err) {
      logger.error(`Failed to invoke lambda : ${lambdaName} with error : ${JSON.stringify(err)}`);
      if (err.errorMessage && 
      (err.errorMessage.includes("ChannelEventHub has been shutdown") || 
      err.errorMessage.includes("Cannot read property") ||
      err.errorMessage.includes("timeout") ||
      err.errorMessage.includes("DNS resolution failed"))) 
      {
        err.retry = true;
      }
      reject(err);
    }
  })
}

// invoke the Invoke/Query lambda
exports.handler = function (event, context) {
  return new Promise(async (resolve, reject) => {
      context.callbackWaitsForEmptyEventLoop = false;
      //event.Records.forEach((record) => {
      for (let i = 0; i < event.Records.length; i++) {
        let record = event.Records[i];
        logger.debug("Incoming record: " + record.body);

        try {

          // Call to Invoke/Query Chaincode Lambda
          await invokeLambda(WORKER_LAMBDA_NAME, record.body)
            .then(async(data) => {
              logger.debug('invoke-poll-sqs return data: ' + data);
              
              await sendCWAlertErrorNotification(context.functionName, "InvalidRecord", 0);
              await sendCWAlertErrorNotification(context.functionName, "RecordRetry", 0);
                resolve(data);
          })

        } catch (err) {
          logger.error(`${fcnName}: ${err}`);
          logger.debug(`${err.stack}`);
          
          // Possible errors caught:
          // 1) JSON parse issues
          // 2) Invoke/Query chaincode failures

          err = typeof err == "string" ? { message: err, retry: false } : err;
          if (err.message && err.message.includes("Rate Exceeded")) {
            err.retry = true;
          }
          logger.error("Retry flag: " + JSON.stringify(err.retry));
          if (err.retry == true) {
            await sendCWAlertErrorNotification(context.functionName, "RecordRetry", 1);

            // Causes lambda to fail and return message to queue
            context.fail('Blockchain call failed');
          } else {
            let message = record.body + `,{"error": ${err.message},"errorMessage":${err.errorMessage}}`;
            await sendCWAlertErrorNotification(context.functionName,"InvalidRecord",1,message);          
          }
        }
      }
  });
};



async function sendCWAlertErrorNotification(lambdaName, metricType, inpValue, message) {
  // Push data to Alarm
  try {
    const cwParams = {
      Namespace: NAMESPACE,
      MetricData: [
        {
          MetricName: METRIC_NAME,
          Dimensions: [
            {
              Name: "Lambda",
              Value: lambdaName
            },
            {
              Name: "ErrorCase",
              Value: metricType
            }
          ],
          //StorageResolution: "60",
          //Unit: "Count",
          Timestamp: new Date(),
          Value: inpValue
        }
      ]
    };
    var cwMetric = await cw.putMetricData(cwParams).promise();
    logger.debug("putMetricData response : " + JSON.stringify(cwMetric));
  } catch (err) {
    logger.error("Failed to put data to alarm, error: " + err.message);
  }
  try{
    if (metricType == "InvalidRecord" && inpValue == 1 && message) {
      message = typeof message == "string" ? message : JSON.stringify(message);
      var sendMessageParams = {
        MessageBody: message,
        QueueUrl: INC_DLQ_URL
      };
      await sendMessageToSQS(sendMessageParams);
    }
  } catch(err){
    logger.error("Failed to send message to DLQ , error: " + err.message);
  }
}

function sendMessageToSQS(data) {
  return new Promise((resolve, reject) => {
    try {
      sqs.sendMessage(data, function(err, result) {
        if (err) {
          logger.error("Failed to send message to DLQ , error: " + err.message);
          reject(err);
        } else {
          resolve(result);
        }
      });
    } catch (err) {
      logger.error("Failed to send message to DLQ , error: " + err.message);
      reject(err);
    }
  });
}