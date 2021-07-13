/*
* Copyright 2020 EY or its affiliates. All Rights Reserved.
* 
* Licensed under the Apache License, Version 2.0 (the "License").
* You may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
*     http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

using System;
using Newtonsoft.Json;
using NLog;

namespace DL.Interface
{

    /// <summary>
    /// Transaction Handler class generates the required input format accepted by  
    /// 1. AWS SQS queue to push the transaction to the DL
    /// 2. Lambda function to retreive the transaction from the DL
    /// </summary>
    public class TransactionHandler
    {
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        // AWSInfraClient object
        private static AWSInfraClient aWSInfraClient = new AWSInfraClient();

        // DLTConfigModel object
        private static DLTConfigModel dltProperties = new DLTConfigModel();

        //static constructor to initialize the DLT properties
        static TransactionHandler()
        {
            dltProperties = ExternalConfigurationParser.GetDltProperties();
        }



        //DLT Payload Object
        private DLTPayload payload = new DLTPayload();

        /// <summary>
        /// Method to generate proper request format and push to queue
        /// </summary>
        /// <param name="data"></param>
        /// <returns>bool</returns>
        public Boolean SendRequest(RequestData requestObj)
        {
            //SQS Connector object
            SQSClientConnector sqsConnector = new SQSClientConnector();

            try
            {
                if (requestObj != null)
                {
                    payload = generateDltPayload(Constants.TRIGGERTYPE.INVOKE.ToString(), Constants.FUNCTIONS.createDLTEvent.ToString(), requestObj);
                    string dltRequest = JsonConvert.SerializeObject(payload);
                    return (sqsConnector.SendRequest(dltRequest));
                }
                else
                {
                    return false;
                }
            }
            catch (Exception e)
            {

                logObj.Error(e.Message, "Inside TransactionHandler - SendRequest() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside TransactionHandler - SendRequest() : {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method to generate proper request format and query lambda function to get the response from DL
        /// </summary>
        /// <param name="data"></param>
        /// <returns>string</returns>
        public string GetRequest(RequestData requestObj)
        {
            // Lambda Connector Object
            LambdaClientConnector lambdaConnector = new LambdaClientConnector();
            try
            {
                if (requestObj != null)
                {
                    payload = generateDltPayload(Constants.TRIGGERTYPE.QUERY.ToString(), Constants.FUNCTIONS.readDataWithPartialKeyAndPagination.ToString(), requestObj);
                    string dltRequest = JsonConvert.SerializeObject(payload);
                    string result = lambdaConnector.GetRequest(dltRequest);
                    return (result);
                }
                else
                {
                    return string.Empty;
                }
            }
            catch (Exception e)
            {

                logObj.Error(e.StackTrace, "Inside TransactionHandler - GetRequest() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside TransactionHandler - GetRequest() : {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method to generate DLTPayload format which is accepted by SQS and Lambda
        /// </summary>
        /// <param name="triggerType"></param>
        /// <param name="functionName"></param>
        /// <param name="requestObject"></param>
        /// <returns>DLTPayload</returns>
        public DLTPayload generateDltPayload(string triggerType, string functionName, RequestData requestObject)
        {
            DLTPayload payload = null;

            if (triggerType != string.Empty && functionName != string.Empty && requestObject != null)
            {
                RequestData[] requestArray = { requestObject };
                payload = new DLTPayload();
                payload.networkId = dltProperties.NetworkId;
                payload.memberId = dltProperties.MemberId;
                payload.userEnrollmentId = dltProperties.EnrolmentId;
                payload.channelName = Constants.FABRIC_CHANNELNAME;
                payload.chaincodeName = Constants.FABRIC_CHAINCODE_NAME;
                payload.triggerType = triggerType;
                payload.functionName = functionName;
                payload.args = requestArray;
            }

            return payload;
        }



    }
}
