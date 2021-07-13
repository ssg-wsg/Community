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

package scenario;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;

import tgs.dl.intfc.Gateway;
import tgs.dl.intfc.constants.RequestDataConstants;
import tgs.dl.intfc.impl.GatewayImpl;
import tgs.dl.intfc.model.RequestData;
import tgs.dl.intfc.utils.JsonMapper;
import tgs.dl.test.util.DateUtil;
import tgs.dl.test.util.TestUtils;

public class RunScenarioTest {

	private final TestUtils UTIL = TestUtils.getInstance();
	private final String TEST_FOLDER = "scenario_test/json";
	private Gateway gateway = new GatewayImpl();

	@Nested
	@DisplayName("Test Basic Write and Read Implementation")
	class ResponseValidation {
		@Test
		@DisplayName("TC_13_1 Enrolment : Valid write and read - Verify that on passing a valid input value we are getting the expected ouput value.")
		public void writeAndReadEnrolmentData() throws IOException, InterruptedException {

			// NOTE : The schemaLocation in the input JSON should be a public accessible
			// github url provided by SSG.
			// For development and testing purposes we have assigned this to a local path in
			// the file system

			String writeTestFile = TEST_FOLDER + "/" + "response_validation_write_enrolment_1.json";
			String writeRequest = UTIL.readFile(writeTestFile);
			
			//Add Source timestamp to the payload
			String writeRequestWithTimestamp = addSourceTimestamp(writeRequest);

			assertDoesNotThrow(() -> {
				gateway.writeGrantsDataDLT(writeRequestWithTimestamp);
			});

			TimeUnit.SECONDS.sleep(10);

			String readTestFile = TEST_FOLDER + "/" + "response_validation_read_enrolment_1.json";
			String readRequest = UTIL.readFile(readTestFile);

			String response = assertDoesNotThrow(() -> {
				return gateway.readGrantsDataDLT(readRequest);
			});

			assertNotNull(response);

			RequestData request = new JsonMapper().deserializeFromJson(writeRequestWithTimestamp, RequestData.class);
			String payload = request.getPayload().toString();
			assertThat(response).contains(payload);
		}
		
		//@Test
		@DisplayName("TC_13_2 Enrolment Update : Valid write and read - Verify that on passing a valid input value we are getting the expected ouput value.")
		public void writeAndReadEnrolmentUpdateData() throws IOException, InterruptedException {

			// NOTE : The schemaLocation in the input JSON should be a public accessible
			// github url provided by SSG.
			// For development and testing purposes we have assigned this to a local path in
			// the file system

			String writeTestFile = TEST_FOLDER + "/" + "response_validation_write_enrolment_update.json";
			String writeRequest = UTIL.readFile(writeTestFile);
			
			//Add Source timestamp to the payload
			String writeRequestWithTimestamp = addSourceTimestamp(writeRequest);

			assertDoesNotThrow(() -> {
				gateway.writeGrantsDataDLT(writeRequestWithTimestamp);
			});

			TimeUnit.SECONDS.sleep(10);

			String readTestFile = TEST_FOLDER + "/" + "response_validation_read_enrolment_update.json";
			String readRequest = UTIL.readFile(readTestFile);

			String response = assertDoesNotThrow(() -> {
				return gateway.readGrantsDataDLT(readRequest);
			});

			assertNotNull(response);

			RequestData request = new JsonMapper().deserializeFromJson(writeRequestWithTimestamp, RequestData.class);
			String payload = request.getPayload().toString();
			assertThat(response).contains(payload);
		}
	}

	@Nested
	@DisplayName("Test Schema Validation")
	class SchemaValidation {

		@Nested
		@DisplayName("Test Schema Validation -  Write Request")
		class ValidateWriteRequest {

			@Test
			@DisplayName("TC_01 Write to DLT - Verify Schema Validation passes on passing a valid input.")
			void writeValidInput() throws IOException {
				String testFile = TEST_FOLDER + "/" + "schema_validation_write_1.json";
				String request = UTIL.readFile(testFile);
				
				assertDoesNotThrow(() -> {
					gateway.writeGrantsDataDLT(request);
				});
			}
			
			/***
			TC_02 Write to DLT - Schema Validation fails on passing a invalid input. - primaryKey1 does not match with payload : courseReferenceNumber
			TC_03 Write to DLT - Schema Validation fails on passing a invalid input. - secondaryKey does not match with payload : courseRunReferenceNumber
			***/

			@Test
			@DisplayName("TC_02 to TC_04 Write to DLT - Verify Schema Validation fails on passing a invalid input.")
			public void writeInvalidInput() throws IOException, Exception {

				int tcFrom = 2, tcTo = 4, failuresCnt = 0;
				for (int cnt = tcFrom; cnt < tcTo; cnt++) {
					String testFile = TEST_FOLDER + "/" + "schema_validation_write_" + cnt + ".json";
					String request = UTIL.readFile(testFile);

					Exception exception = assertThrows(Exception.class, () -> {
						gateway.writeGrantsDataDLT(request);
					});

					if (StringUtils.isNotBlank(exception.getMessage())) {
						failuresCnt++;
					}
				}

				assertTrue(failuresCnt == (tcTo - tcFrom));
			}
		}

		@Nested
		@DisplayName("Test Schema Validation -  Read Request")
		class ValidateReadRequest {
			@Test
			@DisplayName("TC_06 Read From DLT - Verify Schema Validation passes on passing a valid input.")
			public void readValidInput() {
				String testFile = TEST_FOLDER + "/" + "schema_validation_read_1.json";
				String request = UTIL.readFile(testFile);

				String response = assertDoesNotThrow(() -> {
					return gateway.readGrantsDataDLT(request);
				});

				assertNotNull(response);
			}
			
			/***
			TC_07 Read From DLT - Schema Validation fails on passing a invalid input.Missing field eventType inside Header
			TC_08 Read From DLT - Schema Validation fails on passing a invalid input.Missing field primaryKey1 inside Header
			TC_09 Read From DLT -  Schema Validation fails on passing a invalid input.Missing field primaryKey2 inside Header
			TC_10 Read From DLT - Verify Schema Validation fails on passing a invalid input.Missing field secondaryKey inside Header
			TC_11 Read From DLT - Schema Validation fails on passing a invalid input.Missing field tertiaryKey inside Header
			TC_12 Read From DLT - Schema Validation fails on passing a invalid input.Missing field pageNumber inside Header
			***/

			@Test
			@DisplayName("TC_07 to TC_12 Read From DLT - Verify Schema Validation fails on passing a invalid input.")
			public void readInvalidInput() throws IOException, Exception {

				int tcFrom = 2, tcTo = 7, failuresCnt = 0;
				for (int cnt = tcFrom; cnt < tcTo; cnt++) {

					String testFile = TEST_FOLDER + "/" + "schema_validation_read_" + cnt + ".json";
					String request = UTIL.readFile(testFile);

					Exception exception = assertThrows(Exception.class, () -> {
						gateway.readGrantsDataDLT(request);
					});

					if (StringUtils.isNotBlank(exception.getMessage())) {
						failuresCnt++;
					}
				}
				assertTrue(failuresCnt == (tcTo - tcFrom));
			}
		}
	}

	/***
	 * sample method to generate source timestamp
	 * @param eventData
	 * @return
	 * @throws IOException
	 */
	private String addSourceTimestamp(String eventData) throws IOException {
		RequestData request = new JsonMapper().deserializeFromJson(eventData, RequestData.class);

		JsonNode publicPayloadNode = request.getPublicPayload();
		JsonNode tagsNode = publicPayloadNode.get(RequestDataConstants.PUBLIC_PAYLOAD_TAGS);
		JsonNode ackNode = publicPayloadNode.get(RequestDataConstants.PUBLIC_PAYLOAD_ACKNOWLEDGMENT);

		ObjectNode newPublicPayloadNode = JsonNodeFactory.instance.objectNode();
		ObjectNode newSourceNode = JsonNodeFactory.instance.objectNode();
		newSourceNode.put(RequestDataConstants.PUBLIC_PAYLOAD_SOUCRCE_DATETIME, DateUtil.getFormattedDateTime());
		newSourceNode.put(RequestDataConstants.PUBLIC_PAYLOAD_SOUCRCE_TIMESTAMP, String.valueOf(DateUtil.getTimestampInMilliseconds()));

		newPublicPayloadNode.set(RequestDataConstants.PUBLIC_PAYLOAD_TAGS, tagsNode);
		newPublicPayloadNode.set(RequestDataConstants.PUBLIC_PAYLOAD_SOUCRCE, newSourceNode);
		newPublicPayloadNode.set(RequestDataConstants.PUBLIC_PAYLOAD_ACKNOWLEDGMENT, ackNode);

		request.setPublicPayload(newPublicPayloadNode);
		return new JsonMapper().serializeToJson(request);

	}
}
