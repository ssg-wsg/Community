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

package tgs.dl.intfc.constants;

public class ValidationConstants {

	public static final String ATTENDANCE_EVENT = "Attendance";
    public static final String ENROLMENT_EVENT = "Enrolment";
    public static final String FEES_COLLECTION_EVENT = "Fees Collection";
    public static final String ASSESSMENT_EVENT = "Assessment";

    public static final String PRIMARY_KEY_VALIDATION = "header : " + HeaderKeys.PRIMARY_KEY.getHeaderKey()
            + " does not match with payload : courseReferenceNumber, traineeId";
    public static final String SECONDARY_KEY_VALIDATION = "header : " + HeaderKeys.SECONDARY_KEY.getHeaderKey()
            + " does not match with payload : runId";
    public static final String MISSING_FIELD_VALIDATION = "Missing field inside header : ";
    public static final String ACK_TIMESTAMP_VALIDATION = "Acknowledgement timestamps should be -1";
    public static final String SRC_TIMESTAMP_VALIDATION = "Source timestamps cannot be empty";
    public static final String TP_CODE_UEN_VALIDATION = "Training Partner Code and UEN should not be null. Training Partner Code should comprise of UEN, '-' and Numeric value";
    

}