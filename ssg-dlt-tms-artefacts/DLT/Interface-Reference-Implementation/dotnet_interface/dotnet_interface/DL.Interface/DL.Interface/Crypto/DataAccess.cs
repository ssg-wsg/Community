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

using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Builders;
using System;
using NLog;

namespace DL.Interface
{

    public class DataAccess
    {
        //Parameters related to Mongo
        MongoClient mongoClient;
        MongoServer mongoServer;
        MongoDatabase mongoDb;


        //Logging the error in to a logger file
        private static Logger logObj = NLog.LogManager.GetCurrentClassLogger();

        //Key Management local DB Url function name
        private static string keyManagementlocalDBUrl;

        //Key Management local DB Databse function name
        private static string keyManagementlocalDatabase;

        //Key Management local DB collection function name
        private static string keyManagementlocalDBCollection;

        public DataAccess()
        {
            try
            {
                keyManagementlocalDBUrl = ExternalConfigurationParser.GetLocalDBUrlFunction();
                keyManagementlocalDatabase = ExternalConfigurationParser.GetLocalDBDatabaseFunction();
                keyManagementlocalDBCollection = ExternalConfigurationParser.GetLocalDBCollectionFunction();
                mongoClient = new MongoClient(keyManagementlocalDBUrl);
                mongoServer = mongoClient.GetServer();
                mongoDb = mongoServer.GetDatabase(keyManagementlocalDatabase);
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside DataAccess - InitializeClient() - MongoDB not started");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside DataAccess - InitializeClient() : {0} - MongoDB not started", e.Message);
                throw;
            }
        }

        public KeyConfigModel GetKey(string trainingPartnerCode)
        {
            try
            {
                var res = Query<KeyConfigModel>.EQ(p => p.trainingPartnerCode, trainingPartnerCode);
                return mongoDb.GetCollection<KeyConfigModel>(keyManagementlocalDBCollection).FindOne(res);
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside DataAccess - GetKey() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside DataAccess - GetKey() : {0}", e.Message);
                throw;
            }
        }

        public KeyConfigModel Create(KeyConfigModel p)
        {
            try
            {
                var doc = new BsonDocument
            {
                {"trainingPartnerCode", p.trainingPartnerCode},
                {"trainingPartnerUen", p.trainingPartnerUen},
                {"numberOfBytes", p.numberOfBytes},
                {"validUpTo", p.validUpTo},
                {"encryptedKey", p.encryptedKey}
            };
                mongoDb.GetCollection<KeyConfigModel>(keyManagementlocalDBCollection).Save(doc);
                return p;
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside DataAccess - Create() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside DataAccess - Create() : {0}", e.Message);
                throw;
            }
        }

        public void Update(string trainingPartnerCode, KeyConfigModel _keyConfigModel)
        {
            try
            {
                var res = Query<KeyConfigModel>.EQ(pd => pd.trainingPartnerCode, trainingPartnerCode);
                var operation = Update<KeyConfigModel>.
                    Set(s => s.encryptedKey, _keyConfigModel.encryptedKey.ToString()).
                    Set(s => s.validUpTo, _keyConfigModel.validUpTo.ToString());
                mongoDb.GetCollection<KeyConfigModel>(keyManagementlocalDBCollection).Update(res, operation);
            }
            catch (Exception e)
            {
                logObj.Error(e.StackTrace, "Inside DataAccess - Update() ");
                // Extract some information from this exception, and then 
                // throw it to the parent method.
                if (e.Source != null)
                    Console.WriteLine("Inside DataAccess - Update() : {0}", e.Message);
                throw;
            }
        }
    }
}