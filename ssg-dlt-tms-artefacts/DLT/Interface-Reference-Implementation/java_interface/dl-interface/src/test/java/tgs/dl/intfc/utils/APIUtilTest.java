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

import org.apache.http.HttpStatus;
import org.junit.jupiter.api.Test;

import tgs.dl.intfc.constants.Constants;
import tgs.dl.intfc.utils.APIUtil;
import tgs.dl.intfc.utils.model.APIResponse;

public class APIUtilTest {
	private final APIUtil API_UTIL = new APIUtil();
	
	@Test
	public void testAPIPostRequest() throws Exception {
		String jsonString = "{\"trainingPartner\": {\"uen\": \"6f5ae64e-e2cc-4bc5-8c04-876abeff252e\",\"code\": \"1920304A-A\"}}";
		APIResponse apiResponse = API_UTIL.apiPostRequest(Constants.KEY_MGMT_API.getGetEncryptDataKeyEndpoint(), jsonString);
		assertNotNull(apiResponse);
		assertEquals(HttpStatus.SC_OK, apiResponse.getStatus());
	}
}
