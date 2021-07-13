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
using System;

namespace DL.Interface.Unittest
{
    [TestClass()]
    public class HashingUtilTests
    {
        [TestMethod()]
        public void computeSHA3384HashTest_InputStringEmpty_ReturnExpectedException()
        {
            //Arrange
            var utilObj = new HashingUtil();
            Exception expectedExcetpion = null;

            //Act
            try
            {
                var result = utilObj.computeSHA3384Hash(string.Empty);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            //Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        [TestMethod()]
        public void computeSHA3384HashTest_TestString_ReturnTestStringHash()
        {
            //Arrange
            var utilObj = new HashingUtil();

            //Act
            var result = utilObj.computeSHA3384Hash("Test");

            //Assert
            Assert.AreEqual("da73bfcba560692a019f52c37de4d5e3ab49ca39c6a75594e3c39d805388c4de9d0ff3927eb9e197536f5b0b3a515f0a", result);
        }
    }
}