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

namespace DL.Interface.FuncTest
{
    [TestClass()]
    public class GatewayFunctionalTests
    {
        Gateway gateway = new Gateway();

        /// <summary>
        /// Write valid enrolment input data to DLT
        /// </summary>
        [TestMethod()]
        public void TC_01WritetoDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc01_writeTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            Exception expectedExcetpion = null;

            // Act
            try
            {
                gateway.writeGrantsDataDLT(writeGrantsDataInput);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            // Assert
            Assert.IsNull(expectedExcetpion);
        }

        /// <summary>
        /// Write invalid enrolment input data to DLT; Invalid header with missing primary key and empty value for eventType
        /// </summary>
        [TestMethod()]
        public void TC_02WritetoDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc02_writeTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            Exception expectedExcetpion = null;

            // Act
            try
            {
                gateway.writeGrantsDataDLT(writeGrantsDataInput);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            // Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        /// <summary>
        /// Write invalid enrolment input data to DLT; Invalid header with missing secondary key
        /// </summary>
        [TestMethod()]
        public void TC_03WritetoDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc03_writeTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            Exception expectedExcetpion = null;

            // Act
            try
            {
                gateway.writeGrantsDataDLT(writeGrantsDataInput);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            // Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        /// <summary>
        /// Write invalid enrolment input data to DLT; Invalid header with missing training partner code and uen
        /// </summary>
        [TestMethod()]
        public void TC_04WritetoDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc04_writeTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            Exception expectedExcetpion = null;

            // Act
            try
            {
                gateway.writeGrantsDataDLT(writeGrantsDataInput);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            // Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        /// <summary>
        /// Write invalid enrolment input data to DLT; Invalid header with wrong format of training partner code
        /// </summary>
        [TestMethod()]
        public void TC_05WritetoDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc05_writeTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            Exception expectedExcetpion = null;

            // Act
            try
            {
                gateway.writeGrantsDataDLT(writeGrantsDataInput);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            // Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        /// <summary>
        /// Write invalid enrolment input data to DLT; Invalid header with mismatch of training partner code and uen
        /// </summary>
        [TestMethod()]
        public void TC_06WritetoDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc06_writeTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            Exception expectedExcetpion = null;

            // Act
            try
            {
                gateway.writeGrantsDataDLT(writeGrantsDataInput);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            // Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        /// <summary>
        /// Write invalid enrolment input data to DLT; Invalid payload with missing trainee JSON and trainee email address
        /// </summary>
        [TestMethod()]
        public void TC_07WritetoDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc07_writeTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            Exception expectedExcetpion = null;

            // Act
            try
            {
                gateway.writeGrantsDataDLT(writeGrantsDataInput);
            }
            catch (Exception ex)
            {
                expectedExcetpion = ex;
            }

            // Assert
            Assert.IsNotNull(expectedExcetpion);
        }

        /// <summary>
        /// Read valid enrolment data from DLT;
        /// </summary>
        [TestMethod()]
        public void TC_08ReadFromDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc08_readTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            string response = gateway.readGrantsDataDLT(writeGrantsDataInput);
            Assert.IsNotNull(response);
        }

        /// <summary>
        /// Invalid request format ; Query the DLT with missing eventType field
        /// </summary>
        [TestMethod()]
        public void TC_09ReadFromDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc09_readTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
     
            String rxResponse;
            String response = String.Empty;

            // Act
            rxResponse = gateway.readGrantsDataDLT(writeGrantsDataInput);

            Assert.AreEqual(rxResponse, response);
        }

        /// <summary>
        /// Invalid request format ; Query the DLT with missing primaryKey field
        /// </summary>
        [TestMethod()]
        public void TC_10ReadFromDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc10_readTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            String rxResponse;
            String response = String.Empty;

            // Act
            rxResponse = gateway.readGrantsDataDLT(writeGrantsDataInput);


            Assert.AreEqual(rxResponse, response);
        }

        /// <summary>
        /// Invalid request format ; Query the DLT with missing secondaryKey field
        /// </summary>
        [TestMethod()]
        public void TC_11ReadFromDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc11_readTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            String rxResponse;
            String response = String.Empty;

            // Act
            rxResponse = gateway.readGrantsDataDLT(writeGrantsDataInput);


            Assert.AreEqual(rxResponse, response);
        }


        /// <summary>
        /// Invalid request format ; Query the DLT with missing tertiaryKey field
        /// </summary>
        [TestMethod()]
        public void TC_12ReadFromDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc12_readTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }
            String rxResponse;
            String response = String.Empty;

            // Act
            rxResponse = gateway.readGrantsDataDLT(writeGrantsDataInput);


            Assert.AreEqual(rxResponse, response);
        }


        /// <summary>
        /// Invalid request format ; Query the DLT with missing pageNumber field
        /// </summary>
        [TestMethod()]
        public void TC_13ReadFromDLT()
        {
            // Arrange
            string writeGrantsDataInput;
            using (StreamReader r = new StreamReader("../../Test_Inputs/tc13_readTestDataInput.json"))
            {
                writeGrantsDataInput = r.ReadToEnd();

            }

            String rxResponse;
            String response = String.Empty;

            // Act
            rxResponse = gateway.readGrantsDataDLT(writeGrantsDataInput);


            Assert.AreEqual(rxResponse, response);
        }
    }
}