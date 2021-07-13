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

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Map;
import java.util.Properties;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.yaml.snakeyaml.Yaml;

import tgs.dl.intfc.config.model.ProfileConfig;
import tgs.dl.intfc.utils.JsonMapper;

public class ConfigProperties {

	private static final Logger LOGGER = LogManager.getLogger(ConfigProperties.class);

	/***
	 * Loads the External Configuration Properties
	 * 
	 * @param configFile
	 * @return ExternalConfig Object
	 * @throws FileNotFoundException, IOException
	 * @throws Exception
	 */
	public static ProfileConfig getExternalConfig(String configFile) {

		FileInputStream inputStream = null;
		ProfileConfig config = null;

		JsonMapper mapper = new JsonMapper();
		Yaml yaml = new Yaml();
		try {
			
			Properties properties = getProperties();
			String activeProfile = properties.getProperty("profile.active");

			inputStream = new FileInputStream(configFile);
			Map<String, Map<String, String>> values = yaml.load(inputStream);
			
			for (String profile : values.keySet()) {
				
				if(profile.equalsIgnoreCase(activeProfile)) {
					Map<String, String> subValues = values.get(profile);
					try {
						String json = mapper.serializeToJson(subValues);
						config = mapper.deserializeFromJson(json, ProfileConfig.class);
						
					} catch (IOException e) {
						LOGGER.error("getExternalConfig : IOException : ", e);
					}
					break;
				}
			}
			
		} catch (FileNotFoundException e) {
			LOGGER.error("getExternalConfig : FileNotFoundException : ", e);
		} finally {
			if (inputStream != null)
				try {
					inputStream.close();
				} catch (IOException e) {
					LOGGER.error("getExternalConfig : IOException : ", e);
				}
		}
		return config;
	}
	
	
	public static Properties getProperties() {
		Properties properties = new Properties();
		try {
			properties.load(ConfigProperties.class.getResourceAsStream("/app.properties"));
			
		} catch (IOException e) {
			LOGGER.error("getProperties : IOException : ", e);
		}
		return properties;
	}
}
