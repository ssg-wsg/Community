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

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Net.Http;
using System.Text;
using NLog;
using System.Net.Http.Headers;
using System.Net;

namespace DL.Interface
{
    public class KeyManagement
    {
        //Local Database Object 
        private DataAccess dataAccessObj = new DataAccess();

        private SecurityUtil securityUtilObj = new SecurityUtil();

        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        public HttpClient Apiclient { get; set; } = new HttpClient();

        //Key Management API Encryption Url function name
        private static string keyManagementUrlEncryption;

        //Key Management API Decryption Url function name
        private static string keyManagementUrlDecryption;

        //Key Management Base API Url function name
        private static string keyManagementBaseAPIUrl;

        //create Secret Manager Object
        private static SecretManager secretManagerObj = new SecretManager();

        public class trainingPartner
        {
            [JsonProperty("code")]
            public string code { get; set; }
        }

        public class key
        {
            [JsonProperty("encryptedKey")]
            public string encryptedKey { get; set; }
        }

        public class KeyEncyptData
        {
            [JsonProperty("trainingPartner")]
            public trainingPartner trainingPartner { get; set; }
        }

        public class KeyDecryptData
        {
            [JsonProperty("trainingPartner")]
            public trainingPartner trainingPartner { get; set; }
            [JsonProperty("key")]
            public key key { get; set; }
        }

        //static constructor to initialize the Key Management Properties
        public KeyManagement()
        {
            keyManagementUrlEncryption = ExternalConfigurationParser.GetLocalAPIUrlEncryption();
            keyManagementUrlDecryption = ExternalConfigurationParser.GetLocalAPIUrlDecryption();
            keyManagementBaseAPIUrl = ExternalConfigurationParser.GetLocalBaseAPIUrl();
            InitializeClient();
        }

        public void InitializeClient()
        {
            try
            {
                Apiclient = new HttpClient();
                Apiclient.BaseAddress = new Uri(keyManagementBaseAPIUrl);
                Apiclient.DefaultRequestHeaders.Accept.Clear();
                Apiclient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside KeyManagement - InitializeClient() - API cannot be started");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside KeyManagement - InitializeClient() : {0} - API cannot be started", e.Message);
                throw;
            }
        }

        public KeyConfigModel getEncryptKey(string trainingPartnerUen, string trainingPartnerCode)
        {
            try
            {
                dynamic newKey;
                KeyConfigModel keyConfigObj = new KeyConfigModel();
                keyConfigObj = dataAccessObj.GetKey(trainingPartnerCode);
                KeyConfigModel newkeyConfig = new KeyConfigModel();

                if (keyConfigObj != null)
                {
                    if (DateTime.Compare(Convert.ToDateTime(keyConfigObj.validUpTo), DateTime.Now) < 0)
                    {
                        newKey = getEncryptDataKey(trainingPartnerUen, trainingPartnerCode);
                        var inputJsonObject = JObject.Parse(newKey);
                        var data = (JObject)inputJsonObject["data"];
                        var key = (JObject)data["key"];
                        var trainingPartner = (JObject)data["trainingPartner"];
                        newkeyConfig.encryptedKey = key["encryptedKey"].ToString();
                        newkeyConfig.trainingPartnerCode = trainingPartner["code"].ToString();
                        newkeyConfig.trainingPartnerUen = trainingPartner["uen"].ToString(); ;
                        newkeyConfig.validUpTo = key["validUpTo"].ToString();
                        newkeyConfig.numberOfBytes = key["numberOfBytes"].ToString();
                        newkeyConfig.plainKey = securityUtilObj.ConvertToSecureString(Convert.ToString(key["plainKey"]));
                        dataAccessObj.Update(trainingPartnerCode, newkeyConfig);
                        secretManagerObj.CreateUpdateSecret(trainingPartnerCode, newkeyConfig.plainKey);
                    }
                    else
                    {
                        keyConfigObj.plainKey = securityUtilObj.ConvertToSecureString(secretManagerObj.GetSecret(keyConfigObj.trainingPartnerCode));
                        return keyConfigObj;
                    }
                }
                else
                {
                    newKey = getEncryptDataKey(trainingPartnerUen, trainingPartnerCode);
                    var inputJsonObject = JObject.Parse(newKey);
                    var data = (JObject)inputJsonObject["data"];
                    var key = (JObject)data["key"];
                    var trainingPartner = (JObject)data["trainingPartner"];
                    newkeyConfig.encryptedKey = key["encryptedKey"].ToString();
                    newkeyConfig.trainingPartnerCode = trainingPartner["code"].ToString();
                    newkeyConfig.trainingPartnerUen = trainingPartner["uen"].ToString(); ;
                    newkeyConfig.validUpTo = key["validUpTo"].ToString();
                    newkeyConfig.numberOfBytes = key["numberOfBytes"].ToString();
                    newkeyConfig.plainKey = securityUtilObj.ConvertToSecureString(Convert.ToString(key["plainKey"]));      
                    secretManagerObj.CreateUpdateSecret(trainingPartnerCode, newkeyConfig.plainKey);
                    dataAccessObj.Create(newkeyConfig);
                }
                return newkeyConfig;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside KeyManagement - getEncryptKey() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside KeyManagement - getEncryptKey() : {0}", e.Message);
                throw;
            }
        }

        public KeyConfigModel getDecryptKey(string encryptedKey, string trainingPartnerUen, string trainingPartnerCode)
        {
            try
            {
                KeyConfigModel newkeyConfig = new KeyConfigModel();
                dynamic newKey;
                KeyConfigModel keyConfigObj = new KeyConfigModel();
                keyConfigObj = dataAccessObj.GetKey(trainingPartnerCode);
                if (keyConfigObj != null)
                {
                    if (keyConfigObj.encryptedKey.Equals(encryptedKey))
                    {
                        keyConfigObj.plainKey = securityUtilObj.ConvertToSecureString(secretManagerObj.GetSecret(keyConfigObj.trainingPartnerCode));
                        return keyConfigObj;
                    }
                    else
                    {
                        newKey = getDecryptDataKey(trainingPartnerUen, trainingPartnerCode, encryptedKey);
                        var inputJsonObject = JObject.Parse(newKey);
                        var data = (JObject)inputJsonObject["data"];
                        var key = (JObject)data["key"];
                        var trainingPartner = (JObject)data["trainingPartner"];
                        newkeyConfig.encryptedKey = key["encryptedKey"].ToString();
                        newkeyConfig.trainingPartnerCode = trainingPartner["code"].ToString();
                        newkeyConfig.trainingPartnerUen = trainingPartner["uen"].ToString();
                        newkeyConfig.validUpTo = key["validUpTo"].ToString();
                        newkeyConfig.numberOfBytes = key["numberOfBytes"].ToString();
                        newkeyConfig.plainKey = securityUtilObj.ConvertToSecureString(Convert.ToString(key["plainKey"]));
                        dataAccessObj.Update(trainingPartnerCode, newkeyConfig);
                        return newkeyConfig;
                    }
                }
                else
                {
                    logObj.Error("Inside KeyManagement - getDecryptKey - Encrypted data key not present locally.");
                    // throw exception when schema and input validation fails
                    throw new InvalidOperationException(" Encrypted data key not present locally.");
                }
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside KeyManagement - getDecryptKey() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside KeyManagement - getDecryptKey() : {0}", e.Message);
                throw;
            }
        }

        public string getEncryptDataKey(string trainingPartnerUen, string trainingPartnerCode)
        {
            try
            {
                KeyEncyptData KeyEncyptDataObject = new KeyEncyptData
                {
                    trainingPartner = new trainingPartner
                    {
                        code = trainingPartnerCode,
                    }
                };
                var trainingPartnerJson = JsonConvert.SerializeObject(KeyEncyptDataObject);
                var apiRequest = (HttpWebRequest)WebRequest.Create(keyManagementBaseAPIUrl);
                var apiResponse = (HttpWebResponse)apiRequest.GetResponse();
                if (apiResponse.StatusCode == HttpStatusCode.OK)
                {
                    string url = keyManagementUrlEncryption;
                    string result = string.Empty;
                    var httpContent = new StringContent(trainingPartnerJson, Encoding.UTF8, "application/json");
                    using (var client = new HttpClient())
                    {
                        client.DefaultRequestHeaders.Add("uen", trainingPartnerUen);
                        var response = client.PostAsync(url, httpContent).Result;

                        if (response.IsSuccessStatusCode)
                        {
                            var responseContent = response.Content;

                            // by calling .Result you are synchronously reading the result
                            result = responseContent.ReadAsStringAsync().Result;
                        }
                    }
                    return result;
                }
                else
                {
                    logObj.Error("Inside KeyManagement - getEncryptDataKey - Not able to connect to the Key Management API.");
                    // throw exception when schema and input validation fails
                    throw new InvalidOperationException("  Not able to connect to the Key Management API.");
                }
               
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside KeyManagement - getEncryptDataKey() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside KeyManagement - getEncryptDataKey() : {0}", e.Message);
                throw;
            }
        }

        public string getDecryptDataKey(string trainingPartnerUen, string trainingPartnerCode, string encryptedKey)
        {
            try
            {
                KeyDecryptData KeyDecryptDataObject = new KeyDecryptData
                {
                    trainingPartner = new trainingPartner
                    {
                        code = trainingPartnerCode,
                    },
                    key = new key
                    {
                        encryptedKey = encryptedKey,
                    }
                };
                var trainingPartnerJson = JsonConvert.SerializeObject(KeyDecryptDataObject);
                var apiRequest = (HttpWebRequest)WebRequest.Create(keyManagementBaseAPIUrl);
                var apiResponse = (HttpWebResponse)apiRequest.GetResponse();
                if (apiResponse.StatusCode == HttpStatusCode.OK)
                {
                    string url = keyManagementUrlDecryption;
                    string result = string.Empty;
                    var httpContent = new StringContent(trainingPartnerJson, Encoding.UTF8, "application/json");
                    using (var client = new HttpClient())
                    {
                        client.DefaultRequestHeaders.Add("uen", trainingPartnerUen);
                        var response = client.PostAsync(url, httpContent).Result;

                        if (response.IsSuccessStatusCode)
                        {
                            var responseContent = response.Content;

                            // by calling .Result you are synchronously reading the result
                            result = responseContent.ReadAsStringAsync().Result;
                        }
                    }
                    return result;
                }
                else
                {
                    logObj.Error("Inside KeyManagement - getEncryptDataKey - Not able to connect to the Key Management API.");
                    // throw exception when schema and input validation fails
                    throw new InvalidOperationException("  Not able to connect to the Key Management API.");
                }
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside KeyManagement - getDecryptDataKey() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside KeyManagement - getDecryptDataKey() : {0}", e.Message);
                throw;
            }
        }
    }
}
