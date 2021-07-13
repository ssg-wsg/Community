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

package tgs.dl.intfc.key.mgmt;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bson.Document;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import tgs.dl.intfc.constants.Constants;
import tgs.dl.intfc.mongodb.CollectionService;
import tgs.dl.intfc.mongodb.MongoDBClient;

public class OrgKeyCollection {
	private static final Logger LOGGER = LogManager.getLogger(OrgKeyCollection.class);
	protected static final String ORG_REFERENCE_FIELD = "tpCode";
	protected static final String ENCRYPTED_KEY_FIELD = "encryptedKey";
	
	protected static CollectionService getCollectionService() {
		try {
			final MongoDatabase db = MongoDBClient.getMongoClient().getDatabase(Constants.KEY_STORAGE.getKeyDB());
			final MongoCollection<Document> keyConfigCollection = db
					.getCollection(Constants.KEY_STORAGE.getKeyCollection());
			return new CollectionService(keyConfigCollection);
		} catch (Exception e) {
			LOGGER.error("getCollectionService : ", e);
			throw(e);
		}
	}
}
