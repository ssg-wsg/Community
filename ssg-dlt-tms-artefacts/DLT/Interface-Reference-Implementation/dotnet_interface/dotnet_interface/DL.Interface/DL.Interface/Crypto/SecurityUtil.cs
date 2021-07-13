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
using System.Runtime.InteropServices;
using System.Security;
using NLog;

namespace DL.Interface
{
    public class SecurityUtil
    {
        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        //Function for converting string in to Secure String
        public SecureString ConvertToSecureString(string inputString)
        {
            try
            {
                var securePassword = new SecureString();
                foreach (char c in inputString)
                    securePassword.AppendChar(c);

                securePassword.MakeReadOnly();
                return securePassword;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside SecurityUtil - ConvertToSecureString()");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside SecurityUtil - ConvertToSecureString() : {0}", e.Message);
                throw;
            }
        }

        //Function for converting Secure String back to string
        public string ConvertFromSecureString(SecureString value)
        {
            IntPtr valuePtr = IntPtr.Zero;
            try
            {
                valuePtr = Marshal.SecureStringToGlobalAllocUnicode(value);
                return Marshal.PtrToStringUni(valuePtr);
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside SecurityUtil - ConvertFromSecureString()");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside SecurityUtil - ConvertFromSecureString() : {0}", e.Message);
                throw;
            }
            finally
            {
                Marshal.ZeroFreeGlobalAllocUnicode(valuePtr);
            }

        }
    }
}
