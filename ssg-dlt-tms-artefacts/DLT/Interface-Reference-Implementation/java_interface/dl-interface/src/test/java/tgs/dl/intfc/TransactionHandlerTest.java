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

import java.io.IOException;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.core.JsonProcessingException;

import tgs.dl.intfc.TransactionHandler;
import tgs.dl.intfc.impl.TransactionHandlerImpl;
import tgs.dl.test.util.TestUtils;

public class TransactionHandlerTest {

	private final TestUtils UTIL = TestUtils.getInstance();
	private final TransactionHandler transactionHandler = new TransactionHandlerImpl();
	private static final String SAMPLE_REQUEST = "unit_test/json/write_enrolment_transaction.json";
	

	@Test
	public void writeTransaction() throws Exception {
		String eventData = UTIL.generateDesiarilizedRequest(UTIL.readFile(SAMPLE_REQUEST));
		
		assertDoesNotThrow(() -> {
			transactionHandler.writeTransaction(eventData);
		});
	}

	@Test
	public void writeTransactionThrowException() {
		Exception exception = assertThrows(IOException.class, () -> {
			String eventData = "";
			transactionHandler.writeTransaction(eventData);
		});

		assertNotNull(exception.getMessage());
	}
	
	@Test
	public void readTransaction() throws JsonProcessingException, Exception {
		String sampleRequest = "unit_test/json/read_transaction_request.json";
		String eventData = UTIL.readFile(sampleRequest);
		String readResponse = transactionHandler.readTransaction(eventData);
		
		assertNotNull(readResponse);
	}
}
