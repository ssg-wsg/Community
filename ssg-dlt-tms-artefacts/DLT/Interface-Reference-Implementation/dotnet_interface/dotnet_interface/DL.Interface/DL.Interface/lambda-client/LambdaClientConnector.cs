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
using System.IO;
using Amazon.Lambda.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NLog;

namespace DL.Interface
{
    /// <summary>
    /// Lambda Client Connector is client to interface with the Lambda function to read from DL
    /// </summary>
    public class LambdaClientConnector
    {
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        // AWS Lambda function name
        private static string awsLambdaFunctionaName;

        //static constructor to initialize the Lambda client properties
        static LambdaClientConnector()
        {
            awsLambdaFunctionaName = ExternalConfigurationParser.GetLambdaChaincodeFunction();
        }

        /// <summary>
        /// Method to retreive the query response from the DL on the basis of the input provided
        /// </summary>
        /// <param name="fabricData"></param>
        /// <returns>string</returns>
        public string GetRequest(string fabricData)
        {
            string response = string.Empty;
            AWSInfraClient aWSInfraClient = new AWSInfraClient();
            try
            {
                if (fabricData != string.Empty)
                { 
                    InvokeRequest invokeRequest = new InvokeRequest
                    {
                        FunctionName = awsLambdaFunctionaName,
                        Payload = fabricData
                    };

                    //Get Amazon Lambda Client
                    var awsLambdaClient = aWSInfraClient.GetAmazonLambdaClient();

                    //method call to invoke lambda in order to query for the response
                    InvokeResponse invokeResponse = awsLambdaClient.Invoke(invokeRequest);

                    //SErialize response object and parse the result from the DLT
                    response = SerializeResponseObject(invokeResponse.Payload);
                    logObj.Info("Payload received from Lambda : {0}",response);
                    
                }
            }
            catch (Exception e)
            {
                //Logging the error in to a logger file
                logObj.Error(e.StackTrace, "Inside LambdaClientConnector - QueryRequest() :");  
            }
            return response;
        }
 

        /// <summary>
        /// Method to serialize the response received from the Lambda Invoke
        /// </summary>
        /// <param name="invokeRequest"></param>
        /// <returns></returns>
        public string SerializeResponseObject(Stream invokeRequest)
        {
            string response = null;
            try
            {
                var streamReader = new StreamReader(invokeRequest);
                JsonReader invResponseJsonReader = new JsonTextReader(streamReader);
                var jsonSerializer = new JsonSerializer();
                var jsonResponse = jsonSerializer.Deserialize(invResponseJsonReader);
                var jObjectResponse = JObject.Parse(jsonResponse.ToString().Replace("\"", "\'"));
                if (jObjectResponse.ContainsKey("result"))
                    response = JsonConvert.SerializeObject(jObjectResponse["result"]);
                else
                    response = JsonConvert.SerializeObject(jObjectResponse);
            }
            catch (Exception e)
            {
                //Logging the error in to a logger file
                logObj.Error(e.StackTrace, "Inside LambdaClientConnector - SerializeResponseObject() :");
               
            }
            return response;

        }

    }
}
