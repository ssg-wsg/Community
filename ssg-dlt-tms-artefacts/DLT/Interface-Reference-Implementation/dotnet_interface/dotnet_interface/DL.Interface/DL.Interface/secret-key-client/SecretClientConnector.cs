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
using System.Security;
using Amazon.SecretsManager.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NLog;

namespace DL.Interface
{
    public class SecretClientConnector
    {
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        // AWSInfraClient object
        private static AWSInfraClient aWSInfraClient = new AWSInfraClient();

        // DataAccess Object
        private DataAccess dataAccessObj = new DataAccess();

        //Security Util Object
        private static SecurityUtil securityUtilObj = new SecurityUtil();

        public class secretKey
        {
            [JsonProperty("plainDataKey")]
            public string plainDataKey { get; set; }
            [JsonProperty("encoding")]
            public string encoding { get; set; }
        }

        //Function for retrieving already saved secret from AWS secrets manager
        public string GetSecret(string SecretName)
        {
            //Get Amazon Secret Manager Client
            var awsSecretManager = aWSInfraClient.GetAmazonSecretsManagerClient();
            string secret = "";

            MemoryStream memoryStream = new MemoryStream();
            GetSecretValueRequest request = new GetSecretValueRequest();
            request.SecretId = SecretName;
            GetSecretValueResponse response = null;

            try
            {
                response = awsSecretManager.GetSecretValueAsync(request).Result;
                if (response.SecretString != null)
                {
                    secret = response.SecretString;
                }
                else
                {
                    memoryStream = response.SecretBinary;
                    StreamReader reader = new StreamReader(memoryStream);
                    secret = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(reader.ReadToEnd()));
                }
                var inputJsonObject = JObject.Parse(secret);
                return inputJsonObject["plainDataKey"].ToString();
            }
            catch (Exception e)
            {
                if ((((Amazon.Runtime.AmazonServiceException)e.InnerException)!= null) &&((Amazon.Runtime.AmazonServiceException)e.InnerException).ErrorCode == "ResourceNotFoundException")
                {
                    return string.Empty;
                }
                logObj.Error(e.StackTrace, "Inside SecretClientConnector - GetSecret() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside SecretClientConnector - GetSecret() : {0}", e.Message);
                throw;
            }
        }


        //Function for creating a new secret in the AWS secrets manager and updating an already existing secret in the AWS.
        public bool CreateUpdateSecret(string secretName, SecureString secretKey)
        {
            try
            {
                secretKey secretKeyObject = new secretKey
                {
                    plainDataKey = securityUtilObj.ConvertFromSecureString(secretKey),
                    encoding = "Base-64"

                };
                var trainingPartnerJson = JsonConvert.SerializeObject(secretKeyObject);
                //Get Amazon Secret Manager Client
                var awsSecretManager = aWSInfraClient.GetAmazonSecretsManagerClient();
                //if mode is true - create a new secret
                if ((GetSecret(secretName) == string.Empty))
                {
                    var response = awsSecretManager.CreateSecret(new CreateSecretRequest
                    {
                        Name = secretName,
                        SecretString = trainingPartnerJson.ToString(),
                    });
                }
                //if mode is false update an existing secret
                else if ((GetSecret(secretName) != string.Empty))
                {
                    var response = awsSecretManager.UpdateSecret(new UpdateSecretRequest
                    {
                        SecretId = secretName,
                        SecretString = trainingPartnerJson.ToString()
                    });
                }
                //returns true if the operation is successfull
                return true;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside SecretClientConnector - CreateUpdateSecret() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside SecretClientConnector - CreateUpdateSecret() : {0}", e.Message);
                throw;
            }
        }
    }
}
