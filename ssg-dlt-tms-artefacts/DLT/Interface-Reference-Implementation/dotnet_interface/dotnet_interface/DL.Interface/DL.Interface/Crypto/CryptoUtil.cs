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

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.IO;
using NLog;
using System.Text;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.Crypto.Modes;
using Org.BouncyCastle.Crypto.Paddings;
using Org.BouncyCastle.Crypto.Parameters;

namespace DL.Interface
{
    public class CryptoUtil
    {
        private static SecurityUtil securityUtilObj = new SecurityUtil();
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();
        public  string EncryptString(KeyConfigModel keyConfigObj, string dataToEncrypt)
        {
            try
            {
                string dataKey = securityUtilObj.ConvertFromSecureString(keyConfigObj.plainKey);
                Guid newGuId = Guid.NewGuid();
                string guidString = Convert.ToBase64String(newGuId.ToByteArray());
                keyConfigObj.iv = guidString;
                JObject json = JObject.Parse(dataToEncrypt);
                dataToEncrypt = JsonConvert.SerializeObject(json);
                byte[] inputBytes = Encoding.UTF8.GetBytes(dataToEncrypt);
                if (dataKey != string.Empty && dataToEncrypt != string.Empty)
                {
                    //Set up
                    AesEngine engine = new AesEngine();
                    CbcBlockCipher blockCipher = new CbcBlockCipher(engine); //CBC
                    PaddedBufferedBlockCipher cipher = new PaddedBufferedBlockCipher(new CbcBlockCipher(engine), new Pkcs7Padding());
                    KeyParameter keyParam = new KeyParameter(Convert.FromBase64String(dataKey));
                    ParametersWithIV keyParamWithIV = new ParametersWithIV(keyParam, Convert.FromBase64String(guidString));

                    // Encrypt
                    cipher.Init(true, keyParamWithIV);
                    byte[] outputBytes = new byte[cipher.GetOutputSize(inputBytes.Length)];
                    int length = cipher.ProcessBytes(inputBytes, outputBytes, 0);
                    cipher.DoFinal(outputBytes, length); //Do the final block
                    return Convert.ToBase64String(outputBytes);
                }
                else
                {
                    logObj.Error("inside cryptoutil - encryptstring - invalid input data");
                    // throw exception when schema and input validation fails
                    throw new IOException("invalid input data");
                }

            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside CryptoUtil - EncryptString() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside CryptoUtil - EncryptString() : {0}", e.Message);
                throw;
            }
        }

        public dynamic DecryptString(string dataKey, string cipherText, string iv)
        {
            try
            {
                if (dataKey != string.Empty && cipherText != string.Empty)
                {
                    byte[] buffer = Convert.FromBase64String(cipherText);

                    //Set up
                    AesEngine engine = new AesEngine();
                    CbcBlockCipher blockCipher = new CbcBlockCipher(engine); //CBC
                    PaddedBufferedBlockCipher cipher = new PaddedBufferedBlockCipher(new CbcBlockCipher(engine), new Pkcs7Padding());
                    KeyParameter keyParam = new KeyParameter(Convert.FromBase64String(dataKey));
                    ParametersWithIV keyParamWithIV = new ParametersWithIV(keyParam, Convert.FromBase64String(iv));

                    //Decrypt            
                    byte[] outputBytes = Convert.FromBase64String(cipherText);
                    cipher.Init(false, keyParamWithIV);
                    byte[] comparisonBytes = new byte[cipher.GetOutputSize(outputBytes.Length)];
                    int length = cipher.ProcessBytes(outputBytes, comparisonBytes, 0);
                    cipher.DoFinal(comparisonBytes, length); //Do the final block
                    var jsonSerializer = new JsonSerializer();
                    dynamic jsonResponse = JsonConvert.DeserializeObject(System.Text.Encoding.UTF8.GetString(comparisonBytes, 0, comparisonBytes.Length));
                    return jsonResponse;
                }
                else
                {
                    logObj.Error("Inside CryptoUtil - DecryptString - Invalid input data");
                    // throw exception when schema and input validation fails
                    throw new IOException("Invalid input data");
                }
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside CryptoUtil - DecryptString() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside CryptoUtil - DecryptString() : {0}", e.Message);
                throw;
            }
}
    }
}

