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
using System.Configuration;
using NLog;

namespace DL.Interface
{

    /// <summary>
    /// External Configuration Parser class will parse the configurations of User.config file which is stored outside the DL Interface
    /// </summary>
    class ExternalConfigurationParser
    {
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        //Loading userSetting from User.config file
        private static AppSettingsSection userSettings = LoadConfigs.LoadUserConfigs();

        //Loading userSetting from User.config file
        private static AppSettingsSection configSettings = LoadConfigs.LoadSectionConfigs(Constants.DEV_ENV.ToString());

        /// <summary>
        /// Method to set the application environment
        /// </summary>
        /// <returns>AWSConfigurationModel</returns>
        public static Boolean SetAppEnv()
        {
            AWSConfigurationModel awsProperties = new AWSConfigurationModel();
            try
            {
                switch (userSettings.Settings[Constants.DEPLOY_ENV].Value.ToString())
                {
                    case Constants.DEV_ENV:
                        configSettings = LoadConfigs.LoadSectionConfigs(Constants.DEV_ENV.ToString());
                        return true;
                    case Constants.QA_ENV:
                        configSettings = LoadConfigs.LoadSectionConfigs(Constants.QA_ENV.ToString());
                        return true;
                    case Constants.UAT_ENV:
                        configSettings = LoadConfigs.LoadSectionConfigs(Constants.UAT_ENV.ToString());
                        return true;
                    case Constants.STG_ENV:
                        configSettings = LoadConfigs.LoadSectionConfigs(Constants.STG_ENV.ToString());
                        return true;
                    case Constants.PROD_ENV:
                        configSettings = LoadConfigs.LoadSectionConfigs(Constants.PROD_ENV.ToString());
                        return true;
                    default:
                        Console.WriteLine("Invalid environment name.");
                        return false;
                }
            }
            catch (Exception e)
            {
                logObj.Error(e.Message, "Inside ExternalConfigurationParser - SetAppEnv() : Invalid Environment ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - SetAppEnv() : Invalid Environment: {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method to retrieve the AWS Fabric properties : Region, Access Key  and Secret Key
        /// </summary>
        /// <returns>AWSConfigurationModel</returns>
        public static AWSConfigurationModel GetAWSProperties()
        {
            AWSConfigurationModel awsProperties = new AWSConfigurationModel();
            try
            {
                if (SetAppEnv())
                {
                    awsProperties.AWSRegion = configSettings.Settings[Constants.AWSPROPS_REGION].Value ?? string.Empty;
                    awsProperties.AWSAccessKey = configSettings.Settings[Constants.AWSPROPS_ACCESS].Value ?? string.Empty;
                    awsProperties.AWSSecretKey = configSettings.Settings[Constants.AWSPROPS_SECRET].Value ?? string.Empty;
                }
            }
            catch (Exception e)
            {
                logObj.Error(e.Message, "Inside ExternalConfigurationParser - GetAWSProperties() : Invalid AWS Credentials Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetAWSProperties() : Invalid AWS Credentials Provided: {0}", e.Message);
                throw;
            }
            return awsProperties;
        }

        /// <summary>
        /// Method to retrieve the AWS Fabric properties : Enrolment Id, Network Id  and Member Id
        /// </summary>
        /// <returns>FabricConfigModel</returns>
        public static DLTConfigModel GetDltProperties()
        {
            DLTConfigModel fabricProperties = new DLTConfigModel();
            try 
            {
                fabricProperties.NetworkId = configSettings.Settings[Constants.AWSFABRIC_NETWORKID].Value ?? string.Empty;
                fabricProperties.MemberId = configSettings.Settings[Constants.AWSFABRIC_MEMBERID].Value ?? string.Empty;
                fabricProperties.EnrolmentId = configSettings.Settings[Constants.AWSFABRIC_ENROLMENTID].Value ?? string.Empty;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - GetFabricProperties() : Invalid AMB Fabric Properties Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetFabricProperties() : Invalid AMB Fabric Properties Provided : {0}", e.Message);
                throw;
            }
            return fabricProperties;
        }

        /// <summary>
        /// Method to retrieve the AWS SQS queue Url
        /// </summary>
        /// <returns>string</returns>
        public static string GetSQSQueueUrl()
        {
            try
            {
                return configSettings.Settings[Constants.AWSSQS_QUEUEURL].Value ?? string.Empty;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - GetSQSQueueUrl() : Invalid AWS SQS Queue URL Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetSQSQueueUrl() : Invalid AWS SQS Queue URL Provided : {0}", e.Message);
                throw;
            }
        }

       /// <summary>
       /// Method to retrieve the Lambda Method name for chaincode
       /// </summary>
       /// <returns>string</returns>
        public static string GetLambdaChaincodeFunction()
        {
            try
            {
                return configSettings.Settings[Constants.AWSLAMBDA_CHAINCODE].Value ?? string.Empty;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - GetLambdaChaincodeFunction() : Invalid AWS Lambda Chaincode Function Name Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetLambdaChaincodeFunction() : Invalid AWS Lambda Chaincode Function Name Provided: {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method to retrieve the local DB URL for Key Management
        /// </summary>
        /// <returns>string</returns>
        public static string GetLocalDBUrlFunction()
        {
            try
            {
                return configSettings.Settings[Constants.KEY_MANAGEMENT_LOCAL_DB_URL].Value ?? string.Empty;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - GetLocalDBUrlFunction() : Invalid Local DB URL Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetLocalDBUrlFunction() : Invalid Local DB URL Provided: {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method to retrieve the local DB Database for Key Management
        /// </summary>
        /// <returns>string</returns>
        public static string GetLocalDBDatabaseFunction()
        {
            try
            {
                return configSettings.Settings[Constants.KEY_MANAGEMENT_LOCAL_DATABSE].Value ?? string.Empty;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - GetLocalDBDatabaseFunction() : Invalid Local DB Database Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetLocalDBDatabaseFunction() : Invalid Local DB Database Provided: {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method to retrieve the local DB Collection for Key Management
        /// </summary>
        /// <returns>string</returns>
        public static string GetLocalDBCollectionFunction()
        {
            try
            {
                return configSettings.Settings[Constants.KEY_MANAGEMENT_LOCAL_DB_COLLECTION].Value ?? string.Empty;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - GetLocalDBCollectionFunction() : Invalid Local DB Database Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetLocalDBCollectionFunction() : Invalid Local DB Database Provided: {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method to retrieve the Key Management API Url Encryption
        /// </summary>
        /// <returns>string</returns>
        public static string GetLocalAPIUrlEncryption()
        {
            try
            {
                return configSettings.Settings[Constants.KEY_MANAGEMENT_API_URL_ENCRYPTION].Value ?? string.Empty;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - GetLocalAPIUrlEncryption() : Invalid Key Management API Url Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetLocalAPIUrlEncryption() : Invalid Key Management API Url Provided: {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method to retrieve the Key Management API Url Decryption
        /// </summary>
        /// <returns>string</returns>
        public static string GetLocalAPIUrlDecryption()
        {
            try
            {
                return configSettings.Settings[Constants.KEY_MANAGEMENT_API_URL_DECRYPTION].Value ?? string.Empty;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - GetLocalAPIUrlDecryption() : Invalid Key Management API Url Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetLocalAPIUrlDecryption() : Invalid Key Management API Url Provided: {0}", e.Message);
                throw;
            }
        }

        /// <summary>
        /// Method to retrieve the Key Management Base API Url Decryption
        /// </summary>
        /// <returns>string</returns>
        public static string GetLocalBaseAPIUrl()
        {
            try
            {
                return configSettings.Settings[Constants.KEY_MANAGEMENT_BASE_URL].Value ?? string.Empty;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - GetLocalBaseAPIUrl() : Invalid Key Management API Url Provided ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - GetLocalBaseAPIUrl() : Invalid Key Management API Url Provided: {0}", e.Message);
                throw;
            }
        }
    }
}
