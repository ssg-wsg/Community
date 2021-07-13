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

package tgs.dl.intfc;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.core.JsonProcessingException;

import tgs.dl.intfc.Gateway;
import tgs.dl.intfc.impl.GatewayImpl;
import tgs.dl.test.util.TestUtils;

public class GatewayServiceTest {

	private final TestUtils UTIL = TestUtils.getInstance();
	private Gateway gateway = new GatewayImpl();

	//@Test
	public void writeTestDataWithValidInput() {
		String sampleRequest = "unit_test/json/write_enrolment.json";
		String request = UTIL.readFile(sampleRequest);
		assertDoesNotThrow(() -> {
			gateway.writeGrantsDataDLT(request);
		});
	}

	@Test
	public void readTestDataWithValidInput() throws JsonProcessingException, Exception {
		String sampleRequest = "unit_test/json/read_request.json";

		String request = UTIL.readFile(sampleRequest);
		
		TimeUnit.SECONDS.sleep(10);
		String response = gateway.readGrantsDataDLT(request);

		assertNotNull(response);
	}

	//@Test
	public void writeTestDataWithNull() {

		Exception exception = assertThrows(Exception.class, () -> {
			String request = null;
			gateway.writeGrantsDataDLT(request);
		});

		assertNotNull(exception.getMessage());
	}

	//@Test
	public void writeTestDataWithEmpty() {

		Exception exception = assertThrows(Exception.class, () -> {
			String request = "";
			gateway.writeGrantsDataDLT(request);
		});

		assertNotNull(exception.getMessage());
	}

	//@Test
	public void readTestDataWithNull() {

		Exception exception = assertThrows(Exception.class, () -> {
			String request = null;
			gateway.readGrantsDataDLT(request);
		});

		assertNotNull(exception.getMessage());
	}

	//@Test
	public void readTestDataWithEmpty() {
		Exception exception = assertThrows(Exception.class, () -> {
			String request = "";
			gateway.readGrantsDataDLT(request);
		});

		assertNotNull(exception.getMessage());
	}

}
