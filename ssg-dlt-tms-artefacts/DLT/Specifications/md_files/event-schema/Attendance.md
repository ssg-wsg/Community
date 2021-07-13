### Event : Attendance


Systems used for collecting attendance info (like MySF) can directly upload the attendance data to their DL members. This leads to events being registered across the SSG Training Ecosystem DL, thereby notifying SSG to continue processing the application. SSG can then reconcile the data received with information submitted by the Partners, to make decisions regarding grants disbursement. 

All the fields highlighted below (except the Venue) are considered to be mandatory for processing the grants application for the specified Course and trainee. 

***Partners cannot submit Attendance data via the DL Network, for now. They can view attendance records which were submitted by attendance collection systems like MySF.***

The data submitted for Attendance should include all the following attributes:


| Payload Attributes                              | Event Fields                                | Mandatory | Input/Output| Data Type | Description                                                  |
| ----------------------------------------------- | ------------------------------------------- | --------- | ----------- | --------- | ------------------------------------------------------------ |
| (course) referenceNumber                        | Course Reference Number                     | Y         | Input		| String    | SSG assigned identifier for the Course                       |
| (course) (run) id                               | Course Run Id                               | Y         | Input		| String    | Unique identifier of the course run (Value is sourced from External System) |
| (course) (run) (modeOfTraining) code            | Course Run Mode of Training Code            | Y         | Input		| String    | Mode of Training Code for a particular Course Run            |
| (course) (run) (modeOfTraining) description     | Course Run Mode of Training Description     | Y         | Input		| String    | Mode of Training Description for a particular Course Run<br> Values for Mode of Training description are : <br>1. Classroom <br>2. Online <br> 3. In-house<br>4. On-the-Job<br>5. Practical / Practicum<br>6. Supervised Field<br>7. Traineeship<br>8. Assessment |
| (course) (session) id                           | Course Session ID                           | Y         | Input		| String    | Identifier for the Course Session (Value is sourced from External System) |
| (course) (session) attendanceId                 | Course Session Attendance ID                | Y         | Input		| String    | Unique identifier for the Course Session Attendance Record (Value is sourced from External System) |
| (course) (session) (modeOfTraining) code        | Course Session Mode of Training Code        | Y         | Input		| String    | Mode of Training Code for a particular Course Session        |
| (course) (session) (modeOfTraining) description | Course Session Mode of Training Description | Y         | Input		| String    | Mode of Training Description for a particular Course Session |
| (course) (session) startDateTime                | Course Session Start Date Time              | Y         | Input		| String    | Course Session Start Date Time                               |
| (course) (session) endDateTime                  | Course Session End Date Time                | Y         | Input		| String    | Course Session End Date Time                                 |
| (trainee) Id                                    | Trainee ID                                  | Y         | Input		| String    | Unique identifier of the trainee                             |
| (attendance) status                             | Attendance Status                           | Y         | Input		| String    | Status of Attendance <br>E.g. Confirmed / Unconfirmed / Rejected |
| (attendance) formOfCollection                   | Form of collection                          | Y         | Input		| String    | Attendance form of collection <br>E.g. Manual / Mobile       |
| (attendance) type                               | Attendance Type                             | Y         | Input		| String    | Type of Attendance <br>E.g. Trainee, Trainer, Assessment<br>Type is Trainee when the update is intended for the trainee’s attendance.<br>Type is Trainer when the update is intended to capture the trainer’s attendance.<br>Type is Assessment when the update is to capture the assessor’s attendance. |
| (attendance) (venue) sessionPostalCode          | Course Session Venue Postal Code            | Y         | Input		| String    | Postal code of the course session venue<br/>                 |
| (attendance) numOfHours                         | Total Number of Hours                       | Y         | Input		| String    | Total Number of Hours <br>To be provided as "-1" if not present |
| isDeleted                                       | Flag for record deletion by MySF            | Y         | Input		| String    | Flag for record deletion by MySF <br> E.g. Y/N               |
																											
**Input Request Parameters** :																				
																											
The input to the DL Interface comprises of the following parts:

1. **Header** : consists of fields which are required by the DL Interface to process the payload

   | Attributes          | Data Type | Description                                                  |
   | ------------------- | --------- | ------------------------------------------------------------ |
   | eventType           | String    | Type of the event <br>(Attendance)                           |
   | primaryKey          | String    | Primary Lookup Key<br>CONCAT(Course Reference Number,Trainee ID) |
   | secondaryKey        | String    | Secondary Lookup Key <br>(Course Run ID)                     |
   | tertiaryKey         | String    | Tertiary Lookup Key <br>(Course Session ID)                  |
   | trainingPartnerUen  | String    | Training Partner's UEN                                       |
   | trainingPartnerCode | String    | Training Partner's Branch Code                               |
   | schemaLocation      | String    | Location of the JSON schema file stored locally in the system |
   | schemaVersion       | String    | Version of the schema                                        |

> The schemaLocation field should point to the location of the file in SSG's Repository.
> For data validation before writing to the DLT, this JSON schema file could be retrieved from SSG's Repository and stored in the local file system. 

2. **Payload**: consists of the actual Attendance data; all data within the payload is to be encrypted before writing to the DLT

   | Attributes | Data Type              | Description                                 |
   | ---------- | ---------------------- | ------------------------------------------- |
   | payload    | Serialized JSON Object | This is the JSON object of Attendance data. |


3. **Public Payload**: additional fields which are **not encrypted** before writing to the DLT

   | Attributes | Data Type       | Description                                     |
   | ---------- | --------------- | ----------------------------------------------- |
   | tags       | Array of String | This is an Array of String tags for future use. |
   | (source) dateTime | String    | Source System time stamp in seconds <br/>ISO 8601 Datetime format |
   | (source) timeStampInMilliSeconds| String    | Source System time stamp in milli seconds <br/>Unix Datetime format  |
   | (ack) dateTime | String    | Acknowledgement time stamp in seconds. To be provided as "-1" by Source System <br/>ISO 8601 Datetime format |
   | (ack) timeStampInMilliSeconds| String    | Acknowledgement time stamp in milli seconds. To be provided as "-1" by Source System <br/>Unix Datetime format  |

> For Attendance, the tags can be empty

> In order to align with SSG's time, the source system should be in sync with the Amazon Time Sync Service via Network Time Protocol (NTP).
> If the source system time is not aligned with SSG's time, this could lead to improper sequencing of data updates, which in turn would lead to 
erroneous data submission via the DLT.

4. **DLT Data**: fields updated by the Distributed Ledger. Any values supplied by the source system will not be used.

   | Attributes       | Data Type | Description                               |
   | ---------------- | --------- | ----------------------------------------- |
   | eventSource      | String    | Source system initiating the request      |
   | timeStamp        | String    | Time stamp updated by the DL              |
   | validationResult | String    | Result of the validation performed by SSG |


This is a sample of the serialized JSON object to be supplied as input to the DL Interface :  	

```
"{
	"header": {
		"eventType": "Attendance",
		"primaryKey": "COURSE-1911BRA-12345S123455",
		"secondaryKey": "41618",
		"tertiaryKey": "CRS-N-0041336-144-S1",
		"trainingPartnerUen": "ORG00008UEN",
		"trainingPartnerCode": "ORG00008UEN-01",
		"schemaLocation": "<TBC>",
		"schemaVersion": "TGS_v1.0"
	},
	"payload": {
		"course": {
			"referenceNumber": "COURSE-1911BRA-12345",
			"run": {
				"id": "41618",
				"modeOfTraining": {
					"code": "1",
					"description": "Classroom"
				}
			},
			"session": {
				"id": "CRS-N-0041336-144-S1",
				"attendanceId": "123",
				"modeOfTraining": {
					"code": "1",
					"description": "Classroom"
				},
				"startDateTime": "2020-04-01 08:00",
				"endDateTime": "2020-04-01 11:00"
			}
		},
		"trainee": {
			"id": "S123455"
		},
		"attendance": {
			"status": "Confirmed",
			"formOfCollection": "Mobile",
			"type": "Trainee",
			"venue": {
				"sessionPostalCode": "870626"
			},
			"numOfHours": "-1"
		},
		"isDeleted": "N"
	},
	"publicPayload": {
		"tags": [],
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

Certain fields within the payload will be updated on the basis on Mode Of Training as shown in the table below :

   | Mode Of Training Code    | Mode Of Training Description | Sample value for Number of Hours   | Sample value for Session Start Datetime | Sample value for Session End Datetime |
   | ------------------------ | ---------------------------- | ---------------------------------- | --------------------------------------- | ------------------------------------- |
   | 1                        | Classroom                    | -1                                 | 2020-04-01 08:00                        | 2020-04-01 11:00                      |
   | 2                        | Online                       |  5                                 | 2020-04-01 00:00                        | 2020-04-20 23:57                      |
   | 3                        | In-house                     | -1                                 | 2020-04-01 09:07                        | 2020-04-24 18:07                      |
   | 4                        | On-the-Job                   |  5                                 | 2020-04-01 09:07                        | 2020-04-24 18:07                      |
   | 5                        | Practical / Practicum        | -1                                 | 2020-04-01 09:07                        | 2020-04-24 18:07                      |
   | 6                        | Supervised Field             | -1                                 | 2020-04-01 09:07                        | 2020-04-24 18:07                      |
   | 7                        | Traineeship                  | -1                                 | 2020-04-01 09:07                        | 2020-04-24 18:07                      |
   | 8                        | Assessment                   | -1                                 | 2020-04-01 08:00                        | 2020-04-01 11:00                      |
