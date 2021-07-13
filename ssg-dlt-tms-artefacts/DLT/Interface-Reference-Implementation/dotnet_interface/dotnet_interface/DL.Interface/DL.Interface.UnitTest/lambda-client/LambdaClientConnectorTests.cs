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
using Newtonsoft.Json;

namespace DL.Interface.Unittest
{
    [TestClass()]
    public class LambdaClientConnectorTests
    {
        [TestMethod()]
        public void QueryRequestTest_InputStringEmpty_ReturnEmptyString()
        {
            //Arrange
            var lambdaclientObj = new LambdaClientConnector();

            //Act
            var result = lambdaclientObj.GetRequest(string.Empty);

            //Assert
            Assert.AreEqual(string.Empty, result);
        }

        [TestMethod()]
        public void QueryRequestTest_InputTestString()
        {
            //Arrange
            var lambdaclientObj = new LambdaClientConnector();
            DLTPayload dltPayload = new DLTPayload();
            var transObj = new TransactionHandler();

            //Act
            var testData = @"{
                                ""header"": {
                                ""eventType"": ""Enrolment"",
                                ""primaryKey"": ""80e00f124e8bd67257fd0291a8491c3b2ce3ee838ff9dafd91a841da0f7c329174eaaa0006e289e5536f46d0529be058"",
                                ""secondaryKey"": ""10026"",
                                ""tertiaryKey"": ""-1"",
                                ""pageNumber"": ""1""
                               }
                            }";
            RequestData request = JsonConvert.DeserializeObject<RequestData>(testData);
            dltPayload = transObj.generateDltPayload(Constants.TRIGGERTYPE.QUERY.ToString(), Constants.FUNCTIONS.readDataWithPartialKeyAndPagination.ToString(), request);
            string fabricRequest = JsonConvert.SerializeObject(dltPayload);
            var result = lambdaclientObj.GetRequest(fabricRequest);

            //Assert
            Assert.IsNotNull(result);
        }
    }
}