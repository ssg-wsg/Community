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

package tgs.dl.intfc.impl;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import tgs.dl.intfc.TransactionHandler;
import tgs.dl.intfc.aws.AWSClient;
import tgs.dl.intfc.aws.LambdaService;
import tgs.dl.intfc.aws.SQSService;
import tgs.dl.intfc.constants.ChaincodeFunction;
import tgs.dl.intfc.constants.Constants;
import tgs.dl.intfc.constants.DLTFunctionType;
import tgs.dl.intfc.model.DLTPayload;
import tgs.dl.intfc.model.RequestData;
import tgs.dl.intfc.utils.JsonMapper;

public class TransactionHandlerImpl implements TransactionHandler {
	
	private static final Logger LOGGER = LogManager.getLogger(TransactionHandlerImpl.class);
	private SQSService sqsService;
	private LambdaService lambdaService;
	
	public TransactionHandlerImpl() {
	}
	
	public TransactionHandlerImpl(SQSService sqsService){
		this.sqsService = sqsService;
	}
	
	public TransactionHandlerImpl(LambdaService lambdaService){
		this.lambdaService = lambdaService;
	}
	
	/***
	 * Implementation of writeTransaction
	 * Deserializes event request to RequestData Object
	 * Sets DLT Payload with the event request
	 * Sends DLT Payload to SQS
	 */
	@Override
	public void writeTransaction(String eventData) throws Exception {
		JsonMapper mapper = new JsonMapper();
		RequestData eventRequest = mapper.deserializeFromJson(eventData, RequestData.class);
		
		DLTPayload payload = setFabricPayload(eventRequest, DLTFunctionType.INVOKE.getFunctionType(),
				ChaincodeFunction.INVOKE.getChaincodeFunction());

		String payloadString = mapper.serializeToJson(payload);
		
		LOGGER.trace("writeTransaction : payloadString : {}", payloadString);
		
		sqsService = new SQSService(new AWSClient().getSQSClient());
		boolean isMessageSent = sqsService.sendMessage(Constants.SQS_URL, payloadString); 
		
		LOGGER.trace("writeTransaction : isMessageSent : {}", isMessageSent);
	}
	
	
	/***
	 * Implementation of readTransaction
	 * Sets DLT Payload with the event request
	 * Sends DLT Payload to Lambda
	 * Returns Event Payload from Lambda
	 */
	@Override
	public String readTransaction(String eventData) throws Exception {
		JsonMapper mapper = new JsonMapper();
		RequestData eventRequest = mapper.deserializeFromJson(eventData, RequestData.class);

		DLTPayload payload = setFabricPayload(eventRequest, DLTFunctionType.QUERY_OBJECT.getFunctionType(),
				ChaincodeFunction.QUERY_PAGINATION.getChaincodeFunction());

		String payloadString = mapper.serializeToJson(payload);
		
		LOGGER.trace("readTransaction : payload : {}", payloadString);
		
		lambdaService = new LambdaService(new AWSClient().getLambdaClient());
		String response = lambdaService.invokeLambda(Constants.LAMBDA_CHAINCODE, payloadString);
		
		LOGGER.trace("readTransaction : response : {}", response);
		return response;
	}

	/***
	 * Sets the DLT Payload Object
	 * @param eventData (Object of Request)
	 * @param triggerType (Fabric function type)
	 * @param chaincodeFunction (Chaincode function name)
	 * @return DLT Payload Object
	 * @throws Exception 
	 */
	private DLTPayload setFabricPayload(Object eventData, String triggerType, String chaincodeFunction){
		String networkId = Constants.DLT_PROPERTIES.getNetworkId(); 
		String memberId = Constants.DLT_PROPERTIES.getMemberId();
		String userEnrollmentId = Constants.DLT_PROPERTIES.getEnrolmentId(); 
		String channelName = Constants.FABRIC_CHANNEL;
		String chaincodeName = Constants.FABRIC_CHAINCODE;

		Object[] args = { eventData };

		return new DLTPayload(networkId, memberId, channelName, userEnrollmentId,
				chaincodeName, triggerType, chaincodeFunction, args);
	}

}
