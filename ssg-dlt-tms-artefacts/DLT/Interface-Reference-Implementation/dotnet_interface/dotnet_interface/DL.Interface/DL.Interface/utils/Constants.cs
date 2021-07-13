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

namespace DL.Interface
{
    /// <summary>
    /// Class to store all the constant fields used inside the interface
    /// </summary>
    public static class Constants
    {
        public const string FABRIC_CHANNELNAME = "testnet";
        public const string FABRIC_CHAINCODE_NAME = "grantcc";
        public enum TRIGGERTYPE { INVOKE, QUERY }
        public enum FUNCTIONS { createDLTEvent, readDataWithPartialKeyAndPagination }

        // User Configuration file name
        public const string CONFIG_FILE = @"\User.config";

        //AWS Properties Config keys
        public const string AWSPROPS_REGION = "region";
        public const string AWSPROPS_ACCESS = "accessKey";
        public const string AWSPROPS_SECRET = "secretKey";

        //AWS AMB Fabric Properties Config keys
        public const string AWSFABRIC_NETWORKID = "networkId";
        public const string AWSFABRIC_MEMBERID = "memberId";
        public const string AWSFABRIC_ENROLMENTID = "enrolmentId";

        //AWS SQS Queue URL Property Config key
        public const string AWSSQS_QUEUEURL = "sqsUrl";
        //AWS SQS Queue Max message count per batch
        public const int AWSSQS_LENGTH = 10;

        //AWS Lambda Function for Chaincode Property Config key
        public const string AWSLAMBDA_CHAINCODE = "lambdaChaincode";

        //Key Management Properties Config keys
        public const string KEY_MANAGEMENT_LOCAL_DB_URL = "localDBUrl";
        public const string KEY_MANAGEMENT_LOCAL_DATABSE = "localDatabase";
        public const string KEY_MANAGEMENT_LOCAL_DB_COLLECTION = "localDBCollection";
        public const string KEY_MANAGEMENT_API_URL_ENCRYPTION = "keyManagementUrlEncryption";
        public const string KEY_MANAGEMENT_API_URL_DECRYPTION = "keyManagementUrlDecryption";
        public const string KEY_MANAGEMENT_BASE_URL = "keyManagementBaseUrl";
        
        //ENV property
        public const string DEPLOY_ENV = "env";

        //Dev Env Section
        public const string DEV_ENV = "dev";

        //QA Env Section
        public const string QA_ENV = "qa";

        //UAT Env Section
        public const string UAT_ENV = "uat";

        //Staging Env Section
        public const string STG_ENV = "stg";

        //Prod Env Section
        public const string PROD_ENV = "prod";

        //DLT Interface Version
        public const string DLT_INT_VER = "v0.5";

    }
}
