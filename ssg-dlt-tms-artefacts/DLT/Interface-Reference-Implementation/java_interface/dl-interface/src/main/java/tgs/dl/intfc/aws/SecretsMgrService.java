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

import java.io.IOException;
import java.io.UnsupportedEncodingException;

import org.apache.http.HttpStatus;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.amazonaws.services.acmpca.model.InvalidRequestException;
import com.amazonaws.services.applicationdiscovery.model.InvalidParameterException;
import com.amazonaws.services.datapipeline.model.InternalServiceErrorException;
import com.amazonaws.services.secretsmanager.AWSSecretsManager;
import com.amazonaws.services.secretsmanager.model.CreateSecretRequest;
import com.amazonaws.services.secretsmanager.model.CreateSecretResult;
import com.amazonaws.services.secretsmanager.model.DecryptionFailureException;
import com.amazonaws.services.secretsmanager.model.GetSecretValueRequest;
import com.amazonaws.services.secretsmanager.model.GetSecretValueResult;
import com.amazonaws.services.secretsmanager.model.UpdateSecretRequest;
import com.amazonaws.services.secretsmanager.model.UpdateSecretResult;

import tgs.dl.intfc.config.model.SecretKVPair;
import tgs.dl.intfc.utils.JsonMapper;

public class SecretsMgrService {
	private static final Logger LOGGER = LogManager.getLogger(SecretsMgrService.class);

	private final AWSSecretsManager client;

	public SecretsMgrService(AWSSecretsManager client) {
		this.client = client;
	}

	/***
	 * Create Secret in Secrets Manager
	 * @param secretName
	 * @param secretKey
	 * @return
	 */
	public boolean createSecret(String secretName, String secretKey){
		try {
			
			CreateSecretRequest createSecretRequest = new CreateSecretRequest().withName(secretName)
					.withSecretString(secretKey);
			CreateSecretResult result = client.createSecret(createSecretRequest);
			
			LOGGER.trace("createSecret : CreateSecretResult : status code :  {}", result.getSdkHttpMetadata().getHttpStatusCode());
			
			return HttpStatus.SC_OK == result.getSdkHttpMetadata().getHttpStatusCode();
		}  catch (Exception e) {
			LOGGER.error("createSecret : ", e);
		}
		return false;
	}

	public boolean updateSecret(String secretName, String secretKey){
		try {

			UpdateSecretRequest updateSecretRequest = new UpdateSecretRequest().withSecretId(secretName)
					.withSecretString(secretKey);
			UpdateSecretResult result = client.updateSecret(updateSecretRequest);

			LOGGER.trace("updateSecret : UpdateSecretResult : status code :  {}", result.getSdkHttpMetadata().getHttpStatusCode());
			
			return HttpStatus.SC_OK == result.getSdkHttpMetadata().getHttpStatusCode();
		}  catch (Exception e) {
			LOGGER.error("updateSecret : ", e);
		}
		return false;
	}

	public SecretKVPair getSecret(String secretName) {
		
		try {
			GetSecretValueRequest getSecretValueRequest = new GetSecretValueRequest().withSecretId(secretName);
			GetSecretValueResult getSecretValueResult = client.getSecretValue(getSecretValueRequest);
			JsonMapper mapper = new JsonMapper();

			return mapper.deserializeFromJson(getSecretValueResult.getSecretString(),
					SecretKVPair.class);
		} catch (UnsupportedEncodingException e) {
			LOGGER.error("getSecret : ", e);
		} catch (DecryptionFailureException | InternalServiceErrorException | InvalidParameterException
				| InvalidRequestException | IOException e) {
			LOGGER.error("getSecret : ", e);
		} catch (Exception e) {
			LOGGER.error("getSecret : ", e);
		}
		return null;
	}
}