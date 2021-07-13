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

import java.io.IOException;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpStatus;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;

import tgs.dl.intfc.constants.Constants;
import tgs.dl.intfc.key.mgmt.model.Key;
import tgs.dl.intfc.key.mgmt.model.KeyConfig;
import tgs.dl.intfc.key.mgmt.model.OrgKeyRecord;
import tgs.dl.intfc.key.mgmt.model.TrainingPartner;
import tgs.dl.intfc.mongodb.CollectionService;
import tgs.dl.intfc.utils.APIUtil;
import tgs.dl.intfc.utils.DateUtil;
import tgs.dl.intfc.utils.JsonMapper;
import tgs.dl.intfc.utils.model.APIResponse;

public class KeyManagementService {
	private static final Logger LOGGER = LogManager.getLogger(KeyManagementService.class);
	private static final APIUtil API_UTIL = new APIUtil();
	private CollectionService collectionService;
	private SecretStorageService secretsStorageService;

	public KeyManagementService() throws Exception {
		collectionService = OrgKeyCollection.getCollectionService();
		secretsStorageService = new SecretStorageService();
	}

	public KeyManagementService(CollectionService collectionService, SecretStorageService secretsStorageService) {
		this.collectionService = collectionService;
		this.secretsStorageService = secretsStorageService;
	}

	/***
	 * Provides the key record of the organisation
	 * 
	 * @param referenceId: organisation's reference id
	 * @return KeyConfig: object that has the organisation's key record
	 * @throws Exception
	 */
	public KeyConfig getKeyConfig(TrainingPartner tp) throws Exception {

		if (tp == null) {
			String msg = "ReferenceId should not be blank.";
			Exception e = new Exception(msg);
			LOGGER.error("getKeyConfig : ", e);
			throw e;
		}

		// get key config by org reference id
		String result = collectionService.getByFieldValue(OrgKeyCollection.ORG_REFERENCE_FIELD, tp.getCode());

		if (StringUtils.isNotBlank(result)) {
			LOGGER.trace("getKeyConfig : key record exists.");

			OrgKeyRecord orgKey = new JsonMapper().deserializeFromJson(result, OrgKeyRecord.class);
			KeyConfig keyConfig = mapToKeyConfig(orgKey);

			// if record exists, check validity of key
			ZonedDateTime now = DateUtil.getLocalZoneDateTimeByZoneId(DateUtil.ZONE_ID_UTC);

			// convert validUpTo to ZonedDateTime
			ZonedDateTime validUpTo = DateUtil.convertToISOZoneDateTime(keyConfig.getKey().getValidUpTo());

			if (validUpTo.isBefore(now)) {
				LOGGER.trace("getKeyConfig : key record is expired.");

				// if expired, create a new key
				boolean isEncryption = true;
				KeyConfig newConfig = getAPIKeyRecord(new KeyConfig(tp), isEncryption);

				// update new plain key to a secret storage and key record to database
				boolean isUpdate = true;
				if (refreshKeyRecord(newConfig, isUpdate)) {
					LOGGER.trace("getKeyConfig : key record has been updated.");
					return newConfig;
				}

				String msg = "Failed to update key configuration.";
				Exception e = new Exception(msg);
				LOGGER.error("getKeyConfig : updateByFieldValue : ", e);
				throw e;

			}

			return keyConfig;
		}

		LOGGER.trace("getKeyConfig : key record does not exist.");

		// if record doesn't exists call the api to create a new one
		boolean isEncryption = true;
		KeyConfig newConfig = getAPIKeyRecord(new KeyConfig(tp), isEncryption);

		// create new plain key to a secret storage and key record to database
		boolean isUpdate = false;
		if (refreshKeyRecord(newConfig, isUpdate)) {
			LOGGER.trace("getKeyConfig : new key record has been updated.");
			return newConfig;
		}

		String msg = "Failed to create key configuration.";
		Exception e = new Exception(msg);
		LOGGER.error("getKeyConfig : create : ", e);
		throw e;

	}

	/***
	 * Provides the key record of the organisation used for decryption
	 * 
	 * @param referenceId:  organisation's reference id
	 * @param encryptedKey: key used for payload encryption that will be compared to
	 *                      the key record's encryption
	 * @return KeyConfig: object that has the organisation's key record
	 * @throws Exception
	 */
	public KeyConfig getDecryptedKey(TrainingPartner tp, String encryptedKey) throws Exception {
		LOGGER.trace("getDecryptedKey : starts");

		if (tp == null || StringUtils.isBlank(encryptedKey)) {
			String msg = "Training Partner and EncryptedKey should not be blank.";
			Exception e = new Exception(msg);
			LOGGER.error("getDecryptedKey : ", e);
			throw e;
		}

		LOGGER.trace("getDecryptedKey : getByFieldValue ");

		String result = collectionService.getByFieldValue(OrgKeyCollection.ORG_REFERENCE_FIELD, tp.getCode());

		LOGGER.trace("getDecryptedKey : result : {} ", result);

		KeyConfig keyConfig = null;
		if (StringUtils.isNotBlank(result)) {
			OrgKeyRecord orgKey = new JsonMapper().deserializeFromJson(result, OrgKeyRecord.class);
			keyConfig = mapToKeyConfig(orgKey);
		}

		LOGGER.trace("getDecryptedKey : validate keyConfig {}" + encryptedKey);
		if (keyConfig != null && keyConfig.getKey().getEncryptedKey().equals(encryptedKey)) {
			LOGGER.trace("getDecryptedKey : Key Record exists.");
			return keyConfig;
		}

		boolean isEncryption = false;
		LOGGER.trace("getDecryptedKey : Generate Key Record.");
		return getAPIKeyRecord(new KeyConfig(tp, new Key(encryptedKey)), isEncryption);
	}

	/***
	 * Retrieves the key record from the Key Management API
	 * 
	 * @param KeyConfig:   orgarnisation's TP info, encryptedKey(for decryption)
	 * @param isEncryption : if operation is for encryption
	 * @return Key Record of the the organisation
	 * @throws Exception
	 */
	private KeyConfig getAPIKeyRecord(KeyConfig requestConfig, boolean isEncryption) throws Exception {

		String requestURL = null;

		if (isEncryption)
			requestURL = Constants.KEY_MGMT_API.getGetEncryptDataKeyEndpoint();
		else
			requestURL = Constants.KEY_MGMT_API.getGetEncryptDataKeyEndpoint();
		
		//TP UEN is part of the API header request
		Map<String, String> headerParameters = new HashMap<String, String>();
		headerParameters.put(Constants.KEY_MGMT_API_HEADER_UEN, requestConfig.getTrainingPartner().getUen());
		
		//TP UEN is not part of API payload request
		requestConfig.getTrainingPartner().setUen(null);
		String request = new JsonMapper().serializeToJson(requestConfig);

		APIResponse apiResponse = API_UTIL.apiPostRequest(requestURL, headerParameters, request);

		if (apiResponse.getStatus() == HttpStatus.SC_OK) {
			String response = apiResponse.getResult(); 
			try {
				JsonNode responseNode = new JsonMapper().readTree(response);
				int status = responseNode.get("status").asInt();

				if (status == HttpStatus.SC_OK) {
					JsonNode dataNode = responseNode.get("data");
					return new JsonMapper().deserializeFromJson(dataNode.toString(), KeyConfig.class);
				}

				String errorDescription = responseNode.get("description").asText();
				String msg = "Error in getAPIEncryptedDataKey : " + errorDescription;
				Exception e = new Exception(msg);
				LOGGER.error("getAPIEncryptedDataKey : ", e);
				throw e;

			} catch (IOException e) {
				LOGGER.error("getAPIEncryptedDataKey : e ", e);
				throw (e);
			}
		} else {
			String msg = "Error in getAPIEncryptedDataKey : " + apiResponse.toString();
			Exception e = new Exception(msg);
			LOGGER.error("getAPIEncryptedDataKey : ", e);
			throw e;
		}
	}

	/***
	 * Records the plain key to secret storage and key record database
	 * 
	 * @param newConfig: key record
	 * @param isUpdate:  true if operation is for update, false if operation is for
	 *                   create
	 * @return true if all updates are successful
	 */
	private boolean refreshKeyRecord(KeyConfig newConfig, boolean isUpdate){

		boolean hasUpdatedSecretStorage = secretsStorageService
				.updateKeyToSecretStorage(newConfig.getTrainingPartner().getCode(), newConfig.getKey().getPlainKey());
		boolean hasUpdatedDB = updateKeyRecordToDB(newConfig, isUpdate);
		return (hasUpdatedSecretStorage && hasUpdatedDB);
	}

	/***
	 * Updates key record to database
	 * 
	 * @param newConfig: key record
	 * @param isUpdate:  true if operation is for update, false if operation is for
	 *                   create
	 * @return true if update/create is successful
	 * @throws JsonProcessingException
	 */
	private boolean updateKeyRecordToDB(KeyConfig newConfig, boolean isUpdate) {
		try {
			OrgKeyRecord orgKeyRecord = mapToOrgKeyRecord(newConfig);

			if (isUpdate) {
				String jsonString = collectionService.updateByFieldValue(OrgKeyCollection.ORG_REFERENCE_FIELD,
						orgKeyRecord.getTpCode(), new JsonMapper().serializeToJson(orgKeyRecord));
				return (jsonString != null);
			} else {
				return collectionService.create(new JsonMapper().serializeToJson(orgKeyRecord));
			}
		} catch (JsonProcessingException e) {
			LOGGER.error("updateKeyRecordToDB : ", e);
		} catch (Exception e) {
			LOGGER.error("updateKeyRecordToDB : ", e);
		}
		return false;
	}

	/***
	 * Maps KeyConfig to OrgKeyRecord(entity of database org's key record)
	 * 
	 * @param newConfig: key record
	 * @return OrgKeyRecord
	 */
	private OrgKeyRecord mapToOrgKeyRecord(KeyConfig newConfig) {
		return new OrgKeyRecord(newConfig.getTrainingPartner().getUen(), newConfig.getTrainingPartner().getCode(),
				newConfig.getKey().getEncryptedKey(), String.valueOf(newConfig.getKey().getNumberOfBytes()),
				newConfig.getKey().getValidUpTo());
	}

	/***
	 * Maps OrgKeyRecord to KeyConfig
	 * 
	 * @param orgKey: entity of database org's key record
	 * @return KeyConfig
	 * @throws Exception
	 * @throws NumberFormatException
	 */
	private KeyConfig mapToKeyConfig(OrgKeyRecord orgKey) throws NumberFormatException, Exception {
		TrainingPartner tp = new TrainingPartner(orgKey.getTpUen(), orgKey.getTpCode());

		char[] plainKey = secretsStorageService.getKeyFromSecretStorage(orgKey.getTpCode());

		if (plainKey == null) {
			String msg = "Error in getKeyFromSecretStorage : Plain Key does not exist from Secrets Storage of Reference = "
					+ orgKey.getTpCode();
			Exception e = new Exception(msg);
			LOGGER.error("mapToKeyConfig : ", e);
			throw e;
		}

		Key key = new Key(plainKey, orgKey.getEncryptedKey(), Integer.valueOf(orgKey.getNumberOfBytes()),
				orgKey.getValidUpTo());
		return new KeyConfig(tp, key);
	}

}
