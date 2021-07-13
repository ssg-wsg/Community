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

package tgs.dl.intfc.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;

import tgs.dl.intfc.utils.EncryptionUtil;
import tgs.dl.intfc.utils.JsonMapper;
import tgs.dl.test.util.TestUtils;

public class EncryptionUtilTest {
	private final TestUtils UTIL = TestUtils.getInstance();
	private final EncryptionUtil encryptionService =  new EncryptionUtil();
	private String payload = null;
	private String dataKey = null;
	
	@BeforeEach
	public void setData() {
		payload = "{\"sample\": \"test\"}";
		//dataKey = "mBz5YlvXI6oYbAyWhg6r2YSxDaQfbsVD";
		//dataKey = "3d5ZXpAvLi1NvtlRuwRamPRcMac8XoIX";
		//dataKey = "1ztxzmBgHNwlJsnUjdalKVtoxbwKDNCK";
		dataKey = "QksJRJ19dKtJ1nnkPrGGnxncHJfw3GWLAJwy/Wj5M/I=";
	}
	
	@Test
	public void testEncryption() throws Exception {
		String writeTestFile = "unit_test/json/encryption_util_write_test.json.json";
		String writeRequest = UTIL.readFile(writeTestFile);
		
		JsonMapper mapper =  new JsonMapper();
	    JsonNode jsonMessage = mapper.deserializeFromJson(writeRequest, JsonNode.class);
	    writeRequest = mapper.serializeToJson(jsonMessage);
		
		byte[] generatedIV = encryptionService.generateRandomIV();
			
		String encryptedMessage = encryptionService.encryptMessage(dataKey.toCharArray(), payload, generatedIV);
		System.out.println("encryptedMessage : "+encryptedMessage);
		assertNotNull(encryptedMessage);
	}
	
	@Test
	public void testDecryption() throws Exception  {
		
		String writeTestFile = "unit_test/json/encryption_util_write_test.json.json";
		String writeRequest = UTIL.readFile(writeTestFile);
		
		JsonMapper mapper =  new JsonMapper();
	    JsonNode jsonMessage = mapper.deserializeFromJson(writeRequest, JsonNode.class);
	    writeRequest = mapper.serializeToJson(jsonMessage);
		
	    String iv = "Tz9q0PG630ueaH5Txf1mWQ==";
		byte[] generatedIV = Base64.getDecoder().decode(iv);
		System.out.println("generatedIV : "+generatedIV);
		
		String encryptedMessage = encryptionService.encryptMessage(dataKey.toCharArray(), writeRequest, generatedIV);
		System.out.println("encryptedMessage : "+encryptedMessage);
		String decryptedMessage = encryptionService.decryptMessage(dataKey.toCharArray(), encryptedMessage, generatedIV);
		System.out.println("decryptedMessage : "+decryptedMessage);
		
		
		assertNotNull(decryptedMessage);
		assertEquals(writeRequest, decryptedMessage);
	}
}
