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
using NLog;
using Newtonsoft.Json;
using System.IO;

namespace DL.Interface
{
    /// <summary>
    /// Gateway is the main entry point class for the DL Interface comprising of write/read methods
    /// </summary>
    public class Gateway
    {
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        //Object declaration for transaction handler
        private TransactionHandler transactionHandlerObj = new TransactionHandler();

        //Object declaration for schema validation
        private SchemaValidation schemaValidator = new SchemaValidation();

        //Crypto Manager Object
        private static CryptoManager cryptoManager = new CryptoManager();

        /// <summary>
        /// Implemenatation of writeGrantsDataDLT to push requests to the AWS SQS
        /// </summary>
        /// <param name="eventData"></param>
        /// <returns>void</returns>
        public void writeGrantsDataDLT(string eventData)
        {
            try
            {
                if (eventData != string.Empty)
                {
                    //validate input json schema
                    bool validationResult = schemaValidator.isWriteJsonValid(eventData);

                    logObj.Info("Validation Result for Write Input JSON : {0}", validationResult);

                    //calling sendRequest method in TransactionHandler when validation result is true
                    if (validationResult == true)
                    {
                        // input encryption and hashing
                        RequestData requestObj = cryptoManager.inputFormatter(eventData);
                        transactionHandlerObj.SendRequest(requestObj);
                    }
                    else
                    {

                        logObj.Error("Inside Gateway - writeGrantsDataDLT - Invalid Schema");
                        // throw exception when schema and input validation fails
                        throw new IOException("Invalid Schema");
                    }
                }
            }
            catch (Exception e)
            {
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside Gateway - writeGrantsDataDLT : {0}", e.Message);
                    logObj.Error("Inside Gateway - writeGrantsDataDLT : {0}", e.Message);

                throw;
            }
        }

        /// <summary>
        /// Implemenatation of readGrantsDataDLT to read requests from the DL using the Lambda method
        /// </summary>
        /// <param name="eventData"></param>
        /// <returns>string : Returns the request submitted to the DL in form of JSON String</returns>
        public string readGrantsDataDLT(string eventData)
        {
            try
            {
                string response ;
                if (eventData != string.Empty)
                {
                    // input validation for read look up keys
                    bool validationResult = schemaValidator.IsReadJsonValid(eventData);
                    logObj.Info("Validation Result for Read Input JSON: {0}", validationResult);

                    //calling sendRequest method in TransactionHandler
                    if (validationResult == true)
                    {
                        string input = cryptoManager.headerHashing(eventData);
                        RequestData requestObj = JsonConvert.DeserializeObject<RequestData>(input);

                        //calling getRequest method in TransactionHandler
                        response = transactionHandlerObj.GetRequest(requestObj);
                        return (cryptoManager.dataDecryption(response));
                    }
                    else
                    {
                        logObj.Error("Inside Gateway - writeGrantsDataDLT - Invalid Schema");
                        // throw exception when schema and input validation fails
                        throw new IOException("Invalid Schema");
                    }
                }
                else
                {
                    response = string.Empty;
                }
            }
            catch (Exception e)
            {
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside Gateway - readGrantsDataDLT : {0}", e.Message);
                     logObj.Error("Inside Gateway - readGrantsDataDLT : {0}", e.Message);
            }
            return string.Empty;
        }

    }
}


