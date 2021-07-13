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
using System.IO;

namespace DL.Interface.Unittest
{
    [TestClass()]
    public class CryptoManagerTests
    {
        [TestMethod()]
        public void inputFormatterTest_InputStringEmpty_ReturnExpectedException()
        {
            //Arrange
            var cryptoManagerObj = new CryptoManager();
            Exception expectedExcetpion = null;

            //Act
            try
            {
                var result = cryptoManagerObj.inputFormatter(string.Empty);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            //Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        [TestMethod()]
        public void inputFormatterTest_InputTestString()
        {
            //Arrange
            var cryptoManagerObj = new CryptoManager();

            //Act
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/writeTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();
            }
            var result = cryptoManagerObj.inputFormatter(writeGrantsDataInput);

            //Assert
            Assert.IsNotNull(result);
        }

        [TestMethod()]
        public void headerHashingTest_InputStringEmpty_ReturnReturnExpectedException()
        {
            //Arrange
            var cryptoManagerObj = new CryptoManager();
            Exception expectedExcetpion = null;

            //Act
            try
            {
                var result = cryptoManagerObj.headerHashing(string.Empty);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            //Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        [TestMethod()]
        public void headerHashingTest_InputTestString()
        {
            //Arrange
            var cryptoManagerObj = new CryptoManager();

            //Act
            string testData = @"{'header':{
                                'eventType': 'Attendance',
                                'primaryKey1': 'COURSE-1911BRA-123',
                                'primaryKey2': 'S123455',
                                'secondaryKey': '41618',
                                'tertiaryKey': 'CRS-N-0041336-144-S1',
                                'pageNumber': '1'
                                }}";
            var result = cryptoManagerObj.headerHashing(testData);

            //Assert
            Assert.IsNotNull(result);
        }

        [TestMethod()]
        public void dataEncryptionTest_InputStringEmpty_ReturnExpectedException()
        {
            //Arrange
            var cryptoManagerObj = new CryptoManager();
            Exception expectedExcetpion = null;

            //Act
            try
            {
                var result = cryptoManagerObj.dataEncryption(string.Empty);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            //Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        [TestMethod()]
        public void dataEncryptionTest_InputTestString()
        {
            //Arrange
            var cryptoManagerObj = new CryptoManager();

            //Act
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/writeTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();
            }

            var result = cryptoManagerObj.dataEncryption(writeGrantsDataInput);

            //Assert
            Assert.IsNotNull(result);
        }

        [TestMethod()]
        public void dataDecryptionTest_InputStringEmpty_ReturnExpectedException()
        {
            //Arrange
            var cryptoManagerObj = new CryptoManager();
            Exception expectedExcetpion = null;

            //Act
            try
            {
                var result = cryptoManagerObj.dataDecryption(string.Empty);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }
        }

    }
}
   