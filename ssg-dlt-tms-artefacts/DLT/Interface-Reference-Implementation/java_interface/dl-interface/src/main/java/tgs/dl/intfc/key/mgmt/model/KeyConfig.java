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
public class KeyConfig {
	private TrainingPartner trainingPartner;
	private Key key;
	
	/**
	 * 
	 */
	public KeyConfig() {
		super();
	}
	
	/**
	 * @param trainingPartner
	 */
	public KeyConfig(TrainingPartner trainingPartner) {
		super();
		this.trainingPartner = trainingPartner;
	}

	/**
	 * @param trainingPartner
	 * @param key
	 */
	public KeyConfig(TrainingPartner trainingPartner, Key key) {
		super();
		this.trainingPartner = trainingPartner;
		this.key = key;
	}

	/**
	 * @return the trainingPartner
	 */
	public TrainingPartner getTrainingPartner() {
		return trainingPartner;
	}

	/**
	 * @param trainingPartner the trainingPartner to set
	 */
	public void setTrainingPartner(TrainingPartner trainingPartner) {
		this.trainingPartner = trainingPartner;
	}

	/**
	 * @return the key
	 */
	public Key getKey() {
		return key;
	}

	/**
	 * @param key the key to set
	 */
	public void setKey(Key key) {
		this.key = key;
	}

	@Override
	public String toString() {
		return "KeyConfig [trainingPartner=" + trainingPartner + ", key=" + key + "]";
	}
	
	
}
