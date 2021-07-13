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

import tgs.dl.intfc.aws.AWSClient;
import tgs.dl.intfc.aws.SecretsMgrService;
import tgs.dl.intfc.config.model.SecretKVPair;
import tgs.dl.intfc.constants.Constants;
import tgs.dl.intfc.utils.JsonMapper;

public class SecretStorageService {
	private static final Logger LOGGER = LogManager.getLogger(KeyManagementService.class);

	private SecretsMgrService secretsMgrService;

	public SecretStorageService() throws Exception {
		secretsMgrService = new SecretsMgrService(new AWSClient().getSecretsMgrClient());
	}

	/***
	 * Retrieves plain key from secret storage
	 * 
	 * @param referenceId: orgarnisation's reference id
	 * @return char array of plain key
	 */
	protected char[] getKeyFromSecretStorage(String referenceId) {
		SecretKVPair secretKey = secretsMgrService.getSecret(referenceId);

		if (secretKey != null && secretKey.getPlainDataKey() != null) {
			return secretKey.getPlainDataKey();
		}
		LOGGER.trace("getKeyFromSecretStorage : secretKey does not exist.");

		return null;
	}

	/***
	 * Records play key to secret storage and key record to database
	 * 
	 * @param referenceId: orgarnisation's reference id
	 * @param plainKey:    used for cipher
	 * @return true if all updates are successful
	 * @throws Exception
	 */
	protected boolean updateKeyToSecretStorage(String referenceId, char[] plainKey) {
		boolean result = false;
		try {
		    SecretKVPair kvPair = new SecretKVPair(plainKey, Constants.KEY_STORAGE_ENCODING_TYPE);
			JsonMapper mapper = new JsonMapper();
			String keyValueJsonString = mapper.serializeToJson(kvPair);
			
			if (getKeyFromSecretStorage(referenceId) == null) {
				result = secretsMgrService.createSecret(referenceId, keyValueJsonString);
			} else {
				result = secretsMgrService.updateSecret(referenceId, keyValueJsonString);
			}
		} catch (Exception e) {
			LOGGER.error("updateKeyToSecretStorage : ", e);
		}
		return result;
	}
}
