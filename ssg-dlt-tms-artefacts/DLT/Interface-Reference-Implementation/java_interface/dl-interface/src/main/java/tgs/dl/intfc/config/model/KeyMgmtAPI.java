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

public class KeyMgmtAPI {
	private String url;
	private String getEncryptDataKeyEndpoint;
	private String getDecryptDataKeyEndpoint;
	
	/**
	 * @return the url
	 */
	public String getUrl() {
		return url;
	}
	/**
	 * @param url the url to set
	 */
	public void setUrl(String url) {
		this.url = url;
	}
	/**
	 * @return the getEncryptDataKeyEndpoint
	 */
	public String getGetEncryptDataKeyEndpoint() {
		return url + getEncryptDataKeyEndpoint;
	}
	/**
	 * @param getEncryptDataKeyEndpoint the getEncryptDataKeyEndpoint to set
	 */
	public void setGetEncryptDataKeyEndpoint(String getEncryptDataKeyEndpoint) {
		this.getEncryptDataKeyEndpoint = getEncryptDataKeyEndpoint;
	}
	/**
	 * @return the getDecryptDataKeyEndpoint
	 */
	public String getGetDecryptDataKeyEndpoint() {
		return url + getDecryptDataKeyEndpoint;
	}
	/**
	 * @param getDecryptDataKeyEndpoint the getDecryptDataKeyEndpoint to set
	 */
	public void setGetDecryptDataKeyEndpoint(String getDecryptDataKeyEndpoint) {
		this.getDecryptDataKeyEndpoint = getDecryptDataKeyEndpoint;
	}
	@Override
	public String toString() {
		return "KeyMgmtProperties [url=" + url + ", getEncryptDataKeyEndpoint=" + getEncryptDataKeyEndpoint
				+ ", getDecryptDataKeyEndpoint=" + getDecryptDataKeyEndpoint + "]";
	}
	
}
