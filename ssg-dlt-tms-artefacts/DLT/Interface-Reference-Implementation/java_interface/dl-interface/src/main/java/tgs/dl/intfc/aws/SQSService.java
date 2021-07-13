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

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

import org.apache.http.HttpStatus;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.amazonaws.services.sqs.AmazonSQSAsync;
import com.amazonaws.services.sqs.model.SendMessageRequest;
import com.amazonaws.services.sqs.model.SendMessageResult;

/***
 * Provides functions for AWS SQS Service
 *
 */
public class SQSService {
	private final AmazonSQSAsync sqsClient;
	private static final Logger LOGGER = LogManager.getLogger(SQSService.class);

	public SQSService(AmazonSQSAsync sqsClient) {
		this.sqsClient = sqsClient;
	}

	/***
	 * Sends message to SQS
	 * @param message
	 * @param sqsUrl
	 * @return boolean : true if send message result has messageId
	 * @throws ExecutionException 
	 * @throws InterruptedException 
	 */
	public boolean sendMessage(String sqsUrl, String messageBody) throws InterruptedException, ExecutionException {
		LOGGER.trace("sendMessage : messageBody : {}" , messageBody );
		
		SendMessageRequest sendMessageRequest = new SendMessageRequest().withQueueUrl(sqsUrl)
					.withMessageBody(messageBody);
		Future<SendMessageResult> messageFuture = sqsClient.sendMessageAsync(sendMessageRequest);
		
		int responseCode = messageFuture.get().getSdkHttpMetadata().getHttpStatusCode();
		LOGGER.trace("sendMessage : messageBody : {} : {}", messageBody, responseCode);
		
		return(responseCode == HttpStatus.SC_OK);
	}
}