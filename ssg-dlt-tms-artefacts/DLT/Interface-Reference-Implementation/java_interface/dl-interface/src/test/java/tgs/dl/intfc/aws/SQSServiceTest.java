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

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import tgs.dl.intfc.aws.AWSClient;
import tgs.dl.intfc.aws.SQSService;
import tgs.dl.intfc.constants.Constants;

public class SQSServiceTest {
	private SQSService sqsService;
	
	@BeforeEach
	public void setup() throws Exception {
		this.sqsService = new SQSService(new AWSClient().getSQSClient());
	}
	
	@Test
	public void testSendMessage(){
		String messageBody = "{Sample Message}";
		
		assertDoesNotThrow(() -> {
			sqsService.sendMessage(Constants.SQS_URL, messageBody);
		});
	}
	
	@Test
	public void testSendMessageMissingURL() {
		
		Exception exception = assertThrows(Exception.class, () -> {
			String messageBody = "{Sample Message}";
			this.sqsService.sendMessage("./", messageBody);
		});

		assertNotNull(exception.getMessage());
	}
}
