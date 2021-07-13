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
using Newtonsoft.Json.Schema;
using NLog;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;

namespace DL.Interface
{
    /// <summary>
    /// Implementation of Schema-Validation of the input JSON string provided
    /// </summary>
    public class SchemaValidation
    {
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        /// <summary>
        /// Constructor Declaration
        /// </summary>
        public SchemaValidation()
        {
        }

        /// <summary>
        /// Method to Parse the Serialized JSON String into the JToken Object
        /// </summary>
        /// <param name="jsonString"></param>
        /// <returns>JToken of the jsonString</returns>
        public JToken ParseInput(string jsonString)
        {
            JToken jsonObject = JToken.Parse(jsonString);
            return jsonObject;
        }

        /// <summary>
        /// Method to parse the JSON Schema from the location provided
        /// </summary>
        /// <param name="url"></param>
        /// <returns>JSchema object of the schema provided</returns>
        public JSchema ParseSchemaFromUrl(string url)
        {
            WebClient schemaWebClient = new WebClient();
            Stream stream = schemaWebClient.OpenRead(url);
            StreamReader reader = new StreamReader(stream);
            string schemaContent = reader.ReadToEnd();
            JSchema schema = JSchema.Parse(schemaContent);
            return schema;
        }

        /// <summary>
        /// Method to perform Schema Validation against the schema provided and Perform validation checks on the input
        /// </summary>
        /// <param name="inputJsonString"></param>
        /// <returns>Boolean : True if validation is successful</returns>
        public bool isWriteJsonValid(String inputJsonString)
        {
            bool validationResponse = false;
            IList<string> errors = new List<string>();
            JSchema inputJsonSchema = new JSchema();
            JObject payload = null;

            JToken inputJsonObject = ParseInput(inputJsonString);

            //fetch header and payload JSON Objects
            var header = (JObject)inputJsonObject["header"];
            String eventType = header[ValidationConstants.EVENT_TYPE].ToString().ToLower();

            if (!eventType.Equals(ValidationConstants.FEES_COLLECTION_EVENT.ToLower()))
                payload = (JObject)inputJsonObject.SelectToken(String.Concat("payload.", eventType));
            else
                payload = (JObject)inputJsonObject.SelectToken(String.Concat("payload.", ValidationConstants.ENROLMENT_EVENT.ToLower()));

            var publicPayload = (JObject)inputJsonObject["publicPayload"];

            //NOTE : The schemaLocation in the input JSON should be a local path in the file system referencing to schema file which is retreived from github repo provided by SSG.
            if (!String.IsNullOrEmpty(header[ValidationConstants.SCHEMA_LOCATION].ToString()))
            {
                inputJsonSchema = ParseSchemaFromUrl(header["schemaLocation"].ToString());
            }

            //valid input JSON with the Schema
            validationResponse = inputJsonObject.IsValid(inputJsonSchema, out errors);

            if (validationResponse)
            {
                //If schema validation is successful. check for other validations for the lookup keys
                validationResponse = isWriteInputValid(header, payload, publicPayload);
            }
            else
            {
                foreach (string error in errors)
                {
                    logObj.Error("Schema Validation Failed for Write: {0}", error);

                }
            }

            return validationResponse;
        }

        /// <summary>
        /// Method to perform additional validations for the lookup Keys
        /// </summary>
        /// <param name="header"></param>
        /// <param name="payload"></param>
        /// <returns>Boolean : return True is the validation is successful</returns>
        public bool isWriteInputValid(JObject header, JObject payload, JObject publicPayload)
        {
            bool validationResponse = true;
            IList<string> errors = new List<string>();
            String eventType = header[ValidationConstants.EVENT_TYPE].ToString().ToLower();

            //validation check for empty fields
            if (String.IsNullOrEmpty(header[ValidationConstants.EVENT_TYPE].ToString()) ||
                String.IsNullOrEmpty(header[ValidationConstants.PRIMARY_KEY].ToString()) ||
                String.IsNullOrEmpty(header[ValidationConstants.SECONDARY_KEY].ToString()) ||
                String.IsNullOrEmpty(header[ValidationConstants.TERTIARY_KEY].ToString()) ||
                String.IsNullOrEmpty(header[ValidationConstants.TRAINING_PARTNER_UEN].ToString()) ||
                String.IsNullOrEmpty(header[ValidationConstants.TRAINING_PARTNER_CODE].ToString()) ||
                String.IsNullOrEmpty(header[ValidationConstants.SCHEMA_LOCATION].ToString()) ||
                String.IsNullOrEmpty(header[ValidationConstants.SCHEMA_VERSION].ToString()))
            {
                errors.Add(ValidationConstants.EMPTY_FIELD_VALIDATION);
            }

            //validation check for ack timestamps = -1
            if (!publicPayload.SelectToken(ValidationConstants.ACK_TIME_STAMP).ToString().Equals("-1") ||
                !publicPayload.SelectToken(ValidationConstants.ACK_UNIX_TIME_STAMP).ToString().Equals("-1"))
            {
                errors.Add(ValidationConstants.ACK_TIMESTAMP_VALIDATION);
            }

            //validation for source timestamps for empty or null
            if (String.IsNullOrEmpty(publicPayload.SelectToken(ValidationConstants.SRC_TIME_STAMP).ToString()) ||
                String.IsNullOrEmpty(publicPayload.SelectToken(ValidationConstants.SRC_UNIX_TIME_STAMP).ToString()))
            {
                errors.Add(ValidationConstants.SRC_TIMESTAMP_VALIDATION);
            }
          
            if (!eventType.Equals(ValidationConstants.FEES_COLLECTION_EVENT.ToLower()))
            {
                String primaryKey = String.Concat(payload.SelectToken("course.referenceNumber").ToString(), payload.SelectToken("trainee.id").ToString());

                //validation for the primary key against Concatenation of course reference number and course run Id fields
                if (!header[ValidationConstants.PRIMARY_KEY].ToString().Equals(primaryKey))
                {
                    errors.Add(ValidationConstants.PRIMARY_KEY_VALIDATION + primaryKey);
                }

                //validation for the secondary key against course run reference number
                if (!header[ValidationConstants.SECONDARY_KEY].ToString().Equals(payload.SelectToken("course.run.id").ToString()))
                {
                    errors.Add(ValidationConstants.SECONDARY_KEY_VALIDATION);
                }
            }

            //validation for Training Partner Code and Training Partner UEN
            if (!isTpUenAndTpCodeValid(header[ValidationConstants.TRAINING_PARTNER_UEN].ToString(), header[ValidationConstants.TRAINING_PARTNER_CODE].ToString()))
            {
                errors.Add(ValidationConstants.TP_CODE_UEN_VALIDATION);
            }

            if (errors.Count != 0)
            {
                validationResponse = false;
                foreach (string error in errors)
                {
                    logObj.Error("Input Validation Failed for Write: {0}", error);
                }
            }
            return validationResponse;
        }

        /// <summary>
        /// Method to validate the Input Header JSON
        /// </summary>
        /// <param name="inputJsonString"></param>
        /// <returns>Boolean : True if the Validation is successful</returns>
        public bool IsReadJsonValid(String inputJsonString)
        {
            bool validationResponse = true;
            string errorMsg;

            //check if all the keys are present inside the header JSON
            IList<string> headerKeys = ValidationConstants.HEADER_KEYS;
            IList<string> errors = new List<string>();

            JToken inputJsonObject = ParseInput(inputJsonString);
            var header = (JObject)inputJsonObject["header"];

            foreach (string key in headerKeys)
            {
                if (!header.ContainsKey(key))
                {
                    errorMsg = "Input Validation Failed for Read: " + ValidationConstants.MISSING_FIELD_VALIDATION + " : " + key;
                    logObj.Error(errorMsg);
                    errors.Add(errorMsg);
                }
            }
            if (errors.Count != 0)
            {
                validationResponse = false;
            }
            return validationResponse;
        }


        private bool isTpUenAndTpCodeValid(String tpUen, String tpCode)
        {
            bool isValid = false;
            try
            {
                if (!tpUen.Contains(" ") && !tpCode.Contains(" "))
                {
                    String[] codeStringArray = tpCode.Split('-');

                    if (codeStringArray.Length == 2 && tpUen.ToLower().Equals(codeStringArray[0].ToLower())
                            && int.TryParse(codeStringArray[1], out _))
                        isValid = true;
                }
            }
            catch (Exception e)
            {
                logObj.Error("isTpUenAndTpCodeValid : ", e.Message);
            }
            return isValid;
        }
    }
}
