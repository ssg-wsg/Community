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

import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.security.GeneralSecurityException;

import org.junit.jupiter.api.Test;

import tgs.dl.intfc.impl.TransactionHandlerImpl;
import tgs.dl.intfc.model.RequestData;
import tgs.dl.intfc.utils.FormatterUtil;
import tgs.dl.intfc.utils.JsonMapper;
import tgs.dl.test.util.TestUtils;

public class FormatterUtilTest {
	private final FormatterUtil FORMATTER_UTIL = new FormatterUtil();
	private final TestUtils UTIL = TestUtils.getInstance();
	
	@Test
	public void testFormatRequestData() throws GeneralSecurityException, Exception {
		String sampleRequest = "unit_test/json/write_enrolment.json";
		String jsonString = UTIL.readFile(sampleRequest);
		RequestData request = new JsonMapper().deserializeFromJson(jsonString, RequestData.class);
		
		boolean isEncrypt = true;
		String formattedData = FORMATTER_UTIL.formatRequestData(request, isEncrypt);
		assertNotNull(formattedData);
	}
	
	@Test
	public void testFormatReadData() throws GeneralSecurityException, Exception {
		String sampleRequest = "unit_test/json/read_request.json";
		String jsonString = UTIL.readFile(sampleRequest);
		RequestData request = new JsonMapper().deserializeFromJson(jsonString, RequestData.class);
		
		boolean isEncrypt = false;
		String formattedData = FORMATTER_UTIL.formatRequestData(request, isEncrypt);
		assertNotNull(formattedData);
	}
	
	@Test
	public void testFormatReadResponse() throws GeneralSecurityException, Exception {
		String sampleRequest = "unit_test/json/read_request.json";
		String jsonString = UTIL.readFile(sampleRequest);
		RequestData request = new JsonMapper().deserializeFromJson(jsonString, RequestData.class);
		
		boolean isEncrypt = false;
		String formattedData = FORMATTER_UTIL.formatRequestData(request, isEncrypt);
		
		String readResponse = new TransactionHandlerImpl().readTransaction(formattedData);
		
		String response = FORMATTER_UTIL.formatReadResponseData(readResponse);
		
		assertNotNull(response);
	}
	
}
