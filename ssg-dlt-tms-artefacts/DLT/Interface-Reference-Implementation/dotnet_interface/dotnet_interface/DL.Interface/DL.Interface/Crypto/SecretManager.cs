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
using System.Security;
using NLog;

namespace DL.Interface
{
    public class SecretManager
    {
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();
        //secret client connector object
        private SecretClientConnector secretClientConnectObj = new SecretClientConnector();

        //Function for retrieving already saved secret from AWS secrets manager
        public string GetSecret(string SecretName)
        {
            try
            {
                return(secretClientConnectObj.GetSecret(SecretName));
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside SecretManager - GetSecret() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside SecretManager - GetSecret() : {0}", e.Message);
                throw;
            }
        }

        //Function for creating a new secret in the AWS secrets manager and updating an already existing secret in the AWS.
        public bool CreateUpdateSecret(string secretName, SecureString secretKey)
        {
            try
            {
                return (secretClientConnectObj.CreateUpdateSecret(secretName,secretKey));
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside SecretManager - CreateUpdateSecret() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside SecretManager - CreateUpdateSecret() : {0}", e.Message);
                throw;
            }
        }
    }
}
