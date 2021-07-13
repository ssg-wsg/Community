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
using System.IO;

namespace DL.Interface.Unittest
{
    [TestClass()]
    public class SchemaValidationTests
    {

        [TestMethod()]
        public void ValidateWriteJsonTest_PrimaryKeyMismatchWithCourseRefAndTraineeId_ReturnFalse()
        {
            //Arrange
            var schemaValidationObj = new SchemaValidation();

            //Act
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/primaryKeyMismatch.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();
            }
            var result = schemaValidationObj.isWriteJsonValid(writeGrantsDataInput);

            //Assert
            Assert.IsFalse(result);
        }



        [TestMethod()]
        public void ValidateWriteJsonTest_SecondaryKeyMismatchWithCourseRunId_ReturnFalse()
        {
            //Arrange
            var schemaValidationObj = new SchemaValidation();

			//Act
			string writeGrantsDataInput;
			using (StreamReader r = new StreamReader("../../Test_Inputs/secondaryKeyMismatch.json"))
			{
				writeGrantsDataInput = r.ReadToEnd();
			}
			var result = schemaValidationObj.isWriteJsonValid(writeGrantsDataInput);

            //Assert
            Assert.IsFalse(result);
        }

        [TestMethod()]
        public void ValidateWriteJsonTest_ValidFields_ReturnTrue()
        {
            //Arrange
            var schemaValidationObj = new SchemaValidation();

			//Act
			string writeGrantsDataInput;
			using (StreamReader r = new StreamReader("../../Test_Inputs/writeTestDataInput.json"))
			{
				writeGrantsDataInput = r.ReadToEnd();
			}
			var result = schemaValidationObj.isWriteJsonValid(writeGrantsDataInput);

            //Assert
            Assert.IsTrue(result);
        }

        [TestMethod()]
        public void ValidateReadJsonTest_EventTypeMissing_ReturnFalse()
        {
            //Arrange
            var schemaValidationObj = new SchemaValidation();

            //Act
            string testData = @"{
                                    ""header"": {
                                    ""primaryKey"": ""TGS-0026008-ESS0118316H"",
                                    ""secondaryKey"": ""10026"",
                                    ""tertiaryKey"": ""-1"",
                                    ""pageNumber"": ""1""
                                  }
                                }";
            var result = schemaValidationObj.IsReadJsonValid(testData);

            //Assert
            Assert.IsFalse(result);
        }

        [TestMethod()]
        public void ValidateReadJsonTest_PrimaryKeyMissing_ReturnFalse()
        {
            //Arrange
            var schemaValidationObj = new SchemaValidation();

            //Act
            string testData = @"{
                                    ""header"": {
                                    ""eventType"": ""Enrolment"",
                                    ""secondaryKey"": ""10026"",
                                    ""tertiaryKey"": ""-1"",
                                    ""pageNumber"": ""1""
                                  }
                                }";
            var result = schemaValidationObj.IsReadJsonValid(testData);

            //Assert
            Assert.IsFalse(result);
        }


        [TestMethod()]
        public void ValidateReadJsonTest_SecondaryKeyMissing_ReturnFalse()
        {
            //Arrange
            var schemaValidationObj = new SchemaValidation();

            //Act
            string testData = @"{
                                    ""header"": {
                                    ""eventType"": ""Enrolment"",
                                    ""primaryKey"": ""TGS-0026008-ESS0118316H"",
                                    ""tertiaryKey"": ""-1"",
                                    ""pageNumber"": ""1""
                                  }
                                }";
            var result = schemaValidationObj.IsReadJsonValid(testData);

            //Assert
            Assert.IsFalse(result);
        }

        [TestMethod()]
        public void ValidateReadJsonTest_TertiaryKeyMissing_ReturnFalse()
        {
            //Arrange
            var schemaValidationObj = new SchemaValidation();

            //Act
            string testData = @"{
                                    ""header"": {
                                    ""eventType"": ""Enrolment"",
                                    ""primaryKey"": ""TGS-0026008-ESS0118316H"",
                                    ""secondaryKey"": ""10026"",
                                    ""pageNumber"": ""1""
                                  }
                                }";
            var result = schemaValidationObj.IsReadJsonValid(testData);

            //Assert
            Assert.IsFalse(result);
        }

        [TestMethod()]
        public void ValidateReadJsonTest_PageNumberMissing_ReturnFalse()
        {
            //Arrange
            var schemaValidationObj = new SchemaValidation();

            //Act
            string testData = @"{
                                    ""header"": {
                                    ""eventType"": ""Enrolment"",
                                    ""primaryKey"": ""TGS-0026008-ESS0118316H"",
                                    ""secondaryKey"": ""10026"",
                                    ""tertiaryKey"": ""-1""
                                  }
                                }";
            var result = schemaValidationObj.IsReadJsonValid(testData);

            //Assert
            Assert.IsFalse(result);
        }

        [TestMethod()]
        public void ValidateReadJsonTest_ValidFeilds_ReturnTrue()
        {
            //Arrange
            var schemaValidationObj = new SchemaValidation();

            //Act
            string testData = @"{
                                    ""header"": {
                                    ""eventType"": ""Enrolment"",
                                    ""primaryKey"": ""TGS-0026008-ESS0118316H"",
                                    ""secondaryKey"": ""10026"",
                                    ""tertiaryKey"": ""-1"",
                                    ""pageNumber"": ""1""
                                  }
                                }";
            var result = schemaValidationObj.IsReadJsonValid(testData);

            //Assert
            Assert.IsTrue(result);
        }
    }
}