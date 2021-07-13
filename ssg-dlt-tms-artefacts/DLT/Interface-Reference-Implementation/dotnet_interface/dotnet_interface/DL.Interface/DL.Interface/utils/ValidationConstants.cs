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

using System.Collections.Generic;

namespace DL.Interface
{
    public static class ValidationConstants
    {
        public static string EVENT_TYPE = "eventType";
        public static string PRIMARY_KEY = "primaryKey";
        public static string SECONDARY_KEY = "secondaryKey";
        public static string TERTIARY_KEY = "tertiaryKey";
        public static string TRAINING_PARTNER_UEN = "trainingPartnerUen";
        public static string TRAINING_PARTNER_CODE = "trainingPartnerCode";
        public static string SCHEMA_LOCATION = "schemaLocation";
        public static string SCHEMA_VERSION = "schemaVersion";
        public static string PAGE_NUMBER = "pageNumber";

        public static string ATTENDANCE_EVENT = "Attendance";
        public static string ENROLMENT_EVENT = "Enrolment";
        public static string FEES_COLLECTION_EVENT = "FeesCollection";
        public static string ASSESSMENT_EVENT = "Assessment";

        public static string EMPTY_FIELD_VALIDATION = "Fields inside Header cannot be empty";
        public static string ACK_TIME_STAMP = "ack.dateTime";
        public static string ACK_UNIX_TIME_STAMP = "ack.timeStampInMilliSeconds";
        public static string SRC_TIME_STAMP = "source.dateTime";
        public static string SRC_UNIX_TIME_STAMP = "source.timeStampInMilliSeconds";
        public static string ACK_TIMESTAMP_VALIDATION = "Acknowledgement timestamps should be -1";
        public static string SRC_TIMESTAMP_VALIDATION = "Source timestamps cannot be empty";

        public static string PRIMARY_KEY_VALIDATION = "header : " + PRIMARY_KEY + " does not match with payload : CONCAT(courseReferenceNumber,traineeId) = ";
        public static string SECONDARY_KEY_VALIDATION = "header : " + SECONDARY_KEY + " does not match with payload : courseRunId";
        public static string MISSING_FIELD_VALIDATION = "Missing field inside header : ";
        public static List<string> HEADER_KEYS = new List<string>() { EVENT_TYPE, PRIMARY_KEY, SECONDARY_KEY, TERTIARY_KEY, PAGE_NUMBER };
        public static string TP_CODE_UEN_VALIDATION = "Training Partner Code and UEN should not have empty spaces. Training Partner Code should comprise of UEN, '-' and Numeric value";


    }
}
