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

using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using System.Security;

namespace DL.Interface
{
    public class KeyConfigModel
    {
        public ObjectId  Id { get; set; }
        [BsonElement("trainingPartnerUen")]
        public string trainingPartnerUen { get; set; }
        [BsonElement("trainingPartnerCode")]
        public string trainingPartnerCode { get; set; }
        [BsonElement("validUpTo")]
        public string validUpTo { get; set; }
        [BsonElement("plainKey")]
        public SecureString plainKey { get; set; }
        [BsonElement("encryptedKey")]
        public string encryptedKey { get; set; }
        [BsonElement("iv")]
        public string iv { get; set; }
        [BsonElement("numberOfBytes")]
        public string numberOfBytes { get; set; }
    }
}
