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

package tgs.dl.intfc.config.model;

public class ProfileConfig {
	private AWSProperties awsProperties;
	private DLTProperties dltProperties;
	private String sqsUrl;
	private String lambdaChaincode;
	private KeyStorage keyStorage;
	private KeyMgmtAPI keyMgmtAPI;

	/**
	 * @return the awsProperties
	 */
	public AWSProperties getAwsProperties() {
		return awsProperties;
	}

	/**
	 * @param aws the awsProperties to set
	 */
	public void setAwsProperties(AWSProperties awsProperties) {
		this.awsProperties = awsProperties;
	}
	
	/**
	 * @return the lambdaChaincode
	 */
	public String getLambdaChaincode() {
		return lambdaChaincode;
	}

	/**
	 * @param lambdaChaincode the lambdaChaincode to set
	 */
	public void setLambdaChaincode(String lambdaChaincode) {
		this.lambdaChaincode = lambdaChaincode;
	}
	
	/**
	 * @return the sqsUrl
	 */
	public String getSqsUrl() {
		return sqsUrl;
	}

	/**
	 * @param sqsUrl the sqsUrl to set
	 */
	public void setSqsUrl(String sqsUrl) {
		this.sqsUrl = sqsUrl;
	}
	
	/**
	 * @return the dltProperties
	 */
	public DLTProperties getDltProperties() {
		return dltProperties;
	}

	/**
	 * @param dltProperties the dltProperties to set
	 */
	public void setDltProperties(DLTProperties dltProperties) {
		this.dltProperties = dltProperties;
	}

	/**
	 * @return the keyStorage
	 */
	public KeyStorage getKeyStorage() {
		return keyStorage;
	}

	/**
	 * @param keyStorage the keyStorage to set
	 */
	public void setKeyStorage(KeyStorage keyStorage) {
		this.keyStorage = keyStorage;
	}

	/**
	 * @return the keyMgmtAPI
	 */
	public KeyMgmtAPI getKeyMgmtAPI() {
		return keyMgmtAPI;
	}

	/**
	 * @param keyMgmtAPI the keyMgmtAPI to set
	 */
	public void setKeyMgmtAPI(KeyMgmtAPI keyMgmtAPI) {
		this.keyMgmtAPI = keyMgmtAPI;
	}

	@Override
	public String toString() {
		return "ProfileConfig [awsProperties=" + awsProperties + ", dltProperties=" + dltProperties + ", sqsUrl="
				+ sqsUrl + ", lambdaChaincode=" + lambdaChaincode + ", keyStorage=" + keyStorage + ", keyMgmtAPI="
				+ keyMgmtAPI + "]";
	}
	
}
