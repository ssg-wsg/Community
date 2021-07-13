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

package tgs.dl.test.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class DateUtil {
	
	private static final Logger LOGGER = LogManager.getLogger(DateUtil.class);
	public static final String ZONE_ID_UTC = "UTC+0800";

	public static String getFormattedDateTime() {
		try {
			LocalDateTime now = LocalDateTime.now();
	        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
	        return now.format(formatter);
		} catch (Exception e) {
			LOGGER.error("getFormattedDateTime : ", e);
			throw (e);
		}
	}
	
	public static long getTimestampInMilliseconds() {
		try {
	        return Instant.now().toEpochMilli();
		} catch (Exception e) {
			LOGGER.error("getTimestampInMilliseconds : ", e);
			throw (e);
		}
	}
	
	public static ZonedDateTime convertToISOZoneDateTime(String dateString) {
		try {
			DateTimeFormatter dtf = DateTimeFormatter.ISO_DATE_TIME;
			return ZonedDateTime.parse(dateString, dtf);
		} catch (Exception e) {
			LOGGER.error("convertToISOZoneDateTime : ", e);
			throw (e);
		}
	}
	
	public static ZonedDateTime getLocalZoneDateTimeByZoneId(String zoneId) {
		try {
			return LocalDateTime.now().atZone(ZoneId.of(zoneId));
		} catch (Exception e) {
			LOGGER.error("getLocalZoneDateTimeByZoneId : ", e);
			throw (e);
		}
	}
}
