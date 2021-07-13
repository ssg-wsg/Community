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

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.model.InvokeRequest;
import com.amazonaws.services.lambda.model.InvokeResult;

/***
 * 
 * Provides functions for AWS Lambda Service
 *
 */
public class LambdaService {
	private static final Logger LOGGER = LogManager.getLogger(LambdaService.class);

	private final AWSLambda lambdaClient;

	public LambdaService(AWSLambda lambdaClient) {
		this.lambdaClient = lambdaClient;
	}

	/***
	 * 
	 * @param lambdaFunction : Function Name
	 * @param payload        : Payload
	 * @return result of the lambda call
	 */
	public String invokeLambda(String lambdaFunction, String payload) {
		LOGGER.trace("sendMessage : lambdaFunction : " + lambdaFunction + " : payload : " + payload);

		String result = null;

		InvokeRequest invokeRequest = new InvokeRequest().withFunctionName(lambdaFunction).withPayload(payload);
		InvokeResult invokeResult = lambdaClient.invoke(invokeRequest);

		ByteBuffer byteBuf = invokeResult.getPayload();
		if (byteBuf != null) {
			result = StandardCharsets.UTF_8.decode(byteBuf).toString();
		}
		return result;
	}
}
