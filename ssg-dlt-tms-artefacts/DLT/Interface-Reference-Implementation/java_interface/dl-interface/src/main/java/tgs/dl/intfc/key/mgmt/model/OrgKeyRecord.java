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

public class OrgKeyRecord {
	private String tpUen;
	private String tpCode;
	private String encryptedKey;
	private String numberOfBytes;
	private String validUpTo;
	
	public OrgKeyRecord() {
		
	}

	/**
	 * @param tpUEN
	 * @param tpCode
	 * @param encryptedKey
	 * @param numberOfBytes
	 * @param validUpTo
	 */
	public OrgKeyRecord(String tpUen, String tpCode, String encryptedKey, String numberOfBytes, String validUpTo) {
		super();
		this.tpUen = tpUen;
		this.tpCode = tpCode;
		this.encryptedKey = encryptedKey;
		this.numberOfBytes = numberOfBytes;
		this.validUpTo = validUpTo;
	}

	/**
	 * @return the tpUEN
	 */
	public String getTpUen() {
		return tpUen;
	}

	/**
	 * @param tpUEN the tpUEN to set
	 */
	public void setTpUEN(String tpUen) {
		this.tpUen = tpUen;
	}

	/**
	 * @return the tpCode
	 */
	public String getTpCode() {
		return tpCode;
	}

	/**
	 * @param tpCode the tpCode to set
	 */
	public void setTpCode(String tpCode) {
		this.tpCode = tpCode;
	}

	/**
	 * @return the encryptedKey
	 */
	public String getEncryptedKey() {
		return encryptedKey;
	}

	/**
	 * @param encryptedKey the encryptedKey to set
	 */
	public void setEncryptedKey(String encryptedKey) {
		this.encryptedKey = encryptedKey;
	}

	/**
	 * @return the numberOfBytes
	 */
	public String getNumberOfBytes() {
		return numberOfBytes;
	}

	/**
	 * @param numberOfBytes the numberOfBytes to set
	 */
	public void setNumberOfBytes(String numberOfBytes) {
		this.numberOfBytes = numberOfBytes;
	}

	/**
	 * @return the validUpTo
	 */
	public String getValidUpTo() {
		return validUpTo;
	}

	/**
	 * @param validUpTo the validUpTo to set
	 */
	public void setValidUpTo(String validUpTo) {
		this.validUpTo = validUpTo;
	}
	
	
}
