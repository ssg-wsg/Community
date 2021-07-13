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

package tgs.dl.intfc.utils.model;

public class APIResponse {
	private int status;
	private String result;
	/**
	 * 
	 */
	public APIResponse() {
		super();
	}
	/**
	 * @param status
	 * @param description
	 */
	public APIResponse(int status, String result) {
		super();
		this.status = status;
		this.result = result;
	}
	/**
	 * @return the status
	 */
	public int getStatus() {
		return status;
	}
	/**
	 * @param status the status to set
	 */
	public void setStatus(int status) {
		this.status = status;
	}
	/**
	 * @return the description
	 */
	public String getResult() {
		return result;
	}
	/**
	 * @param description the description to set
	 */
	public void setResult(String result) {
		this.result = result;
	}
	@Override
	public String toString() {
		return "APIResponse [status=" + status + ", result=" + result + "]";
	}
	
}
