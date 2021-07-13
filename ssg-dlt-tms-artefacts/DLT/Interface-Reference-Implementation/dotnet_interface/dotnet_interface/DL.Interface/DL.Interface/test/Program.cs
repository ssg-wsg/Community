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
using System.IO;
using Newtonsoft.Json.Linq;

namespace DL.Interface
{
	class Program
	{
        //create TimestampUtils Object
        static TimestampUtils timeStampUtils = new TimestampUtils();

        /// <summary>
        /// The sample implemenation to set the source timestamps inside the public payload.
        /// </summary>
        /// <param name="inputJsonString"></param>
        /// <returns></returns>
        static string setSourceTime(string inputJsonString)
        {
            try
            {
                if (inputJsonString != string.Empty)
                {
                    var inputJsonObject = JObject.Parse(inputJsonString);

                    var publicPayload = (JObject)inputJsonObject["publicPayload"];
                    var source = (JObject)publicPayload["source"];
                    source["dateTime"] = timeStampUtils.generateDatetime();
                    source["timeStampInMilliSeconds"] = timeStampUtils.generateUnixTimestampInMilliseconds();

                    return inputJsonObject.ToString();
                }
                else
                {
                    // throw exception when schema and input validation fails
                    throw new IOException("Invalid input data");
                }
            }
            catch (Exception e)
            {
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside Test Program - setSourceTime() : {0}", e.Message);
                throw;
            }
        }
        static void Main(string[] args)
		{
			Gateway gateway = new Gateway();

			string writeGrantsDataInput;
            //NOTE: The schemaLocation in the input JSON should be a local path in the file system referencing to schema file which is retreived from github repo provided by SSG.
            using (StreamReader r = new StreamReader("../../test/write-sample-input/enrolment.json"))
			{
				writeGrantsDataInput = r.ReadToEnd();
			}

            // Before submitting the data to the incoming queue, Partners should update the source timestamps with the current timestamp inside the publicPayload.
            string input = setSourceTime(writeGrantsDataInput);
            gateway.writeGrantsDataDLT(input);


			string readGrantsDataInput;
			using (StreamReader r = new StreamReader("../../test/read-sample-input/enrolment.json"))
			{
				readGrantsDataInput = r.ReadToEnd();

			}

            //sample call to read data
            string readResponse = gateway.readGrantsDataDLT(readGrantsDataInput);
            Console.WriteLine("Response from the readTestData :{0}", readResponse);
            Console.ReadKey();
		}
	}
}
