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

using Newtonsoft.Json.Linq;
using System;
using NLog;
using Newtonsoft.Json;
using System.IO;

namespace DL.Interface
{
    public class CryptoManager
    {
        //Security Utility Object
        private static SecurityUtil securityUtilObj = new SecurityUtil();

        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        //create hashing util object
        private static HashingUtil hashingUtilObj = new HashingUtil();

        //create KeyManagement Object
        private static KeyManagement keyManagementObj = new KeyManagement();

        //create Crypto Object
        private static CryptoUtil cryptoUtilObj = new CryptoUtil();

        /// <summary>
        /// Method for hashing and encryption
        /// </summary>
        /// <param name="inputJsonString"></param>
        /// <returns></returns>
        public RequestData inputFormatter(string inputJsonString)
        {
            try
            {
                if (inputJsonString != string.Empty)
                {
                    string hashedInput = headerHashing(inputJsonString);
                    string encryptedData = dataEncryption(hashedInput);
                    RequestData requestObj = JsonConvert.DeserializeObject<RequestData>(encryptedData);
                    return (requestObj);
                }
                else
                {
                    logObj.Error("Inside TransactionHandler - inputFormatter - Invalid input data");
                    // throw exception when schema and input validation fails
                    throw new IOException("Invalid input data");
                }
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside TransactionHandler - keyEncryption() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside TransactionHandler - keyEncryption() : {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method for hashing primary key 1 and primary key2
        /// </summary>
        /// <param name="inputJsonString"></param>
        /// <returns></returns>
        public string headerHashing(string inputJsonString)
        {
            try
            {
                if (inputJsonString != string.Empty)
                {
                    var inputJsonObject = JObject.Parse(inputJsonString);
                    var header = (JObject)inputJsonObject["header"];

                    if (header["primaryKey"] != null)
                    {
                        header["primaryKey"] = hashingUtilObj.computeSHA3384Hash(header["primaryKey"].ToString());
                    }
                    
                    return inputJsonObject.ToString();
                }
                else
                {
                    logObj.Error("Inside TransactionHandler - headerHashing - Invalid input data");
                    // throw exception when schema and input validation fails
                    throw new IOException("Invalid input data");
                }
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside TransactionHandler - keyEncryption() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside TransactionHandler - keyEncryption() : {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method for encrypting the payload
        /// </summary>
        /// <param name="inputJsonString"></param>
        /// <returns></returns>
        public string dataEncryption(string inputJsonString)
        {
            try
            {
                if (inputJsonString != string.Empty)
                {
                    var inputJsonObject = JObject.Parse(inputJsonString);
                    var header = (JObject)inputJsonObject["header"];
                    var payload = (JObject)inputJsonObject["payload"];
                    KeyConfigModel keyConfigObj = new KeyConfigModel();
                    keyConfigObj = keyManagementObj.getEncryptKey(header["trainingPartnerUen"].ToString(),header["trainingPartnerCode"].ToString());
                    string encryptedData = cryptoUtilObj.EncryptString(keyConfigObj, payload.ToString());
                    payload.RemoveAll();
                    payload.Add("dataKey", keyConfigObj.encryptedKey.ToString());
                    payload.Add("iv", keyConfigObj.iv.ToString());
                    payload.Add("record", encryptedData);
                    keyConfigObj.plainKey.Dispose();
                    return inputJsonObject.ToString();
                }
                else
                {
                    logObj.Error("Inside TransactionHandler - dataEncryption - Invalid input data");
                    // throw exception when schema and input validation fails
                    throw new IOException("Invalid input data");
                }
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside TransactionHandler - payloadEncryption() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside TransactionHandler - payloadEncryption() : {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method for decrypting the payload
        /// </summary>
        /// <param name="inputJsonString"></param>
        /// <returns></returns>
        public string dataDecryption(string inputJsonString)
        {
            try
            {
                if (inputJsonString != string.Empty)
                {
                    var inputJsonObject = JObject.Parse(inputJsonString);
                    var args = (JArray)inputJsonObject["data"];
                    if (args.Count != 0)
                    {
                        for (int i = 0; i < args.Count; i++)
                        {
                            var header = (JObject)args[i]["header"];
                            var payload = (JObject)args[i]["payload"];
                            KeyConfigModel keyConfigObj = new KeyConfigModel();
                            keyConfigObj = keyManagementObj.getDecryptKey(payload["dataKey"].ToString(), header["trainingPartnerUen"].ToString(), header["trainingPartnerCode"].ToString());
                            if ((((securityUtilObj.ConvertFromSecureString(keyConfigObj.plainKey) == null) || (securityUtilObj.ConvertFromSecureString(keyConfigObj.plainKey).Equals(string.Empty)))))
                            {
                                logObj.Error("CryptoManager - dataDecryption - Invalid Plain Key.");
                                // throw exception when schema and input validation fails
                                throw new InvalidOperationException(" Invalid Plain Key.");
                            }
                            else
                            {
                                dynamic decryptedData = cryptoUtilObj.DecryptString(securityUtilObj.ConvertFromSecureString(keyConfigObj.plainKey), payload["record"].ToString(), payload["iv"].ToString());
                                payload.Replace(decryptedData);
                            }
                            keyConfigObj.plainKey.Dispose();
                        }
                        return inputJsonObject.ToString();
                    }
                    else
                    {
                        logObj.Error("Inside TransactionHandler - dataDecryption - Invalid input data");
                        // throw exception when schema and input validation fails
                        throw new IOException("Invalid input data");
                    }
                }
                else
                {
                    logObj.Error("Inside TransactionHandler - dataDecryption - Invalid input data");
                    // throw exception when schema and input validation fails
                    throw new IOException("Invalid input data");
                }
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside TransactionHandler - payloadDecryption() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside TransactionHandler - payloadDecryption() : {0}", e.Message);
                throw;
            }
        }
    }
}
