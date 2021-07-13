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

public class DLTProperties {
	private String networkId;
	private String memberId;
	private String enrolmentId;
	
	/**
	 * @return the networkId
	 */
	public String getNetworkId() {
		return networkId;
	}
	/**
	 * @param networkId the networkId to set
	 */
	public void setNetworkId(String networkId) {
		this.networkId = networkId;
	}
	/**
	 * @return the memberId
	 */
	public String getMemberId() {
		return memberId;
	}
	/**
	 * @param memberId the memberId to set
	 */
	public void setMemberId(String memberId) {
		this.memberId = memberId;
	}
	/**
	 * @return the enrolmentId
	 */
	public String getEnrolmentId() {
		return enrolmentId;
	}
	/**
	 * @param enrolmentId the enrolmentId to set
	 */
	public void setEnrolmentId(String enrolmentId) {
		this.enrolmentId = enrolmentId;
	}

	@Override
	public String toString() {
		return "DLTProperties [networkId=" + networkId + ", memberId=" + memberId + ", enrolmentId=" + enrolmentId
				+ "]";
	}
	
}
