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

import tgs.dl.intfc.config.ConfigProperties;
import tgs.dl.intfc.config.model.AWSProperties;
import tgs.dl.intfc.config.model.DLTProperties;
import tgs.dl.intfc.config.model.KeyMgmtAPI;
import tgs.dl.intfc.config.model.KeyStorage;
import tgs.dl.intfc.config.model.ProfileConfig;

public class Constants extends ConfigProperties{
	
    public static final String EXTERNAL_CONFIG_FILE = "../dl-interface.yaml";
	private static final ProfileConfig EXTERNAL_CONFIG = getExternalConfig(EXTERNAL_CONFIG_FILE);

	//aws services
	public static final AWSProperties AWS_PROPERTIES = EXTERNAL_CONFIG.getAwsProperties();
	public static final DLTProperties DLT_PROPERTIES = EXTERNAL_CONFIG.getDltProperties();
	public static final String LAMBDA_CHAINCODE = EXTERNAL_CONFIG.getLambdaChaincode();
	public static final String SQS_URL = EXTERNAL_CONFIG.getSqsUrl();
	
	//dlt
	public static final String FABRIC_CHANNEL = "fdr-testnet";
	public static final String FABRIC_CHAINCODE = "grantcc";
	
	//key management
	public static final KeyMgmtAPI KEY_MGMT_API = EXTERNAL_CONFIG.getKeyMgmtAPI();
	public static final KeyStorage KEY_STORAGE = EXTERNAL_CONFIG.getKeyStorage();
	public static final String KEY_STORAGE_ENCODING_TYPE = "Base64";
	public static final String KEY_MGMT_API_HEADER_UEN = "uen";
}