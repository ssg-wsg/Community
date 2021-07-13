### Event : Enrolment

Enrolment is the point at which a Trainee/Company is accepted by a Partner into a Course Run, spanning from initial registration of interest all the way to payment of the entire enrolment fees by the Trainee/Company to the Partner.
Enrolment data is submitted by a Partner through their Training Management Systems. The source system will submit the requests to their respective DL members. This leads to events being registered across the SSG Training Ecosystem DL, thereby notifying SSG to continue processing the application. 

Each Enrolment event tracks the combination of a Trainee, Company (Employer, where applicable), Course Run and Partner.

The data submitted for Enrolment should include all the following attributes:  

| Payload Attributes                                                          | Event Fields                         | Mandatory                                                 | Input/Output | Data Type | Description                                                                                                                                                               |
|-----------------------------------------------------------------------------|--------------------------------------|-----------------------------------------------------------|--------------|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| (enrolment) action                                                          | Action                               | Y                                                         | Input        | String    | Defines the action to be taken by this request <br> Must be either of the three values: create / update / cancel                                                          |
| (enrolment) (trainingPartner) code                                          | Training Partner Code                | Y                                                         | Input        | String    | Training Partner's Code                                                                                                                                                   |
| (enrolment) (trainingPartner) uen                                           | Training Partner UEN                 | Y                                                         | Input        | String    | Training Partner's organisation UEN                                                                                                                                       |
| (enrolment) (course) referenceNumber                                        | Course Reference Number              | Y                                                         | Input        | String    | SSG assigned identifier for the Course                                                                                                                                    |
| (enrolment) (course) (run) Id                                               | Course Run Id                        | Y                                                         | Input        | String    | Unique identifier of the course run (Value is sourced from External System)                                                                                               |
| (enrolment) (trainee) id                                                    | Trainee Id                           | Y                                                         | Input        | String    | Unique identifier of the trainee <br> Trainee's government-issued ID number                                                                                               |
| (enrolment) (trainee) (idType) type                                         | Trainee Id Type                      | Y                                                         | Input        | String    | Identity Type<br> E.g. NRIC / FIN / OTHERS                                                                                                                               |
| (enrolment) (trainee) fullName                                              | Trainee's Full Name                  | N                                                         | Input        | String    | Trainee's full name as per the NRIC/FIN/Passport                                                                                                                          |
| (enrolment) (trainee) dateOfBirth                                           | Trainee Date Of Birth                | Y                                                         | Input        | String    | Date of birth of the trainee <br> Format : YYYY-MM-DD based on ISO 8601                                                                                                   |
| (enrolment) (trainee) (contactNumber) countryCode                           | Trainee Contact Number Country Code  | N                                                         | Input        | String    | Trainee's contact phone number's country code                                                                                                                             |
| (enrolment) (trainee) (contactNumber) areaCode                              | Trainee Contact Number Area Code     | N                                                         | Input        | String    | Trainee's contact phone number's area code<br> (Value is empty if not applicable)                                                                                        |
| (enrolment) (trainee) (contactNumber) phoneNumber                           | Trainee Contact Number               | N                                                         | Input        | String    | Trainee's contact phone number                                                                                                                                            |
| (enrolment) (trainee) emailAddress                                          | Trainee Email Address                | N                                                         | Input        | String    | Email address of the trainee                                                                                                                                              |
| (enrolment) (trainee) sponsorshipType                                       | Sponsorship Type                     | Y                                                         | Input        | String    | Type of Sponsorship<br> E.g. Employer/ Individual                                                                                                                        |
| (enrolment) (trainee) (employer) uen                                        | Employer Organisation UEN            | N                                                         | Input        | String    | Unique identifier of the sponsoring employer                                                                                                                              |
| (enrolment) (trainee) (employer) (contact) fullName                         | Employer Contact Name                | N                                                         | Input        | String    | Full name of a contact person at the employer organisation                                                                                                                |
| (enrolment) (trainee) (employer) (contact) (contactNumber) <br> countryCode | Employer Contact Number Country Code | N                                                         | Input        | String    | Employer contact's phone number's country code                                                                                                                            |
| (enrolment) (trainee) (employer) (contact) (contactNumber) <br> areaCode    | Employer Contact Number Area Code    | N                                                         | Input        | String    | Employer contact's phone number's area code                                                                                                                               |
| (enrolment) (trainee) (employer) (contact) (contactNumber) <br> phoneNumber | Employer Contact Number              | N                                                         | Input        | String    | Employer contact's phone number                                                                                                                                           |
| (enrolment) (trainee) (employer) (contact) emailAddress                     | Employer Contact Email Address       | N                                                         | Input        | String    | Employer contact's email address                                                                                                                                          |
| (enrolment) (trainee) enrolmentDate                                         | Enrolment Date                       | N                                                         | Input        | String    | Date of enrolment <br> Format : YYYY-MM-DD based on ISO 8601                                                                                                              |
| (enrolment) (trainee) (fees) discountAmount                                 | Discount Amount                      | N                                                         | Input        | String    | Amount of discount the training partner is deducting from the course fees                                                                                                 |
| (enrolment) (trainee) (fees) currencyType                                   | Currency Type                        | N                                                         | Input        | String    | Amount Currency Type (SGD)                                                                                                                                                |
| (enrolment) referenceNumber                                                 | Enrolment Reference Number           | Y (action = "update / cancel") <br> N (action = "create") | Output       | String    | Enrolment Reference Number <br> Generated by SSG after successful validation                                                                                              |
| (enrolment) status                                                          | Enrolment Status                     | Y (action = "update / cancel") <br> N (action = "create") | Output       | String    | Status of enrolment generated by SSG.<br> E.g. Confirmed/Cancelled <br> **SSG will not cancel an enrolment unless Training Providers submit a cancel enrolment request** |

**Input Request Parameters** :

The input to the DL Interface comprises of the following parts:

   1. **Header** : consists of attributes which are required by the DL Interface to process the payload 

      | Attributes          | Data Type | Description                                                  |
      | ------------------- | --------- | ------------------------------------------------------------ |
      | eventType           | String    | Type of the event <br>(Enrolment)                            |
      | primaryKey          | String    | Primary Lookup Key<br>CONCAT(Course Reference Number,Trainee ID) |
      | secondaryKey        | String    | Secondary Lookup Key <br>(Course Run ID)                     |
      | tertiaryKey         | String    | Tertiary Lookup Key<br>For Enrolment Request by Source System:<br>"-1" when action = "create"<br> Enrolment Reference Number when action = "update / cancel"        |
      | trainingPartnerUen  | String    | Training Partner's UEN                                       |
      | trainingPartnerCode | String    | Training Partner's Branch Code                               |
      | schemaLocation      | String    | Location of the JSON schema file stored locally in the system |
      | schemaVersion       | String    | Version of the schema                                        |

> The schemaLocation field should point to the location of the file in SSG's Repository.
> For data validation before writing to the DLT, this JSON schema file could be retrieved from SSG's Repository and stored in the local file system. 

   2. **Payload**: consists of the actual enrolment data; all data within the payload is to be encrypted before writing to the DLT

      | Attributes | Data Type              | Description                                |
      | ---------- | ---------------------- | ------------------------------------------ |
      | payload    | Serialized JSON Object | This is the JSON object of Enrolment data. |


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

> ***The values for the fields in the DLT schema should not be blank; if any field is left blank it will lead to errors in data submission to SSG***

This is a sample of the serialized JSON object to be supplied as input to the DL Interface by Source System: 

```
"{
    "header": {
        "eventType": "Enrolment",
        "primaryKey": "TGS-0026008-ESS0118316H",
        "secondaryKey": "10026",
        "tertiaryKey": "-1",
        "trainingPartnerUen": "T08GB0032G",
        "trainingPartnerCode": "T08GB0032G-01",
        "schemaLocation": "<TBC>",
        "schemaVersion": "TGS_v1.0"
    },
    "payload": {
        "enrolment": {
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
                "id": "S0118316H",
                "idType": {
                    "type": "NRIC"
                },
                "dateOfBirth": "1950-10-16",
                "fullName": "Jon Chua",
                "contactNumber": {
                    "countryCode": "+65",
                    "areaCode": "00",
                    "phone": "88881234"
                },
                "emailAddress": "abc@abc.com",
                "sponsorshipType": "EMPLOYER",
                "employer": {
                    "uen": "G01234567S",
                    "contact": {
                        "fullName": "Stephen Chua",
                        "contactNumber": {
                            "countryCode": "+65",
                            "areaCode": "00",
                            "phoneNumber": "88881234"
                        },
                        "emailAddress": "x@test.com"
                    }
                },
                "enrolmentDate": "2020-05-01",
                "fees": {
                    "discountAmount": "50.00",
                    "currencyType": "SGD"
                }
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

The above data is written to the DLT, after the primary keys are hashed and payload is encrypted. The DLT-specific fields are populated accordingly and the "validationResult" is set to "TGS-300" which means "PENDING_VALIDATION" until SSG validates the data items.

**Response Parameters** :

Upon receiving this information, SSG performs validation and returns a response; the response depends on the result of the validation.

The following fields are updated as explained below:

   1. **Header** : all other fields and values from the request header are retained; only the Tertiary key is updated 

      | Attributes                                                   | Data Type | Description                                                  |
      | ------------------------------------------------------------ | --------- | ------------------------------------------------------------ |
      | tertiaryKey                                                  | String    | If validation is successful, **Enrolment Reference Number**  <br> If validation failed, **-1** |
      | ALL OTHER FIELDS & VALUES FROM THE REQUEST HEADER ARE RETAINED |           |                                                              |

   2. **Payload**: consists of the actual enrolment data; all data within the payload is to be encrypted before writing to the DLT

      | Attributes | Data Type              | Description                                |
      | ---------- | ---------------------- | ------------------------------------------ |
      | payload    | Serialized JSON Object | This is the JSON object of Enrolment data. |


   3. **Public Payload**: additional fields which are **not encrypted** before writing to the DLT

      | Attributes                    | Data Type       | Description                                                  |
      | ----------------------------- | --------------- | ------------------------------------------------------------ |
      | tags                          | Array of String | This is an Array of String tags for future use.              |
      | (ack) dateTime                | String          | Acknowledgement time stamp with seconds. To be updated by SSG. <br/>ISO 8601 Datetime format |
      | (ack) timeStampInMilliSeconds | String          | Acknowledgement time stamp with milli seconds. To be updated by SSG. <br/>Unix Datetime format |

   4. **DLT Data**: all fields are updated by SSG to indicate the result of validation

      | Attributes       | Data Type | Description                                                  |
      | ---------------- | --------- | ------------------------------------------------------------ |
      | eventSource      | String    | SSG                                                          |
      | timeStamp        | String    | Time stamp updated by the DL                                 |
      | validationResult | String    | Status of validation updated by SSG<br> If validation is successful, the code is TGS-200 <br> If validation failed, TGS_4XX |

>  NOTE : The description for the validation error codes should be fetched from the API, details of the API will be provided in future.


A sample successful response of validation from SSG is shown below. The primary keys as read from the DLT are shown in hashed form and the payload is depicted after decryption.

```
"{
       "header": {
             "eventType": "Enrolment",
             "primaryKey": "80e00f124e8bd67257fd0291a8491c3b2ce3ee838ff9dafd91a841da0f7c329174eaaa0006e289e5536f46d0529be058",
             "secondaryKey": "10026",
             "tertiaryKey": "ENR-1912-000123",
             "trainingPartnerUen": "T08GB0032G",
             "trainingPartnerCode":"T08GB0032G-01",
             "schemaLocation": "<TBC>",
             "schemaVersion": "TGS_v1.0"
       },
       "payload": {
           "enrolment": {
              "action" : "create",
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
                    "id": "S0118316H",
                    "idType": {
                           "type": "NRIC"
                    },
                    "dateOfBirth": "1950-10-16",
                    "fullName": "Jon Chua",
                    "contactNumber": {
                           "countryCode": "+65",
                           "areaCode": "00",
                           "phone": "88881234"
                    },
                    "emailAddress": "abc@abc.com",
                    "sponsorshipType": "EMPLOYER",
                    "employer": {
                        "uen": "G01234567S",
                        "contact": {
                               "fullName": "Stephen Chua",
                               "contactNumber": {
                                     "countryCode": "+65",
                                     "areaCode": "00",
                                     "phoneNumber": "88881234"
                               },
                               "emailAddress": "x@test.com"
                        }
                  },
                  "enrolmentDate": "2020-05-01",
                  "fees": {
                      "discountAmount": "50.00",
                      "currencyType": "SGD"
                   } 
                },
               "referenceNumber":"ENR-1912-000123"
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
             "eventSource": "<SSG's DLT Member>",
             "timeStamp": "2020-05-04T20:58:38.251Z",
             "validationResult": "TGS-200"
       }
}"
```

A sample failure response of validation from SSG is shown below. In this scenario, the enrolment is considered to have failed and a reference number is not assigned by SSG. The primary keys as read from the DLT are shown in hashed form and the payload is depicted after decryption.

```
"{
       "header": {
             "eventType": "Enrolment",
             "primaryKey": "80e00f124e8bd67257fd0291a8491c3b2ce3ee838ff9dafd91a841da0f7c329174eaaa0006e289e5536f46d0529be058",
             "secondaryKey": "10026",
             "tertiaryKey": "-1",
             "trainingPartnerUen": "T08GB0032G",
             "trainingPartnerCode":"T08GB0032G-01",
             "schemaLocation": "<TBC>",
             "schemaVersion": "TGS_v1.0"
       },
       "payload": {
           "enrolment": {
              "action" : "create",
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
                    "id": "S0118316H",
                    "idType": {
                           "type": "NRIC"
                    },
                    "dateOfBirth": "1950-10-16",
                    "fullName": "Jon Chua",
                    "contactNumber": {
                           "countryCode": "+65",
                           "areaCode": "00",
                           "phone": "88881234"
                    },
                    "emailAddress": "abc@abc.com",
                    "sponsorshipType": "EMPLOYER",
                    "employer": {
                        "uen": "G01234567S",
                        "contact": {
                               "fullName": "Stephen Chua",
                               "contactNumber": {
                                     "countryCode": "+65",
                                     "areaCode": "00",
                                     "phoneNumber": "88881234"
                               },
                               "emailAddress": "x@test.com"
                        }
                  },
                  "enrolmentDate": "2020-05-01",
                  "fees": {
                      "discountAmount": "50.00",
                      "currencyType": "SGD"
                   }  
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
             "eventSource": "<SSG's DLT Member>",
             "timeStamp": "2020-05-04T20:58:38.251Z",
             "validationResult": "TGS-4XX"
       }
}"
```

#### Submission of data via the DLT
Submission of Enrolment records to the SSG Training Ecosystem DL Network can be in one of the following phases:
* **Record Creation**
* **Record Update**
* **Record Cancellation**

Partners are required to follow a sequence of steps while going through these phases.

**Record Creation:**
This indicates the case when records are created for the first time.  
  1. For a new record submission, partners are to create a new Enrolment event for a given primary key and secondary key; the tertiary key should be set to -1 at this time. The `action` field in the payload should be set to `create`. Once this is submitted, the partner should wait for the response from SSG for this event. No new events pertaining to that record are to be submitted in the meantime.
  2. SSG validates the submission and if the data is valid, returns the enrolment reference number in the tertiary key.
  3. Partners listening for events from the DL Network read this response and extract the tertiary key.
	 
**Record Update:**
This indicates the case when pre-existing, valid records are updated.
  1. For updates to data submitted during the creation process, partners are required to include the enrolment reference number as tertiary key along with the primary and secondary keys. To update an existing record, partners update the record for the given primary, secondary and tertiary keys; the tertiary key in this case should carry the enrolment reference number. The `action` field in the payload should be set to `update`.
  2. Once this is submitted, the partner should wait for the response from SSG for this event. No new events pertaining to that record are to be submitted in the meantime. If another update event (with a different set of changes) is submitted for the same record in the meantime, the order of execution of events cannot be guaranteed, which would lead to an unpredictable state of data submission.

**Record Cancellation:**
This indicates the case when pre-existing, valid records are cancelled. Cancellation could happen due to a few reasons; one of them is when the partner decides to withdraw from the grants submission process and would like to cancel any applications/data submitted for the same; another reason could be because the partner made an error in some important details like the Trainee ID or Course Reference number or Course Run ID etc. In the second case, partners cannot just update the already provided record; they have to cancel the previous submission and create a new one.
  1. For cancelling an already submitted (and approved) record, partners are required to include the enrolment reference number as tertiary key along with the primary and secondary keys. To `cancel` an existing record, partners indicate the correct values for the primary, secondary and tertiary keys. The `action` field in the payload should be set to cancel. The tertiary key in this case should carry the enrolment reference number. 
  2. Once this is submitted, the partner should wait for the response from SSG for this event. No new events pertaining to that record are to be submitted in the meantime. If another update event (with a different set of changes) is submitted for the same record in the meantime, the order of execution of events cannot be guaranteed, which would lead to an unpredictable state of data submission.
  3. Once the partners receive a response, they can proceed to create a new record (if needed).