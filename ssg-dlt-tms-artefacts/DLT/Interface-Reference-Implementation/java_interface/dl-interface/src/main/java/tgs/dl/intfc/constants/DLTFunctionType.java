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

package tgs.dl.intfc.constants;

/***
 * List of Fabric function types
 */
public enum DLTFunctionType {
	
	INVOKE("INVOKE"),
	QUERY_OBJECT("QUERY");
	
	private String functionType;
	 
	DLTFunctionType(String functionType) {
        this.functionType = functionType;
    }
 
    public String getFunctionType() {
        return functionType;
    }
}
