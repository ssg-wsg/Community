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

using NLog;
using System;
using System.Configuration;
using System.IO;


namespace DL.Interface
{
    /// <summary>
    /// LoadConfigs class is used to load the external User.config file in order to retreive the configurations stored in it
    /// </summary>
    public class LoadConfigs
    {

        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();
        //Load user configurations form external file
        public static AppSettingsSection LoadUserConfigs()
        {
            AppSettingsSection userConfigs = null ;
            try
            {
                
                //To fetch file from the relative path : main parent directory of the project
                var filePath = Directory.GetParent(Directory.GetCurrentDirectory()).Parent.Parent.Parent.FullName +Constants.CONFIG_FILE;
                logObj.Info("DLT Interface Version: {0}", Constants.DLT_INT_VER);
                logObj.Info("Inside LoadUserConfigs () : Location of the User Configuration File Path : {0}", filePath);

                ExeConfigurationFileMap fileMap = new ExeConfigurationFileMap { ExeConfigFilename = filePath };
                Configuration configuration = ConfigurationManager.OpenMappedExeConfiguration(fileMap, ConfigurationUserLevel.None);
                userConfigs = configuration.AppSettings;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - LoadUserConfigs() : User Configuration File Not Found ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - LoadUserConfigs() : User Configuration File Not Found : {0}", e.Message);
                throw;
            }
            return userConfigs;
        }

        public static AppSettingsSection LoadSectionConfigs(string sectionName)
        {
            AppSettingsSection appSettingSection = null;
            try
            {
                //To fetch file from the relative path : main parent directory of the project
                var filePath = Directory.GetParent(Directory.GetCurrentDirectory()).Parent.Parent.Parent.FullName + Constants.CONFIG_FILE;

                ExeConfigurationFileMap fileMap = new ExeConfigurationFileMap { ExeConfigFilename = filePath };
                Configuration configuration = ConfigurationManager.OpenMappedExeConfiguration(fileMap, ConfigurationUserLevel.None);
                appSettingSection = (AppSettingsSection)configuration.GetSection(sectionName);
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside ExternalConfigurationParser - LoadUserConfigs() : User Configuration File Not Found ");
                //Extract some information from this exception, and then
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ExternalConfigurationParser - LoadUserConfigs() : User Configuration File Not Found : {0}", e.Message);
                throw;
            }
            return appSettingSection;
        }
    }
}
