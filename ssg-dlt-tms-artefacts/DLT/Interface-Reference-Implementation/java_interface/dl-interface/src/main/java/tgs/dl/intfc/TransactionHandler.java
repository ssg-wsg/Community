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

package tgs.dl.intfc;

public interface TransactionHandler {
	
	/***
	 * Writes transaction data, Formats the request to DLT Payload
	 * @param eventData
	 * @return boolean : status from message queue
	 * @throws Exception : null values for AWS Service exceptions
	 */
	void writeTransaction(String eventData) throws Exception;
	
	/***
	 * Reads transaction data based on the queryKeys provided, Formats the request to DLT Payload
	 * @param eventData
	 * @return queried data
	 * @throws Exceptio n: null values for AWS Service exceptions
	 */
	String readTransaction(String queryKeys) throws Exception;
}
