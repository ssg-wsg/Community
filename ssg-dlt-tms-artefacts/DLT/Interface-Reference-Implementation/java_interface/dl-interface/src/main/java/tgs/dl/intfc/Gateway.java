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

public interface Gateway {
	
	/***
	 * Writes grants data to message queue
	 * @param eventData as Serialized Json
	 * @return boolen : status from message queue
	 * @throws Exception : for null values and AWS Service exceptions
	 */
	void writeGrantsDataDLT(String eventData) throws Exception;
	
	/***
	 * Reads grants data 
	 * @param queryKeys as Json String
	 * @return Serialized Json of EventPayload
	 * @throws Exception : null values and for AWS Service exceptions
	 */
	String readGrantsDataDLT(String queryKeys) throws Exception;
}