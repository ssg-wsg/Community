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

public class KeyStorage {
	private String uri;
	private String keyDB;
	private String keyCollection;
	/**
	 * @return the uri
	 */
	public String getUri() {
		return uri;
	}
	/**
	 * @param uri the uri to set
	 */
	public void setUri(String uri) {
		this.uri = uri;
	}
	/**
	 * @return the keyDB
	 */
	public String getKeyDB() {
		return keyDB;
	}
	/**
	 * @param keyDB the keyDB to set
	 */
	public void setKeyDB(String keyDB) {
		this.keyDB = keyDB;
	}
	/**
	 * @return the keyCollection
	 */
	public String getKeyCollection() {
		return keyCollection;
	}
	/**
	 * @param keyCollection the keyCollection to set
	 */
	public void setKeyCollection(String keyCollection) {
		this.keyCollection = keyCollection;
	}
	@Override
	public String toString() {
		return "KeyStorage [uri=" + uri + ", keyDB=" + keyDB + ", keyCollection=" + keyCollection + "]";
	}
}
