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

package tgs.dl.intfc.mongodb;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.MongoException;

import tgs.dl.intfc.constants.Constants;

public class MongoDBClient {
	private static final Logger LOGGER = LogManager.getLogger(MongoDBClient.class);

	private static MongoClient mongoClient;

	public static MongoClient getMongoClient() {
		if (mongoClient == null) {
			try {
				mongoClient = new MongoClient(new MongoClientURI(Constants.KEY_STORAGE.getUri()));
			} catch (MongoException e) {
				LOGGER.error("getMongoClient : ", e);
				throw (e);
			}
		}
		return mongoClient;
	}
}
