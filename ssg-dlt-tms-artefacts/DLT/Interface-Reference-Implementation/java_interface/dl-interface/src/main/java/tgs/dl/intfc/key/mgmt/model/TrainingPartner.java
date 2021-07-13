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

package tgs.dl.intfc.key.mgmt.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TrainingPartner {
	private String uen;
	private String code;
	
	/**
	 * 
	 */
	public TrainingPartner() {
		super();
	}

	/**
	 * @param uen
	 * @param code
	 */
	public TrainingPartner(String uen, String code) {
		super();
		this.uen = uen;
		this.code = code;
	}
	
	/**
	 * @return the uen
	 */
	public String getUen() {
		return uen;
	}
	/**
	 * @param uen the uen to set
	 */
	public void setUen(String uen) {
		this.uen = uen;
	}
	/**
	 * @return the code
	 */
	public String getCode() {
		return code;
	}
	/**
	 * @param code the code to set
	 */
	public void setCode(String code) {
		this.code = code;
	}

	@Override
	public String toString() {
		return "TrainingPartner [uen=" + uen + ", code=" + code + "]";
	}
}
