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

package tgs.dl.intfc.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RequestData{
	
	
	JsonNode header;
	JsonNode payload;
	JsonNode publicPayload;
	JsonNode dltData;
	
	public RequestData() {
		super();
	}

	public RequestData(JsonNode header, JsonNode payload) {
		this.header = header;
		this.payload = payload;
	}
	
	/**
	 * @return the publicPayload
	 */
	public JsonNode getPublicPayload() {
		return publicPayload;
	}

	/**
	 * @param publicPayload the publicPayload to set
	 */
	public void setPublicPayload(JsonNode publicPayload) {
		this.publicPayload = publicPayload;
	}

	/**
	 * @return the dltData
	 */
	public JsonNode getDltData() {
		return dltData;
	}

	/**
	 * @param dltData the dltData to set
	 */
	public void setDltData(JsonNode dltData) {
		this.dltData = dltData;
	}


	/**
	 * @return the header
	 */
	public JsonNode getHeader() {
		return header;
	}

	/**
	 * @param header the header to set
	 */
	public void setHeader(JsonNode header) {
		this.header = header;
	}

	/**
	 * @return the payload
	 */
	public JsonNode getPayload() {
		return payload;
	}

	/**
	 * @param payload the payload to set
	 */
	public void setPayload(JsonNode payload) {
		this.payload = payload;
	}

	@Override
	public String toString() {
		return "RequestData [header=" + header + ", payload=" + payload + ", publicPayload=" + publicPayload
				+ ", dltData=" + dltData + "]";
	}
	
}