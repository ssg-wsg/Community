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


public class SecretKVPair {
	private char[] plainDataKey;
	private String encoding;
	
	public SecretKVPair() {}

	/**
	 * @param plainDataKey
	 * @param encoding
	 */
	public SecretKVPair(char[] plainDataKey, String encoding) {
		super();
		this.plainDataKey = plainDataKey;
		this.encoding = encoding;
	}

	/**
	 * @return the plainDataKey
	 */
	public char[] getPlainDataKey() {
		return plainDataKey;
	}

	/**
	 * @param plainDataKey the plainDataKey to set
	 */
	public void setPlainDataKey(char[] plainDataKey) {
		this.plainDataKey = plainDataKey;
	}

	/**
	 * @return the encoding
	 */
	public String getEncoding() {
		return encoding;
	}

	/**
	 * @param encoding the encoding to set
	 */
	public void setEncoding(String encoding) {
		this.encoding = encoding;
	}


}
