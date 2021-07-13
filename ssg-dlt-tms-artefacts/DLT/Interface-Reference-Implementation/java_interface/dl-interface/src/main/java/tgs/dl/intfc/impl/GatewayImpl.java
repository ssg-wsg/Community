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

package tgs.dl.intfc.impl;

import java.io.IOException;
import java.util.Properties;

import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import tgs.dl.intfc.Gateway;
import tgs.dl.intfc.config.ConfigProperties;
import tgs.dl.intfc.model.RequestData;
import tgs.dl.intfc.utils.FormatterUtil;
import tgs.dl.intfc.utils.SchemaValidationUtil;

/***
 * Provides functionalities to interact to the DLT
 * 
 *
 */
public class GatewayImpl implements Gateway {

	private static final Logger LOGGER = LogManager.getLogger(GatewayImpl.class);
	private static final FormatterUtil FORMATTER_UTIL = new FormatterUtil();
	private static final SchemaValidationUtil SCHEMA_VALIDATION_UTIl = new SchemaValidationUtil();

	Properties properties = ConfigProperties.getProperties();

	public GatewayImpl() {
		LOGGER.info("Version: {}", properties.getProperty("version"));
		LOGGER.info("Active Profile: {}", properties.getProperty("profile.active"));
	}

	/***
	 * Implementation of writeToDLT
	 * 
	 * @param eventData as Json String
	 * @throws Exception : for null values and AWS Service exceptions
	 */
	@Override
	public void writeGrantsDataDLT(String eventData) throws Exception {
		LOGGER.trace("writeGrantsDataDLT : {}", eventData);

		if (StringUtils.isBlank(eventData)) {
			String msg = "Request should not be null or empty.";
			IOException e = new IOException(msg);
			LOGGER.error("writeGrantsDataDLT : ", e);
			throw e;
		}

		try {
			// validate request
			RequestData request = SCHEMA_VALIDATION_UTIl.validateWriteEventData(eventData);

			// format request
			boolean isEncrypt = true;
			String formattedData = FORMATTER_UTIL.formatRequestData(request, isEncrypt);
			LOGGER.trace("writeGrantsDataDLT : formattedData : {}", formattedData);

			// send formatted request to transaction handler
			new TransactionHandlerImpl().writeTransaction(formattedData);
		} catch (Exception e) {
			LOGGER.error("Exception: writeGrantsDataDLT : ", e);
			throw (e);
		}
	}

	/***
	 * Implementation of readFromDLT
	 * 
	 * @param queryKeys as Serialised Json
	 * @return Serialized Payload
	 * @throws Exception
	 */
	@Override
	public String readGrantsDataDLT(String queryKeys) throws Exception {
		LOGGER.trace("readGrantsDataDLT : {}", queryKeys);

		if (StringUtils.isBlank(queryKeys)) {
			String msg = "Query Keys should not be null or empty.";
			IOException e = new IOException(msg);
			LOGGER.error("readFromDLT : ", e);
			throw e;
		}

		String response = null;
		try {

			// validate request
			RequestData request = SCHEMA_VALIDATION_UTIl.validateReadEventData(queryKeys);

			// format request
			boolean isEncrypt = false;
			String formattedData = FORMATTER_UTIL.formatRequestData(request, isEncrypt);
			LOGGER.trace("readGrantsDataDLT : formattedData : {}", formattedData);

			// get result
			String result = new TransactionHandlerImpl().readTransaction(formattedData);
			LOGGER.trace("readGrantsDataDLT : result : {}", result);

			// format response
			response = FORMATTER_UTIL.formatReadResponseData(result);
			LOGGER.trace("readGrantsDataDLT : response : {}", response);
			return response;

		} catch (Exception e) {
			LOGGER.error("readGrantsDataDLT : Exception : ", e);
			throw (e);
		}
	}

}
