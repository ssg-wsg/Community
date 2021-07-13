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

import static com.mongodb.client.model.Filters.eq;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bson.Document;
import org.bson.conversions.Bson;

import com.mongodb.BasicDBObject;
import com.mongodb.client.MongoCollection;

public class CollectionService {
	private static final Logger LOGGER = LogManager.getLogger(CollectionService.class);
	
	MongoCollection<Document> collection;
	
	public CollectionService(MongoCollection<Document> collection) {
		this.collection = collection; 
	}
	
	public String getByFieldValue(String field, String value){
		try {
			return collection.find(new BasicDBObject(field, value)).first().toJson();
		}catch(Exception e) {
			LOGGER.error("getByFieldValue : Value does not exist");
    	}
		return null;
	}
	
	public String updateByFieldValue(String field, String value, String jsonString){
		Bson filter = eq(field, value);
		try {
			return collection.findOneAndReplace(filter, Document.parse(jsonString)).toJson();
    	}catch(Exception e) {
    		LOGGER.error("getByFieldValue : ", e);
    	}
		return null;
	}

	public boolean create(String jsonString){
		boolean isCreated = false;
		try {
			Document document = Document.parse(jsonString); 
			collection.insertOne(document);
			isCreated = true;
		}
		catch(Exception e) {
			LOGGER.error("create : ", e);
		}
		return isCreated;
    }
}
