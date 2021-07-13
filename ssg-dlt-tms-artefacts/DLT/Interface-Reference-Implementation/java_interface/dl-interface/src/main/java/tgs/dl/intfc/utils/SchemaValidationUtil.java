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
import java.nio.file.Files;
import java.nio.file.Paths;

import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.everit.json.schema.Schema;
import org.everit.json.schema.ValidationException;
import org.everit.json.schema.loader.SchemaLoader;
import org.json.JSONObject;
import org.json.JSONTokener;

import com.fasterxml.jackson.databind.JsonNode;

import tgs.dl.intfc.constants.HeaderKeys;
import tgs.dl.intfc.constants.ValidationConstants;
import tgs.dl.intfc.constants.WriteHeaderKeys;
import tgs.dl.intfc.model.RequestData;

public class SchemaValidationUtil {

	private static final Logger LOGGER = LogManager.getLogger(SchemaValidationUtil.class);

	/***
	 * Validates the schema,
	 * 
	 * @param eventData
	 * @return RequestData
	 * @throws Exception : if schema is not valid
	 */
	public RequestData validateWriteEventData(String eventData) throws Exception {
		boolean isSchemaValid = false;

		RequestData request = new JsonMapper().deserializeFromJson(eventData, RequestData.class);
		JsonNode headerNode = request.getHeader();

		/**
		 * validate json from the schemaLocation field inside header In the sample
		 * implementation code it is fetching from a local relative path It should be a
		 * public github url provided by SSG
		 */
		String schemaLocation = headerNode.get("schemaLocation").asText();
		isSchemaValid = isSchemaValid(readFileContent(schemaLocation), eventData);

		/**
		 * return RequestData Object if schema is valid
		 */
		if (isSchemaValid && isWriteInputValid(request)) {
			return request;
		}

		String msg = "Schema Validation Failed for Write: ";
		IOException e = new IOException(msg);
		LOGGER.error("validateWriteEventData : ", e);
		throw new IOException(e);
	}

	private boolean isWriteInputValid(RequestData request) {

		JsonNode headerNode = request.getHeader();
		JsonNode payloadNode;
		String eventType = headerNode.get(WriteHeaderKeys.EVENT_TYPE.getHeaderKey()).asText();
		if (eventType.equalsIgnoreCase(ValidationConstants.FEES_COLLECTION_EVENT))
			payloadNode = request.getPayload().at("/" + ValidationConstants.ENROLMENT_EVENT.toLowerCase());
		else
			payloadNode = request.getPayload().at("/" + eventType.toLowerCase());

		System.out.println(payloadNode);
		JsonNode publicPayloadNode = request.getPublicPayload();

		int errorCount = 0;
		String courseRunId = null;
		String courseReferenceNumber = null;
		String traineeId = null;
		String concatenatedKeys = null;
		/**
		 * input validation check
		 */
		String primaryKey = headerNode.get(WriteHeaderKeys.PRIMARY_KEY.getHeaderKey()).asText();
		if (!eventType.equalsIgnoreCase(ValidationConstants.FEES_COLLECTION_EVENT)) {
			courseReferenceNumber = payloadNode.at("/course/referenceNumber").asText();
			traineeId = payloadNode.at("/trainee/id").asText();
			concatenatedKeys = courseReferenceNumber + traineeId;
		}

		String ackDatetime = publicPayloadNode.at("/ack/dateTime").asText();
		String ackUnixtime = publicPayloadNode.at("/ack/timeStampInMilliSeconds").asText();
		String srcDatetime = publicPayloadNode.at("/source/dateTime").asText();
		String srcUnixtime = publicPayloadNode.at("/source/timeStampInMilliSeconds").asText();

		String secondaryKey = headerNode.get(WriteHeaderKeys.SECONDARY_KEY.getHeaderKey()).asText();
		if (!eventType.equalsIgnoreCase(ValidationConstants.FEES_COLLECTION_EVENT))
			courseRunId = payloadNode.at("/course/run/id").asText();

		String tpUen = headerNode.get(WriteHeaderKeys.TP_UEN.getHeaderKey()).asText();
		String tpCode = headerNode.get(WriteHeaderKeys.TP_CODE.getHeaderKey()).asText();

		if (!eventType.equalsIgnoreCase(ValidationConstants.FEES_COLLECTION_EVENT)) {
			if (StringUtils.isBlank(primaryKey) || StringUtils.isBlank(courseReferenceNumber)
					|| StringUtils.isBlank(traineeId) || !primaryKey.equals(concatenatedKeys)) {
				String errorMsg = ValidationConstants.PRIMARY_KEY_VALIDATION;
				errorCount++;
				LOGGER.error("validateWriteInput : {}", errorMsg);
			}
			if (StringUtils.isBlank(secondaryKey) || StringUtils.isBlank(courseRunId)
					|| !secondaryKey.contains(courseRunId)) {
				String errorMsg = ValidationConstants.SECONDARY_KEY_VALIDATION;
				errorCount++;
				LOGGER.error("validateWriteInput : {}", errorMsg);
			}
		}
		if (!StringUtils.equals(ackDatetime, "-1") || !StringUtils.equals(ackUnixtime, "-1")) {
			errorCount++;
			LOGGER.error("validateWriteInput : {}", ValidationConstants.ACK_TIMESTAMP_VALIDATION);
		}
		if (StringUtils.isBlank(tpUen)) {
			errorCount++;
			LOGGER.error("validateWriteInput: {} : {}", ValidationConstants.MISSING_FIELD_VALIDATION,
					WriteHeaderKeys.TP_UEN.getHeaderKey());
		}
		if (StringUtils.isBlank(tpCode)) {
			errorCount++;
			LOGGER.error("validateWriteInput: {} : {}", ValidationConstants.MISSING_FIELD_VALIDATION,
					WriteHeaderKeys.TP_CODE.getHeaderKey());
		}
		if (!isTpUenAndTpCodeValid(tpUen, tpCode)) {
			errorCount++;
			LOGGER.error("validateWriteInput: {}", ValidationConstants.TP_CODE_UEN_VALIDATION);
		}
		if (StringUtils.isBlank(srcDatetime) || StringUtils.isBlank(srcUnixtime)) {
			errorCount++;
			LOGGER.error("validateWriteInput: {}", ValidationConstants.SRC_TIMESTAMP_VALIDATION);
		}
		LOGGER.trace("validateWriteInput : errorCount : {}", errorCount);

		return errorCount == 0;
	}

	/***
	 * Validates the request of Read data
	 * 
	 * @param eventData
	 * @return RequestData obj
	 * @throws Exception
	 */
	public RequestData validateReadEventData(String eventData) throws Exception {
		int errorCount = 0;

		RequestData request = new JsonMapper().deserializeFromJson(eventData, RequestData.class);

		/**
		 * validate schema
		 */
		// String[] headerKeys = ValidationConstants.HEADER_KEYS;
		JsonNode headerNode = request.getHeader();

		for (HeaderKeys key : HeaderKeys.values()) {
			if (!headerNode.has(key.getHeaderKey())) {
				LOGGER.error("Schema Validation Failed for Read: {} : {}", ValidationConstants.MISSING_FIELD_VALIDATION,
						key);
				errorCount++;
			}
		}

		/**
		 * return request if schema is valid
		 */
		if (errorCount == 0) {
			return request;
		}

		String msg = "Invalid Schema";
		IOException e = new IOException(msg);
		LOGGER.error("validateReadEventData : ", e);
		throw e;

	}

	/***
	 * Validate the schema of json string
	 * 
	 * @param schemaLocation
	 * @param jsonString
	 * @return boolean : status of the validation
	 */
	private boolean isSchemaValid(String schemaLocation, String jsonString) {
		boolean isValid = false;

		JSONObject jsonSchema = new JSONObject(new JSONTokener(schemaLocation));
		JSONObject jsonSubject = new JSONObject(new JSONTokener(jsonString));
		try {
			Schema schema = SchemaLoader.load(jsonSchema);
			schema.validate(jsonSubject);
			isValid = true;
		} catch (ValidationException e) {
			isValid = false;
			LOGGER.error("isSchemaValid : ", e);
		}
		return isValid;
	}

	/***
	 * reads a file content
	 * 
	 * @param filePath
	 * @return String of contents of the given file
	 */
	private static String readFileContent(String filePath) {
		String content = null;

		try {
			content = new String(Files.readAllBytes(Paths.get(filePath)));
		} catch (IOException e) {
			LOGGER.error("readFileContent : ", e);
		}

		return content;
	}

	/***
	 * Validate the TP UEN and TP Code formats
	 * 
	 * @param tpUen
	 * @param tpCode
	 * @return boolean : status of the validation
	 */
	private boolean isTpUenAndTpCodeValid(String tpUen, String tpCode) {

		if (tpUen.contains(" ") || tpCode.contains(" ")) {
			LOGGER.error("isTpUenAndTpCodeValid : Training Partner Code and UEN should not have empty spaces.");
			return false;
		}

		try {
			String[] codeStringArray = tpCode.split("-");

			return (codeStringArray.length == 2 && tpUen.equalsIgnoreCase(codeStringArray[0])
					&& StringUtils.isNumeric(codeStringArray[1]));
		} catch (Exception e) {
			LOGGER.error("isTpUenAndTpCodeValid : ", e);
		}
		return false;
	}
}
