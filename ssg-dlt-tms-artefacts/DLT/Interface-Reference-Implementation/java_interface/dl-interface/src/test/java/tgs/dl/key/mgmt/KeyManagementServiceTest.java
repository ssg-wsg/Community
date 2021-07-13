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

package tgs.dl.key.mgmt;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.UUID;

import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.amazonaws.services.secretsmanager.AWSSecretsManager;
import com.amazonaws.services.secretsmanager.model.DeleteSecretRequest;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

import tgs.dl.intfc.aws.AWSClient;
import tgs.dl.intfc.key.mgmt.KeyManagementService;
import tgs.dl.intfc.key.mgmt.SecretStorageService;
import tgs.dl.intfc.key.mgmt.model.KeyConfig;
import tgs.dl.intfc.key.mgmt.model.TrainingPartner;
import tgs.dl.intfc.mongodb.CollectionService;
import tgs.dl.intfc.mongodb.MongoDBClient;

public class KeyManagementServiceTest {
	private KeyManagementService keyMgmtService;
	MongoDatabase db = null;
			
	@BeforeEach
	public void setup() throws Exception{
		db = MongoDBClient.getMongoClient().getDatabase("testDB");
		MongoCollection<Document> collection = db.getCollection("testCollection");
		CollectionService collectionService = new CollectionService(collection);
		SecretStorageService secretsStorageService = new SecretStorageService();
		
		this.keyMgmtService = new KeyManagementService(collectionService, secretsStorageService);
	}
	
	@AfterEach
	public void clear() {
		db.drop();
	}

	@Test
	public void testGetKeyConfig() throws Exception {
		String tpUen = UUID.randomUUID().toString();
		String tpCode = tpUen + "-1";
		TrainingPartner tp = new TrainingPartner(tpUen, tpCode);
		
		KeyConfig config = keyMgmtService.getKeyConfig(tp);
		assertNotNull(config);
		
		deleteSecret(tpCode);
	}
	
	@Test
	public void testGetKeyConfigInvalidInput() throws Exception {
		TrainingPartner tp = new TrainingPartner(null, null);
		
		Exception exception = assertThrows(Exception.class, () -> {
			keyMgmtService.getKeyConfig(tp);
		});
		
		assertNotNull(exception.getMessage());
	}
	
	@Test
	public void testGetKeyConfigNullReferenceID() throws Exception {
		Exception exception = assertThrows(Exception.class, () -> {
			keyMgmtService.getKeyConfig(null);
		});
		
		assertNotNull(exception.getMessage());
	}
	
	@Test
	public void testGetDecryptedKey() throws Exception {
		String tpUen = UUID.randomUUID().toString();
		String tpCode = tpUen + "-1";
		TrainingPartner tp = new TrainingPartner(tpUen, tpCode);
		
		KeyConfig config = keyMgmtService.getKeyConfig(tp);
		String dataKey = config.getKey().getEncryptedKey();
		KeyConfig configForDecryption = keyMgmtService.getDecryptedKey(tp, dataKey);
		assertNotNull(configForDecryption);
		
		deleteSecret(tpCode);
	}
	
	@Test
	public void testGetDecryptedKeyNullInput() throws Exception {
		String tpUen = UUID.randomUUID().toString();
		String tpCode = tpUen + "-1";
		TrainingPartner tp = new TrainingPartner(tpUen, tpCode);
		
		Exception exception = assertThrows(Exception.class, () -> {
			keyMgmtService.getDecryptedKey(tp, null);
		});
		
		assertNotNull(exception.getMessage());
	}
	
	private void deleteSecret(String secretName) throws Exception {
		AWSSecretsManager client = new AWSClient().getSecretsMgrClient();
		DeleteSecretRequest deleteSecretRequest = new DeleteSecretRequest();
		deleteSecretRequest.setSecretId(secretName);
		client.deleteSecret(deleteSecretRequest);
	}
}
