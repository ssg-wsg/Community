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

using Microsoft.VisualStudio.TestTools.UnitTesting;
using DL.Interface;

namespace DL.Interface.Unittest
{
    [TestClass()]
    public class SQSClientConnectorTests
    {
        [TestMethod()]
        public void SendRequestTest_InputStringEmpty_ReturnFalse()
        {
            //Arrange
            var sqsclientObj = new SQSClientConnector();

            //Act
            var result = sqsclientObj.SendRequest(string.Empty);

            //Assert
            Assert.IsFalse(result);
        }
        [TestMethod()]
        public void SendRequestTest_InputTestString_ReturnTrue()
        {
            //Arrange
            var sqsclientObj = new SQSClientConnector();

            //Act
            var testData = @"{
                                  ""header"": {
                                    ""eventType"": ""Enrolment"",
                                    ""primaryKey"": ""5f69ea64e866c820adf659a35364b04a38bfbc6e226e35c1690dba910d33915570ac936512194220e64a0b96e8124719"",
                                    ""secondaryKey"": ""100261"",
                                    ""tertiaryKey"": ""- 1"",
                                    ""trainingPartnerUen"": ""88878433B"",
                                    ""trainingPartnerCode"": ""88878433B-01"",
                                    ""schemaLocation"": ""../../../../../../schema-validation/enrolment/v0.5.json"",
                                    ""schemaVersion"": ""TGS_v1.0""
                                  },
                                  ""payload"": {
                                    ""enrolment"": {
                                      ""action"": ""create"",
                                      ""trainingPartner"": {
                                        ""code"": ""88878433B-01"",
                                        ""uen"": ""88878433B""
                                      },
                                      ""course"": {
                                        ""referenceNumber"": ""TGS-0026008-ES"",
                                        ""run"": {
                                          ""id"": ""100261""
                                        }
                                      },
                                      ""trainee"": {
                                        ""id"": ""S0118316HX"",
                                        ""idType"": {
                                          ""type"": ""NRIC""
                                        },
                                        ""dateOfBirth"": ""1950-10-16"",
                                        ""fullName"": ""Jon Chua"",
                                        ""contactNumber"": {
                                          ""countryCode"": ""+65"",
                                          ""areaCode"": ""00"",
                                          ""phone"": ""88881234""
                                        },
                                        ""emailAddress"": ""abc @abc.com"",
                                        ""sponsorshipType"": ""EMPLOYER"",
                                        ""employer"": {
                                        ""uen"": ""G01234567S"",
                                        ""contact"": {
                                        ""fullName"": ""Stephen Chua"",
                                            ""contactNumber"": {
                                            ""countryCode"": ""+65"",
                                            ""areaCode"": ""00"",
                                             ""phoneNumber"": ""88881234""
                                            },
                                            ""emailAddress"": ""x @test.com""
                                          }
                                        },
                                        ""enrolmentDate"": ""2020-05-01"",
                                        ""fees"": {
                                          ""discountAmount"": ""50.00"",
                                          ""currencyType"": ""SGD""
                                        }
                                      }
                                    }
                                  },
                                  ""publicPayload"": {
                                    ""tags"": [ ""TBC"" ],
                                    ""source"": {
                                      ""dateTime"": ""2020-05-04 20:58:17"",
                                      ""timeStampInMilliSeconds"": ""1588597097880""
                                    },
                                    ""ack"": {
                                      ""dateTime"": ""-1"",
                                      ""timeStampInMilliSeconds"": ""-1""
                                    }
                                  },
                                  ""dltData"": {
                                    ""eventSource"": """",
                                    ""timeStamp"": """",
                                    ""validationResult"": """"
                                  }
                                }";

            var result = sqsclientObj.SendRequest(testData);

            //Assert
            Assert.IsTrue(result);
        }
    }
}