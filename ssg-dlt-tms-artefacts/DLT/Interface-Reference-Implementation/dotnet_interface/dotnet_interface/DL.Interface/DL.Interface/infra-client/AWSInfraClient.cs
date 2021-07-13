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

using Amazon;
using Amazon.Lambda;
using Amazon.Runtime;
using Amazon.SecretsManager;
using Amazon.SQS;
using NLog;
using System;

namespace DL.Interface
{
    public class AWSInfraClient
    {
        // AWS credentials property
        private static AWSConfigurationModel awsCredentials;

        //static constructor to initialize the aws credentials and only one object at the time is instantiation
        static AWSInfraClient() {
            awsCredentials = ExternalConfigurationParser.GetAWSProperties();
        }
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();
       
        /// <summary>
        /// Method to retreive the AmazonLambda Client
        /// </summary>
        /// <returns>AmazonLambdaClient</returns>
        public AmazonLambdaClient GetAmazonLambdaClient()
        {
            AmazonLambdaClient lambdaClient = null;
            try
            {
                lambdaClient = new AmazonLambdaClient(awsCredentials.AWSAccessKey, awsCredentials.AWSSecretKey, RegionEndpoint.APSoutheast1);
                
            }
            catch (Exception e)
            {
                //Logging the error in to a logger file
                logObj.Error(e.StackTrace, "Inside AWSInfraClient - GetAmazonLambdaClient() :");
            }
            return lambdaClient;
        }



        /// <summary>
        /// Method to get the AmazonSQS Client
        /// </summary>
        /// <returns>AmazonSQSClient</returns>
        public AmazonSQSClient GetAmazonSQSClient()
        {
            AmazonSQSClient amazonSQSClient = null;
            try
            {
                //Create some Credentials with the IAM user
                var awsCreds = new BasicAWSCredentials(awsCredentials.AWSAccessKey, awsCredentials.AWSSecretKey);
                //Create a client to talk to SQS
                amazonSQSClient = new AmazonSQSClient(awsCreds, Amazon.RegionEndpoint.APSoutheast1);           
            }
            catch (Exception e)
            {
                //Logging the error in to a logger file
                logObj.Error(e.StackTrace, "Inside AWSInfraClient - GetAmazonSQSClient() :");
            }
            return amazonSQSClient;
        }

        /// <summary>
        /// Method to get the Amazon Secrets Manager Client
        /// </summary>
        /// <returns>AmazonSecretManagerClient</returns>
        public AmazonSecretsManagerClient GetAmazonSecretsManagerClient()
        {
            AmazonSecretsManagerClient amazonSecretsManagerClient = null;
            try
            {
                //Create some Credentials with the IAM user
                var awsCreds = new BasicAWSCredentials(awsCredentials.AWSAccessKey, awsCredentials.AWSSecretKey);
                //Create a client to talk to SQS
                amazonSecretsManagerClient = new AmazonSecretsManagerClient(awsCreds, Amazon.RegionEndpoint.APSoutheast1);
            }
            catch (Exception e)
            {
                //Logging the error in to a logger file
                logObj.Error(e.StackTrace, "Inside AWSInfraClient - GetAmazonSecretsManagerClient() :");
            }
            return amazonSecretsManagerClient;
        }

    }
}
