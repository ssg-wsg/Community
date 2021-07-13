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

package tgs.dl.intfc.model;

public class DLTPayload {
	private String networkId;
	private String memberId;
	private String channelName;
	private String userEnrollmentId;
	private String chaincodeName;
	private String triggerType;
	private String functionName;
	private Object[] args;
	
	/**
	 * @param networkId
	 * @param memberId
	 * @param channelName
	 * @param userEnrollmentId
	 * @param chaincodeName
	 * @param triggerType
	 * @param functionName
	 * @param args
	 */
	public DLTPayload(String networkId, String memberId, String channelName, String userEnrollmentId,
			String chaincodeName, String triggerType, String functionName, Object[] args) {
		super();
		this.networkId = networkId;
		this.memberId = memberId;
		this.channelName = channelName;
		this.userEnrollmentId = userEnrollmentId;
		this.chaincodeName = chaincodeName;
		this.triggerType = triggerType;
		this.functionName = functionName;
		this.args = args;
	}
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
	 * @return the channelName
	 */
	public String getChannelName() {
		return channelName;
	}
	/**
	 * @param channelName the channelName to set
	 */
	public void setChannelName(String channelName) {
		this.channelName = channelName;
	}
	/**
	 * @return the userEnrollmentId
	 */
	public String getUserEnrollmentId() {
		return userEnrollmentId;
	}
	/**
	 * @param userEnrollmentId the userEnrollmentId to set
	 */
	public void setUserEnrollmentId(String userEnrollmentId) {
		this.userEnrollmentId = userEnrollmentId;
	}
	/**
	 * @return the chaincodeName
	 */
	public String getChaincodeName() {
		return chaincodeName;
	}
	/**
	 * @param chaincodeName the chaincodeName to set
	 */
	public void setChaincodeName(String chaincodeName) {
		this.chaincodeName = chaincodeName;
	}
	/**
	 * @return the triggerType
	 */
	public String getTriggerType() {
		return triggerType;
	}
	/**
	 * @param triggerType the triggerType to set
	 */
	public void setTriggerType(String triggerType) {
		this.triggerType = triggerType;
	}
	/**
	 * @return the functionName
	 */
	public String getFunctionName() {
		return functionName;
	}
	/**
	 * @param functionName the functionName to set
	 */
	public void setFunctionName(String functionName) {
		this.functionName = functionName;
	}
	/**
	 * @return the args
	 */
	public Object[] getArgs() {
		return args;
	}
	/**
	 * @param args the args to set
	 */
	public void setArgs(Object[] args) {
		this.args = args;
	}
	
	@Override
	public String toString() {
		return "FabricPayload [networkId=" + networkId + ", memberId=" + memberId + ", channelName=" + channelName
				+ ", userEnrollmentId=" + userEnrollmentId + ", chaincodeName=" + chaincodeName + ", triggerType="
				+ triggerType + ", functionName=" + functionName + ", args=" + args + "]";
	}
	
	
}
