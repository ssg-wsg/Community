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

package tgs.dl.infc.app;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;

import tgs.dl.intfc.Gateway;
import tgs.dl.intfc.impl.GatewayImpl;
import tgs.dl.intfc.model.RequestData;
import tgs.dl.intfc.utils.JsonMapper;

@Service
public class GatewayService {
	
	private Gateway gateway = new GatewayImpl();
	
	public synchronized GatewayResponse writeGrantsData(RequestData request) {
		GatewayResponse response = new GatewayResponse();
		
		try {
			String requestString = new JsonMapper().serializeToJson(request);
			gateway.writeGrantsDataDLT(requestString);
			response.setStatus(HttpStatus.CREATED.value());
		} catch (JsonProcessingException e) {
			response.setStatus(HttpStatus.BAD_REQUEST.value());
			response.setResponse(e.getMessage());
		} catch (Exception e) {
			response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
			response.setResponse(e.getMessage());
		}
		return response;
	}
	
	public GatewayResponse readGrantsData(RequestData request) {
		GatewayResponse response = new GatewayResponse();
		
		try {
			String requestString = new JsonMapper().serializeToJson(request);
			
			String result = gateway.readGrantsDataDLT(requestString);
			
			response.setStatus(HttpStatus.OK.value());
			response.setResponse(result);
		} catch (JsonProcessingException e) {
			response.setStatus(HttpStatus.BAD_REQUEST.value());
			response.setResponse(e.getMessage());
			e.printStackTrace();
		} catch (Exception e) {
			response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
			response.setResponse(e.getMessage());
			e.printStackTrace();
		}
		return response;
	}

}
