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
using System.Text;
using NLog;

namespace DL.Interface
{
    public class HashingUtil
    {
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();
        /// <summary>
        /// Method declaration for sample clculation of SHA3-384 Hash
        /// </summary>
        /// <param name="rawData"></param>
        /// <returns>Hash String</returns>
        public string computeSHA3384Hash(string rawData)
        {
            try
            {
                if (rawData != string.Empty)
                {
                    var hashAlgorithm = new Org.BouncyCastle.Crypto.Digests.Sha3Digest(384);
                    byte[] input = Encoding.ASCII.GetBytes(rawData);
                    hashAlgorithm.BlockUpdate(input, 0, input.Length);
                    byte[] result = new byte[48]; // 512 / 8 = 64
                    hashAlgorithm.DoFinal(result, 0);
                    string hashString = BitConverter.ToString(result);
                    hashString = hashString.Replace("-", "").ToLowerInvariant();
                    return hashString;
                }
                else
                {
                    logObj.Error("Inside HashingUtil - computeSHA3384Hash - Invalid input data");
                    // throw exception when schema and input validation fails
                    throw new IOException("Invalid input data");
                }
            }
            catch (Exception e)
            {
                //Logging the error in to a logger file
                logObj.Error(e.StackTrace, "Inside utility class - computeSHA3384Hash");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside utility class - computeSHA3384Hash : {0}", e.Message);
                throw;
            }
        }
    }
}



