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
    public class CryptoUtilTests
    {
		[TestMethod()]
		public void encryptStringTest_InputDataKeyEmpty_ReturnExpectedException()
		{
			//Arrange
			var cryptoUtilObj = new CryptoUtil();
			var keyConfigObj = new KeyConfigModel();
			var securityUtilObj = new SecurityUtil();
			Exception expectedExcetpion = null;

			//Act
			try
			{
				keyConfigObj.plainKey = securityUtilObj.ConvertToSecureString(string.Empty);
				string testInput = @"{""test"": ""John""}";
				var result = cryptoUtilObj.EncryptString(keyConfigObj, testInput);
			}
			catch (Exception ex)
			{
				expectedExcetpion = ex;
			}

			//Assert
			Assert.IsNotNull(expectedExcetpion);
		}

		[TestMethod()]
		public void encryptStringTest_InputPlainKeyEmpty_ReturnExceptedException()
		{
			//Arrange
			var cryptoUtilObj = new CryptoUtil();
			var keyConfigObj = new KeyConfigModel();
			Exception expectedExcetpion = null;
			var securityUtilObj = new SecurityUtil();

			//Act
			try
			{
				keyConfigObj.plainKey = securityUtilObj.ConvertToSecureString("test");
				var result = cryptoUtilObj.EncryptString(keyConfigObj, string.Empty);
			}
			catch (Exception ex)
			{
				expectedExcetpion = ex;
			}

			//Assert
			Assert.IsNotNull(expectedExcetpion);
		}

		[TestMethod()]
		public void encryptStringTest_InputTestString()
		{
			//Arrange
			var cryptoUtilObj = new CryptoUtil();
			var keyConfigObj = new KeyConfigModel();
			var securityUtilObj = new SecurityUtil();

			//Act
			keyConfigObj.plainKey = securityUtilObj.ConvertToSecureString("Sll3b2RGU3VFMTJ4RHh2ZlJzclVkWGFRamFvUkY2Zkk=");
			string testInput = @"{""test"": ""John""}";
			var result = cryptoUtilObj.EncryptString(keyConfigObj, testInput);

			//Assert
			Assert.IsNotNull(result);
		}

		[TestMethod()]
		public void decryptStringTest_InputDataKeyEmpty_ReturnExpectedException()
		{
			//Arrange
			var cryptoUtilObj = new CryptoUtil();
			Exception expectedExcetpion = null;

			//Act
			try
			{
				var result = cryptoUtilObj.DecryptString("nKSa3I02yMcSATR4hicBr5CIqyZtojni", string.Empty, string.Empty);
			}
			catch (Exception ex)
			{
				expectedExcetpion = ex;
			}

			//Assert
			Assert.IsNotNull(expectedExcetpion);
		}

		[TestMethod()]
		public void decryptstringtest_inputplainkeyempty_returnExpectedException()
		{
			//Arrange
			var cryptoUtilObj = new CryptoUtil();
			Exception expectedExcetpion = null;

			//Act
			try
			{
				var result = cryptoUtilObj.DecryptString("test", string.Empty, string.Empty);
			}
			catch (Exception ex)
			{
				expectedExcetpion = ex;
			}

			//Assert
			Assert.IsNotNull(expectedExcetpion);
		}

		[TestMethod()]
		public void decryptStringTest_InputTestString()
		{
			//Arrange
			var cryptoUtilObj = new CryptoUtil();

			//Act
			var result = cryptoUtilObj.DecryptString("TExrb1F0M1R4MjNQNkpHSlNGVjN2WXhiN3FNVnE1M3U=", "pPGNov4YeVIL8ha8Wqf+1maTzHxBsyaQJ6tMLBs7lZq1h/zwtZSK3OsBCmxAdrIVvNgbFE6X9Lq6h+cXrFZGG/6VQvUFd1dUODOBlxKS5l1ulsYWrCc6oagqti3vDy2KJBUu8epaboVb+kf80bjPXOfZ+yLSjuHOtH6/d0jMWCf4kOU511v0IslOA/4OSElfB3ZBB3EvyEdFYyaxbif89xeHY/CaUEvcIUOz7xIMxxoPi/OJW+QlsOF64U3AzCmNQ+B2cdeLZ/ndFh/Y6IPelWf4vhE382TxWWAo3z+dwvqs0DSp9iVnwt2RLFSDWjqpxLNJjC26FuO5p6WkzHTJl1fV6KohxVi5MXPDLKeLqWoOLGq3mcymRv9RSq1rkE/BwJVL+SMSGuT8z5LfShx25CThtQCpLbg4/eOaVoRBfXm21Sfv1j7MfSpMCKHGcAHf42/crLuaSMILwc17DUbvID9U/EQtUwWsMHSlx7WTFWmuYBkh8SxzRXZtGALL3J01Baa0e3ksQOZjERZGo5rZnlmfEcaNgUU8ywhe+beIDXhR/iDHDiP2RulFgtXgfjWslWeu08obpLNNFwsq3Bqypb5HLaMiEWX20XrjHaFLEYqrGDEVFhERrmxmyuIpAZZi", "Gjffa4WLHU+lfgEgnPD3zA==");

			//Assert
			Assert.IsNotNull(result);
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
	}
}