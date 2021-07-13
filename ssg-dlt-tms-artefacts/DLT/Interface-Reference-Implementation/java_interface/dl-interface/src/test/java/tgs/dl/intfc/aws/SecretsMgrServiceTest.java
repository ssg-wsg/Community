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

package tgs.dl.intfc.aws;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.nio.CharBuffer;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.amazonaws.services.secretsmanager.AWSSecretsManager;
import com.amazonaws.services.secretsmanager.model.DeleteSecretRequest;
import com.fasterxml.jackson.core.JsonProcessingException;

import tgs.dl.intfc.aws.AWSClient;
import tgs.dl.intfc.aws.SecretsMgrService;
import tgs.dl.intfc.config.model.SecretKVPair;
import tgs.dl.intfc.utils.JsonMapper;

public class SecretsMgrServiceTest {
	
	private SecretsMgrService service;
	private final String ENCODING_TYPE = "Base64";

	@BeforeEach
	public void setup() throws Exception {
		service = new SecretsMgrService(new AWSClient().getSecretsMgrClient());
	}

	@Test
	public void testCreateSecret() throws Exception{
		String secretName = UUID.randomUUID().toString(); 
		String plainKey = "3d5ZXpAvLi1NvtlRuwRamPRcMac8XoIX=";
		
		boolean result = service.createSecret(secretName, convertToKeyPairString(plainKey.toCharArray()));
		assertEquals(true, result);

		deleteSecret(secretName);
	}

	@Test
	public void testUpdateSecret() throws Exception {
		String secretName = UUID.randomUUID().toString();
		String plainKey = "3d5ZXpAvLi1NvtlRuwRamPRcMac8XoIX=";
		
		service.createSecret(secretName, convertToKeyPairString(plainKey.toCharArray()));
		
		plainKey = "uIWP2c0XNX2zqedYPHV7iDasoBjbkMeUCXvz5AYMzJw=";
		
		boolean result = service.updateSecret(secretName, convertToKeyPairString(plainKey.toCharArray()));
		assertEquals(true, result);
		
		deleteSecret(secretName);
	}

	@Test
	public void testGetSecret() throws Exception {
		String secretName = UUID.randomUUID().toString();		 
		String plainKey = "4d4ZXpAvLi1NvtlRuwRamPRcMac8XoIX=";
		
		char[] plainKeyChar = plainKey.toCharArray();
 		
		service.createSecret(secretName, convertToKeyPairString(plainKeyChar));	
		
		SecretKVPair secretKeyResult = service.getSecret(secretName);
		
		assertEquals(CharBuffer.wrap(plainKeyChar), CharBuffer.wrap(secretKeyResult.getPlainDataKey()));
		
		deleteSecret(secretName);
	}
	
	private void deleteSecret(String secretName) throws Exception {
		AWSSecretsManager client = new AWSClient().getSecretsMgrClient();
		DeleteSecretRequest deleteSecretRequest = new DeleteSecretRequest();
		deleteSecretRequest.setSecretId(secretName);
		client.deleteSecret(deleteSecretRequest);
	}
	
	private String convertToKeyPairString(char[] secretKey) throws JsonProcessingException {
		SecretKVPair kvPair = new SecretKVPair(secretKey, ENCODING_TYPE);
		JsonMapper mapper = new JsonMapper();
		return mapper.serializeToJson(kvPair);
	}
}