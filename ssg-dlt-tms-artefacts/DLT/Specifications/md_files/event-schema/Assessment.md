### Event : Assessment

Assessment is the point at which a trainee completes an exam or other evaluation to ascertain that he/she understands the relevant knowledge from a course. Certain courses do not have an assessment component, while others require assessment for the attainment of qualifications and/or funding. A passing result is needed for most funding rules with assessments, if a trainee does not reach the minimum result, the grant will not be disbursed.

The Assessment data is usually raised by the Partners through their Training Management Systems. The source system will submit the requests to their respective DL members. This leads to events being registered across the SSG Training Ecosystem DL, thereby notifying SSG to continue processing the application.

The data submitted for Assessment should include all the following attributes:

| Payload Attributes                      | Event Fields                   | Mandatory                    | Input/Output | Data Type | Description                                                                                                                                                          |
|-----------------------------------------|--------------------------------|------------------------------|--------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| (assessment) action                     | Action                         | Y                            | Input        | String    | Defines the action to be taken by this request <br> Must be either of the three values: create / update / void                                                       |
| (assessment) (trainingPartner) code     | Training Partner Code          | Y                            | Input        | String    | Training Partner's Code                                                                                                                                              |
| (assessment) (trainingPartner) uen      | Training Partner UEN           | Y                            | Input        | String    | Training Partner's organisation UEN                                                                                                                                  |
| (assessment) (course) referenceNumber   | Course Reference Number        | Y                            | Input        | String    | SSG assigned identifier for the Course                                                                                                                               |
| (assessment) (course) (run) Id          | Course Run Id                  | Y                            | Input        | String    | Unique identifier of the course run (Value is sourced from External System)                                                                                          |
| (assessment) (trainee) (idType) type    | Trainee Id Type                | Y                            | Input        | String    | Identity Type<br> E.g. NRIC / FIN / OTHERS                                                                                                                          |
| (assessment) (trainee) id               | Trainee Id                     | Y                            | Input        | String    | Unique identifier of the trainee <br> Trainee's government-issued ID number                                                                                          |
| (assessment) (trainee) fullName         | Trainee's Full Name            | Y                            | Input        | String    | Trainee's full name as per the NRIC/FIN/Passport                                                                                                                     |
| (assessment) result                     | Assessment Result              | Y                            | Input        | String    | E.g. Pass / Fail / Exempt / Void                                                                                                                                     |
| (assessment) grade                      | Assessment Grade               | N                            | Input        | String    | Alphabetical score of the assessment, where applicable. Must be a value A to F.                                                                                      |
| (assessment) score                      | Assessment Score               | N                            | Input        | String    | Numerical score of the assessment, where applicable. Must be a value 0 to 100.                                                                                       |
| (assessment) assessmentDate             | Assessment Date                | Y                            | Input        | String    | Date of assessment<br> Format : YYYY-MM-DD based on ISO 8601                                                                                                        |
| (assessment) skillCode                  | Skill Code                     | N                            | Input        | String    | Skills or competency standard code associated with the assessment for certs/qualifications                                                                           |
| (assessment) (conferringInstitute) code | Assessment centre organisation | N                            | Input        | String    | UEN/branch code of the supporting assessment TP for the results.<br> If left blank, the trainingPartner.code is set as the default value. <br> E.g. "T16GB0003C-01" |
| (assessment) referenceNumber            | Assessment Reference Number    | Y (action = "update / void") | Output       | String    | Assessment Reference Number <br> Generated by SSG after successful validation                                                                                        |
																			
**Input Request Parameters** :

The input to the DL Interface comprises of the following parts:

1. **Header** : consists of attributes which are required by the DL Interface to process the payload

   | Attributes      | Data Type | Description                                                  |
   | --------------- | --------- | ------------------------------------------------------------ |
   | eventType       | String    | Type of the event <br>(Assessment)                           |
   | primaryKey      | String    | Primary Lookup Key<br>CONCAT(Course Reference Number,Trainee ID)|
   | secondaryKey    | String    | Secondary Lookup Key <br>(Course Run Reference Number)       |
   | tertiaryKey     | String    | Tertiary Lookup Key<br>For Assessment Request by Source System:<br>"-1" when action = "create"<br>Assessment Reference Number when action = "update / void"        |
   | trainingPartnerUen | String    | Training Partner's UEN |
   | trainingPartnerCode| String    | Training Partner's Branch Code|
   | schemaLocation  | String    | Location of the JSON schema file stored locally in the system|
   | schemaVersion   | String    | Version of the schema                                        |

> The schemaLocation field should point to the location of the file in SSG's Repository.
> For data validation before writing to the DLT, this JSON schema file could be retrieved from SSG's Repository and stored in the local file system. 
 

2. **Payload**: consists of the actual Assessment data; all data within the payload is to be encrypted before writing to the DLT

   | Attributes | Data Type              | Description                                 |
   | ---------- | ---------------------- | ------------------------------------------- |
   | payload    | Serialized JSON Object | This is the JSON object of Assessment data. |



3. **Public Payload**: additional fields which are **not encrypted** before writing to the DLT

      | Attributes                       | Data Type       | Description                                                  |
      | -------------------------------- | --------------- | ------------------------------------------------------------ |
      | tags                             | Array of String | This is an Array of String tags for future use.              |
      | (source) dateTime | String    | Source System time stamp in seconds <br/>ISO 8601 Datetime format |
      | (source) timeStampInMilliSeconds| String    | Source System time stamp in milli seconds <br/>Unix Datetime format  |
      | (ack) dateTime | String    | Acknowledgement time stamp in seconds. To be provided as "-1" by Source System <br/>ISO 8601 Datetime format |
      | (ack) timeStampInMilliSeconds| String    | Acknowledgement time stamp in milli seconds. To be provided as "-1" by Source System <br/>Unix Datetime format  |

> In order to align with SSG's time, the source system should be in sync with the Amazon Time Sync Service via Network Time Protocol (NTP).
> If the source system time is not aligned with SSG's time, this could lead to improper sequencing of data updates, which in turn would lead to 
erroneous data submission via the DLT. 

4. **DLT Data**: fields updated by the Distributed Ledger. Any values supplied by the source system will not be used.

   | Attributes       | Data Type | Description                               |
   | ---------------- | --------- | ----------------------------------------- |
   | eventSource      | String    | Source system initiating the request      |
   | timeStamp        | String    | Time stamp updated by the DL              |
   | validationResult | String    | Result of the validation performed by SSG |

***The values for the fields in the DLT schema should not be blank; if any field is left blank it will lead to errors in data submission to SSG***

 This is a sample of the serialized JSON object to be supplied as input to the DL Interface by Source System:

```
"{
       "header": {
             "eventType": "Assessment",
             "primaryKey": "TGS-0026008-ESS0118316H",
             "secondaryKey": "10026",
             "tertiaryKey": "-1",
             "trainingPartnerUen": "T08GB0032G",
             "trainingPartnerCode": "T08GB0032G-01",
             "schemaLocation": "<TBC>",
             "schemaVersion": "TGS_v1.0"
       },
       "payload": {
             "assessment": {
                 "action": "create",
              "trainingPartner": {
                    "code": "T08GB0032G-01",
                    "uen": "T08GB0032G"
              },
              "course": {
                    "referenceNumber": "TGS-0026008-ES",
                    "run": {
                           "id": "10026"
                    }
              },
              "trainee": {
                    "idType": {
                           "type": "NRIC"
                    },
                    "id": "S0118316H",
                    "fullName": "Jon Chua"
              },
              "result": "Pass",
              "score": "80",
              "grade": "B",
              "assessmentDate": "2020-05-01",
              "skillCode": "TGS-414342-3423",
              "conferringInstitute": {
                  "code": "T16GB0003C-01"
              }
             }
        },
       "publicPayload": {
             "tags": ["TBC"],
             "source": {
                "dateTime": "2020-05-04 20:58:17",
                "timeStampInMilliSeconds": "1588597097880"
             },
             "ack": {
                "dateTime": "-1",
                "timeStampInMilliSeconds": "-1"
            }
       },
       "dltData": {
            "eventSource": "",
            "timeStamp": "",
            "validationResult": ""
       }
}"
```
The above data is written to the DLT, after the primary keys are hashed and payload is encrypted.  The DLT-specific fields are populated accordingly and the "validationResult" is set to "TGS-300" which means "PENDING_VALIDATION" until SSG validates the data items.

**Response Parameters** :

Upon receiving this information, SSG performs validation and returns a response; the response depends on the result of the validation.

The following fields are updated as explained below:

   1. **Header** : all other fields and values from the request header are retained; only the Tertiary key is updated 

      | Attributes                                                   | Data Type | Description                                                  |
      | ------------------------------------------------------------ | --------- | ------------------------------------------------------------ |
      | tertiaryKey                                                  | String    | If validation is successful, **Assessment Reference Number**  <br> If validation failed, **-1** |
      | ALL OTHER FIELDS & VALUES FROM THE REQUEST HEADER ARE RETAINED |           |                                                              |
    

   2. **Payload**: consists of the response from SSG after validation; all data within the payload is to be encrypted before writing to the DLT

      | Attributes | Data Type              | Description                                |
      | ---------- | ---------------------- | ------------------------------------------ |
      | payload    | Serialized JSON Object | This is the JSON object of Assessment data |


   3. **Public Payload**: additional fields which are **not encrypted** before writing to the DLT
	
      | Attributes                       | Data Type        | Description                                                                                    |
      |----------------------------------|-------------------|------------------------------------------------------------------------------------------------|
      | tags                             | Array of String | This is an Array of String tags for future use                                                 |
      | (source) dateTime                | String            | Source System time stamp in seconds<br/>ISO 8601 Datetime format                              |
      | (source) timeStampInMilliSeconds | String            | Source System time stamp in milli seconds<br/>Unix Datetime format                            |
      | (ack) dateTime                   | String            | Acknowledgement time stamp with seconds. To be updated by SSG. <br/>ISO 8601 Datetime format   |
      | (ack) timeStampInMilliSeconds    | String            | Acknowledgement time stamp with milli seconds. To be updated by SSG. <br/>Unix Datetime format |
      
	    
   4. **DLT Data**: all fields are updated by SSG to indicate the result of validation

      | Attributes       | Data Type | Description                                                  |
      | ---------------- | --------- | ------------------------------------------------------------ |
      | eventSource      | String    | SSG                                                          |
      | timeStamp        | String    | Time stamp updated by the DL                                 |
      | validationResult | String    | Status of validation updated by SSG<br> If validation is successful, the code is TGS-200 <br> If validation failed, TGS_4XX |

> NOTE : The description for the validation error codes should be fetched from the API, details of the API will be provided in future.


A sample successful response of validation from SSG is shown below. The primary keys as read from the DLT are shown in hashed form and the payload is depicted after decryption.

```
"{
       "header": {
             "eventType": "Assessment",
             "primaryKey": "80e00f124e8bd67257fd0291a8491c3b2ce3ee838ff9dafd91a841da0f7c329174eaaa0006e289e5536f46d0529be058",
             "secondaryKey": "10026",
             "tertiaryKey": "ASM-1912-432432",
             "trainingPartnerUen": "T08GB0032G",
             "trainingPartnerCode": "T08GB0032G-01",
             "schemaLocation": "<TBC>",
             "schemaVersion": "TGS_v1.0"
       },
       "payload": {
             "assessment": {
                 "action": "create",
              "trainingPartner": {
                    "code": "T08GB0032G-01",
                    "uen": "T08GB0032G"
              },
              "course": {
                    "referenceNumber": "TGS-0026008-ES",
                    "run": {
                           "id": "10026"
                    }
              },
              "trainee": {
                    "idType": {
                           "type": "NRIC"
                    },
                    "id": "S0118316H",
                    "fullName": "Jon Chua"
              },
              "result": "Pass",
              "score": "80",
              "grade": "B",
              "assessmentDate": "2020-05-01",
              "skillCode": "TGS-414342-3423",
              "conferringInstitute": {
                  "code": "T16GB0003C-01"
              },
              "referenceNumber": "ASM-1912-432432"
             }
       },
       "publicPayload": {
             "tags": ["TBC"],
             "source": {
                    "dateTime": "2020-05-04 20:58:17",
                    "timeStampInMilliSeconds": "1588597097880"
             },
             "ack": {
                    "dateTime": "2020-05-05 20:58:17",
                    "timeStampInMilliSeconds": "1588683497880"
             }
       },
       "dltData": {
             "eventSource": "SSG",
             "timeStamp": "2020-05-04T20:58:38.251Z",
             "validationResult": "TGS-200"
       }
}"
```

A sample failure response of validation from SSG is shown below. In this scenario, the assessment is considered to have failed and a reference number is not assigned by SSG. The primary keys as read from the DLT are shown in hashed form and the payload is depicted after decryption.

```
"{
       "header": {
             "eventType": "Assessment",
             "primaryKey": "80e00f124e8bd67257fd0291a8491c3b2ce3ee838ff9dafd91a841da0f7c329174eaaa0006e289e5536f46d0529be058",
             "secondaryKey": "10026",
             "tertiaryKey": "-1",
             "trainingPartnerUen": "T08GB0032G",
             "trainingPartnerCode": "T08GB0032G-01",
             "schemaLocation": "<TBC>",
             "schemaVersion": "TGS_v1.0"
       },
       "payload": {
           "assessment": {
              "action": "create",
              "trainingPartner": {
                    "code": "T08GB0032G-01",
                    "uen": "T08GB0032G"
              },
              "course": {
                    "referenceNumber": "TGS-0026008-ES",
                    "run": {
                           "id": "10026"
                    }
              },
              "trainee": {
                    "idType": {
                           "type": "NRIC"
                    },
                    "id": "S0118316H",
                    "fullName": "Jon Chua"
              },
              "result": "Pass",
              "score": "80",
              "grade": "B",
              "assessmentDate": "2020-05-01",
              "skillCode": "TGS-414342-3423",
              "conferringInstitute": {
                  "code": "T16GB0003C-01"
              }
       }
       },
       "publicPayload": {
             "tags": ["TBC"],
             "source": {
                    "dateTime": "2020-05-04 20:58:17",
                    "timeStampInMilliSeconds": "1588597097880"
             },
             "ack": {
                    "dateTime": "2020-05-05 20:58:17",
                    "timeStampInMilliSeconds": "1588683497880"
             }
       },
       "dltData": {
             "eventSource": "SSG",
             "timeStamp": "2020-05-04T20:58:38.251Z",
             "validationResult": "TGS_4XX"
       }
}"
```

#### Submission of data via the DLT
Submission of Assessment records to the SSG Training Ecosystem DL Network can be in one of the following phases:

* **Record Creation**
* **Record Update**
* **Record Voiding**

Partners are required to follow a sequence of steps while going through these phases.

**Record Creation:**
This indicates the case when records are created for the first time.  

  1. For a new record submission, partners are to create a new Assessment event for a given primary key and secondary key; the tertiary key should be set to `-1` at this time. The `action` field in the payload should be set to `create`. Once this is submitted, the partner should wait for the response from SSG for this event. No new events pertaining to that record are to be submitted in the meantime.
  2. SSG validates the submission and if the data is valid, returns the assessment reference number in the tertiary key.
  3. Partners listening for events from the DL Network read this response and extract the tertiary key. 
	 
**Record Update:**
This indicates the case when pre-existing, valid records are updated.

1. For updates to data submitted during the creation process, partners are required to include the assessment reference number as tertiary key along with the primary and secondary keys. To update an existing record, partners update the record for the given primary, secondary and tertiary keys; the tertiary key in this case should carry the assessment reference number. The `action` field in the payload should be set to `update`. <br/>
2. Once this is submitted, the partner should wait for the response from SSG for this event. No new events pertaining to that record are to be submitted in the meantime. If another update event (with a different set of changes) is submitted for the same record in the meantime, the order of execution of events cannot be guaranteed, which would lead to an unpredictable state of data submission.

**Record Voiding:**
This indicates the case when pre-existing, valid records are cancelled. Cancellation could happen due to a few reasons; one of them is when the partner decides to withdraw from the grants submission process and would like to cancel any applications/data submitted for the same; another reason could be because the partner made an error in some important details like the Trainee ID or Course Reference number or Course Run ID etc. In the second case, partners cannot just update the already provided record; they have to cancel the previous submission and create a new one.

1. For cancelling an already submitted (and approved) record, partners are required to include the assessment reference number as tertiary key along with the primary and secondary keys. To cancel an existing record, partners indicate the primary, secondary and tertiary keys; the tertiary key in this case should carry the assessment reference number. The `action` field in the payload should be set to `void`. 
2. Once this is submitted, the partner should wait for the response from SSG for this event. No new events pertaining to that record are to be submitted in the meantime. If another update event (with a different set of changes) is submitted for the same record in the meantime, the order of execution of events cannot be guaranteed, which would lead to an unpredictable state of data submission.
3. Once the partners receive a response, they can proceed to create a new record (if needed).