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

import java.util.Arrays;

public class Key {
	private char[] plainKey;
	private String encryptedKey;
	private int numberOfBytes;
	private String validUpTo;
	
	/**
	 * 
	 */
	public Key() {
		super();
	}
	
	/**
	 * @param encryptedKey
	 */
	public Key(String encryptedKey) {
		super();
		this.encryptedKey = encryptedKey;
	}
	
	/**
	 * @param plainKey
	 * @param encryptedKey
	 * @param numberOfBytes
	 * @param validUpTo
	 */
	public Key(char[] plainKey, String encryptedKey, int numberOfBytes, String validUpTo) {
		super();
		this.plainKey = plainKey;
		this.encryptedKey = encryptedKey;
		this.numberOfBytes = numberOfBytes;
		this.validUpTo = validUpTo;
	}
	/**
	 * @return the plainKey
	 */
	public char[] getPlainKey() {
		return plainKey;
	}
	/**
	 * @param plainKey the plainKey to set
	 */
	public void setPlainKey(char[] plainKey) {
		this.plainKey = plainKey;
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
	public int getNumberOfBytes() {
		return numberOfBytes;
	}
	/**
	 * @param numberOfBytes the numberOfBytes to set
	 */
	public void setNumberOfBytes(int numberOfBytes) {
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
	@Override
	public String toString() {
		return "Key [plainKey=" + Arrays.toString(plainKey) + ", encryptedKey=" + encryptedKey + ", numberOfBytes="
				+ numberOfBytes + ", validUpTo=" + validUpTo + "]";
	}
}
