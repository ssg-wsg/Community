using System;
using System.Collections.Specialized;
using System.Configuration;
using NLog;

namespace DLTInterfaceTest
{
    // Internal Configuration Parser : to parse configuration inside App.Config
    public static class ConfigurationParser
    {
        public static AWSConfigurationModel getAWSConfigs() {
            try { 
                AWSConfigurationSection awsCredsSection = ConfigurationManager.GetSection(Constants.AWS_CREDS_SECTION) as AWSConfigurationSection;

                AWSConfigurationModel awsCreds = awsCredsSection.getConfigurationObject();

                if (awsCreds==null)
                 {
                     Console.WriteLine("AWS Configs are not defined");
                 }
                else
                 {
                     Console.WriteLine("AWS Creds " +awsCreds.AWSAccessKey+" ----- " +awsCreds.AWSRegion+" ---- "+awsCreds.AWSSecretKey);
                 }
                return awsCreds;
            }
            catch (Exception e)
            {
                //Logging the error in to a logger file
                Logger logObj = NLog.LogManager.GetCurrentClassLogger();
                logObj.Error(e.StackTrace, "Inside ConfigurationParser - getAWSConfigs");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside ConfigurationParser - getAWSConfigs : {0}", e.Message);
                throw;
            }



        }

    }
}
