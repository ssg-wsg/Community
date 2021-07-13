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

package tgs.dl.intfc.constants;

public enum WriteHeaderKeys {
	EVENT_TYPE("eventType"),
	PRIMARY_KEY("primaryKey"),
	SECONDARY_KEY("secondaryKey"),
	TERTIARY_KEY("tertiaryKey"),
	TP_UEN("trainingPartnerUen"),
	TP_CODE("trainingPartnerCode");
	
	private String keyName;
	
	WriteHeaderKeys(String keyName){
		this.keyName = keyName;
	}
	
	public String getHeaderKey() {
		return this.keyName;
	}
}
