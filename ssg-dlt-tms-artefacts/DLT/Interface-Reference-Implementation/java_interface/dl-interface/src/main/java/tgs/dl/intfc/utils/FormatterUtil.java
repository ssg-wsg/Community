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

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;

import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bouncycastle.jcajce.provider.digest.SHA3;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;

import tgs.dl.intfc.constants.RequestDataConstants;
import tgs.dl.intfc.key.mgmt.KeyManagementService;
import tgs.dl.intfc.key.mgmt.model.KeyConfig;
import tgs.dl.intfc.key.mgmt.model.TrainingPartner;
import tgs.dl.intfc.model.RequestData;

/***
 * Utility for formatting request
 * 
 *
 */
public class FormatterUtil {

	private static final Logger LOGGER = LogManager.getLogger(FormatterUtil.class);

	/***
	 * Formats the request object for the transaction data
	 * 
	 * @param request
	 * @param isEncrypt : true if data has to be encrypted
	 * @return String of formatted data
	 * @throws Exception
	 */
	public String formatRequestData(RequestData request, boolean isEncrypt) throws Exception {
		try {
			JsonNode headerNode = request.getHeader();
			String primaryKey = headerNode.get(RequestDataConstants.PRIMARY_KEY).asText();

			// hash primary keys
			if (StringUtils.isNotBlank(primaryKey)) {
				primaryKey = getSHA3384(primaryKey);

				// reconstruct header
				((ObjectNode) headerNode).put(RequestDataConstants.PRIMARY_KEY, primaryKey);
				request.setHeader(headerNode);
			}

			// if data has to be encrypted
			if (isEncrypt) {
				request = encryptPayload(request);
			}

			return new JsonMapper().serializeToJson(request);
		} catch (IOException e) {
			LOGGER.error("formatRequestData : ", e);
			throw (e);
		}
	}

	/***
	 * Formats the response of Read data
	 * 
	 * @param formattedResponse : null if input has invalid format
	 * @return String of formatted response
	 * @throws Exception
	 */
	public String formatReadResponseData(String response) throws Exception {
		try {
			JsonMapper mapper = new JsonMapper();

			response = response.replaceAll("\\\\", "");
			response = response.substring(1, response.length() - 1);

			JsonNode responseNode = mapper.readTree(response);
			JsonNode resultNode = responseNode.get("result");
			JsonNode dataArrNode = resultNode.get("data");

			if (dataArrNode.isArray()) {
				String[] requestDataArr = new String[dataArrNode.size()];

				int cnt = 0;
				for (JsonNode dataNode : dataArrNode) {

					RequestData request = new JsonMapper().deserializeFromJson(dataNode.toString(), RequestData.class);

					// decrypt payload
					request = decryptPayload(request);

					String serializedData = mapper.serializeToJson(request);
					requestDataArr[cnt] = serializedData;

					cnt++;
				}

				ObjectNode resultNodeObj = (ObjectNode) resultNode;
				resultNodeObj.remove("data");
				resultNodeObj.put("data", Arrays.toString(requestDataArr));
				return resultNodeObj.toString().replace("\\", "");
			}

			String msg = "Error in Data Format.";
			Exception e = new Exception(msg);
			LOGGER.error("formatReadResponseData : ", e);
			throw e;

		} catch (IOException e) {
			LOGGER.error("formatReadResponseData : ", e);
			throw (e);
		}
	}

	/***
	 * Hashes a given string
	 * 
	 * @param originalString
	 * @return String of Hash value orginal string
	 * @throws UnsupportedEncodingException
	 */
	private String getSHA3384(String originalString) throws UnsupportedEncodingException {

		SHA3.DigestSHA3 sha3 = new SHA3.DigestSHA3(384);
		try {
			sha3.update(originalString.getBytes(StandardCharsets.UTF_8.toString()));
			return org.bouncycastle.util.encoders.Hex.toHexString(sha3.digest());
		} catch (UnsupportedEncodingException e) {
			LOGGER.error("getSHA3384 : ", e);
			throw (e);
		}
	}

	private RequestData encryptPayload(RequestData request) throws Exception {
		EncryptionUtil encryptUtil = new EncryptionUtil();

		KeyConfig keyConfig = null;
		try {
			JsonNode headerNode = request.getHeader();

			// get data key for encryption

			String tpUen = headerNode.get(RequestDataConstants.TP_UEN).asText();
			String tpCode = headerNode.get(RequestDataConstants.TP_CODE).asText();
			TrainingPartner tp = new TrainingPartner(tpUen, tpCode);
			keyConfig = new KeyManagementService().getKeyConfig(tp);

			// format payload
			String payload = request.getPayload().toString();
			JsonMapper mapper = new JsonMapper();
			JsonNode jsonMessage = mapper.deserializeFromJson(payload, JsonNode.class);
			payload = mapper.serializeToJson(jsonMessage);

			// encrypt payload
			byte[] iv = encryptUtil.generateRandomIV();
			String encrypted = encryptUtil.encryptMessage(keyConfig.getKey().getPlainKey(), payload, iv);

			// reconstruct payload
			ObjectNode newPayload = JsonNodeFactory.instance.objectNode();
			request.setPayload(newPayload);
			newPayload.put(RequestDataConstants.DATA_KEY, keyConfig.getKey().getEncryptedKey());
			newPayload.put(RequestDataConstants.IV, Base64.getEncoder().encodeToString(iv));
			newPayload.put(RequestDataConstants.RECORD, encrypted);
			request.setPayload(newPayload);

			return request;
		} catch (Exception e) {
			LOGGER.error("encryptPayload : ", e);
			throw (e);
		} finally {
			if (keyConfig != null && keyConfig.getKey().getPlainKey() != null) {
				encryptUtil.clearKeys(keyConfig.getKey().getPlainKey());
				keyConfig = null;
			}
		}
	}

	private RequestData decryptPayload(RequestData request) throws Exception {
		EncryptionUtil encryptUtil = new EncryptionUtil();

		KeyConfig keyConfig = null;
		try {

			JsonNode headerNode = request.getHeader();

			// get plain key for decryption
			JsonNode payloadNode = request.getPayload();
			String dataKey = payloadNode.get(RequestDataConstants.DATA_KEY).asText();
			String tpUen = headerNode.get(RequestDataConstants.TP_UEN).asText();
			String tpCode = headerNode.get(RequestDataConstants.TP_CODE).asText();
			TrainingPartner tp = new TrainingPartner(tpUen, tpCode);
			keyConfig = new KeyManagementService().getDecryptedKey(tp, dataKey);

			// decrypt payload
			String iv = payloadNode.get(RequestDataConstants.IV).asText();
			String record = payloadNode.get(RequestDataConstants.RECORD).asText();
			String decrypted = encryptUtil.decryptMessage(keyConfig.getKey().getPlainKey(), record,
					Base64.getDecoder().decode(iv));

			// reconstruct payload
			JsonMapper mapper = new JsonMapper();
			JsonNode newPayload = mapper.readTree(decrypted);
			request.setPayload(newPayload);
			return request;

		} catch (Exception e) {
			LOGGER.error("decryptPayload : ", e);
			throw (e);
		} finally {
			if (keyConfig != null && keyConfig.getKey().getPlainKey() != null) {
				encryptUtil.clearKeys(keyConfig.getKey().getPlainKey());
				keyConfig = null;
			}
		}
	}

}
