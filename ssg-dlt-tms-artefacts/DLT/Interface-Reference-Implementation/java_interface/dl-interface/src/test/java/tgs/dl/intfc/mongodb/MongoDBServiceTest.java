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

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.IOException;

import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import tgs.dl.intfc.mongodb.CollectionService;
import tgs.dl.intfc.mongodb.MongoDBClient;

public class MongoDBServiceTest {
	
	private CollectionService service;
	MongoDatabase db = null;
	private String organisationReferenceId, testJsonString = null;
	
	@BeforeEach
	public void setup() {
		this.db = MongoDBClient.getMongoClient().getDatabase("testDB");
		MongoCollection<Document> collection = db.getCollection("testCollection");
		service = new CollectionService(collection);
		
		organisationReferenceId = "REF0003";
		testJsonString = "{\"organisationReferenceId\":\""+organisationReferenceId+"\"}";
	}
	
	@AfterEach
	public void clear() {
		db.drop();
	}
	
	@Test
	public void testCreate() throws JsonProcessingException, IOException {
		boolean result = service.create(testJsonString);
		assertEquals(true, result);
	}
	
	@Test
	public void testGetByValue() throws JsonProcessingException, IOException {
		service.create(testJsonString);
		String result = service.getByFieldValue("organisationReferenceId", organisationReferenceId);
		assertThat(result).contains(organisationReferenceId);
	}
	
	@Test
	public void testUpdateByValue() throws JsonProcessingException, IOException {
		String newOrganisationReferenceId = "REF0004";
		String testJsonString = "{\"organisationReferenceId\":\""+newOrganisationReferenceId+"\"}";
		service.create(testJsonString);
		
		service.updateByFieldValue("organisationReferenceId", organisationReferenceId, testJsonString);
		String result = service.getByFieldValue("organisationReferenceId", newOrganisationReferenceId);
		assertThat(result).contains(newOrganisationReferenceId);
	}
}
