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
using Amazon.SQS.Model;
using Newtonsoft.Json;
using NLog;

namespace DL.Interface
{
    /// <summary>
    /// SQS Client Connector is a client to interface with the AWS SQS Queue in order to push input requests to the DL
    /// </summary>
    public class SQSClientConnector
    {

        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        // AWS SQS queue Url
        private static string awsSqsUrl;

        // AWSInfraClient object
        private static AWSInfraClient aWSInfraClient = new AWSInfraClient();

        //static constructor to initialize the SQS queue properties
        static SQSClientConnector()
        {
            awsSqsUrl = ExternalConfigurationParser.GetSQSQueueUrl();
        }


       /// <summary>
       /// Method to send messages to the AWS SQS Queue using the  AWS SQS Client 
       /// </summary>
       /// <param name="sqsMessage"></param>
       /// <returns></returns>
        public Boolean SendRequest(string sqsMessage)
        { 
            Boolean response = false;
            try
            {
                if (sqsMessage != string.Empty)
                {
                    
                    //Get AmazonSQS Client
                    var sqsClient = aWSInfraClient.GetAmazonSQSClient();

                        //Create the request to send
                        var sendRequest = new SendMessageRequest
                        {
                            QueueUrl = awsSqsUrl,
                            MessageBody = sqsMessage
                        };

                        //Send the message to the queue
                        var sendMessageResponse = sqsClient.SendMessageAsync(sendRequest);
                        SendMessageResponse sendObj = new SendMessageResponse();
                        string dltRequest = JsonConvert.SerializeObject(sendMessageResponse);
                        Console.WriteLine(dltRequest);
                        if (sendMessageResponse.Result.HttpStatusCode.ToString().Equals("OK"))
                        {
                            logObj.Info("Payload pushed to AWS SQS.");
                            response = true;
                        }
                }            
            }
            catch (Exception e)
            {
                //Logging the error in to a logger file`
                logObj.Error(e.StackTrace, "Inside SQSClientConnector - SendRequest()");
            }
            return response;
        }

    }
}
