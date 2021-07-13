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
    public class GatewayTests
    {
        [TestMethod()]
        public void readGrantsDataDLTTest_InputStringEmpty_ReturnEmptyString()
        {
            //Arrange
            var gatewayObj = new Gateway();

            //Act
            var result = gatewayObj.readGrantsDataDLT(string.Empty);

            //Assert
            Assert.AreEqual(string.Empty, result);
        }

        [TestMethod()]
        public void readGrantsDataDLTTest_InputTestString()
        {
            //Arrange
            var gatewayObj = new Gateway();

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
            var result = gatewayObj.readGrantsDataDLT(testData);

            //Assert
            Assert.IsNotNull(result);
        }
    }
}

       
