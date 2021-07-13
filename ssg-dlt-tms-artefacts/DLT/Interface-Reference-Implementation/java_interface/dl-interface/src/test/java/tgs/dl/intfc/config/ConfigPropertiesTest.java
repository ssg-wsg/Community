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

package tgs.dl.intfc.config;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

import tgs.dl.intfc.config.ConfigProperties;
import tgs.dl.intfc.config.model.ProfileConfig;
import tgs.dl.intfc.constants.Constants;

public class ConfigPropertiesTest {
	ConfigProperties config = new ConfigProperties();

	@Test
	public void testLoadExternalConfig() {
		ProfileConfig econfig = ConfigProperties.getExternalConfig(Constants.EXTERNAL_CONFIG_FILE);
		assertNotNull(econfig);
	}
}
