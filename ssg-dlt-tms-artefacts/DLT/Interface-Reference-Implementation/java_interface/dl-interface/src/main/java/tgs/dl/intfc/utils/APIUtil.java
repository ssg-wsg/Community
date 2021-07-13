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

package tgs.dl.intfc.utils;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import tgs.dl.intfc.utils.model.APIResponse;

public class APIUtil {

	private static final Logger LOGGER = LogManager.getLogger(APIUtil.class);

	public APIResponse apiGetRequest(String requestURL, Map<String, String> parameters) throws Exception {
		CloseableHttpClient client = null;
		try {
			client = HttpClients.createDefault();
			requestURL = requestURL + "?" + getParamsString(parameters);
			HttpGet request = new HttpGet(requestURL);

			CloseableHttpResponse response = client.execute(request);
			APIResponse apiResponse = new APIResponse();
			apiResponse.setStatus(response.getStatusLine().getStatusCode());

			HttpEntity responseEntity = response.getEntity();
			if (responseEntity != null) {
				apiResponse.setResult(EntityUtils.toString(responseEntity));
				EntityUtils.consume(responseEntity);
			}
			return apiResponse;
		} catch (Exception e) {
			LOGGER.error("apiRequest : Exception : ", e);
			throw (e);
		} finally {
			if (client != null)
				client.close();
		}
	}

	public APIResponse apiPostRequest(String requestURL, String jsonString) throws Exception {
		CloseableHttpClient client = null;
		try {
			client = HttpClients.createDefault();
			HttpPost httpPost = new HttpPost(requestURL);
			httpPost.setHeader("Accept", "application/json");
			httpPost.setHeader("Content-type", "application/json");
			
			StringEntity entity = new StringEntity(jsonString);
			httpPost.setEntity(entity);
			
			CloseableHttpResponse response = client.execute(httpPost);
			APIResponse apiResponse = new APIResponse();
			apiResponse.setStatus(response.getStatusLine().getStatusCode());
			HttpEntity responseEntity = response.getEntity();

			if (responseEntity != null) {
				apiResponse.setResult(EntityUtils.toString(responseEntity));
				EntityUtils.consume(responseEntity);
			}
			return apiResponse;
		} catch (Exception e) {
			LOGGER.error("apiRequest : Exception : ", e);
			throw (e);
		} finally {
			if (client != null)
				client.close();
		}
	}
	
	public APIResponse apiPostRequest(String requestURL, Map<String, String> headerParameters, String jsonString) throws Exception {
		CloseableHttpClient client = null;
		try {
			client = HttpClients.createDefault();
			HttpPost httpPost = new HttpPost(requestURL);
			
			httpPost.setHeader("Accept", "application/json");
			httpPost.setHeader("Content-type", "application/json");
			
			httpPost = setPostHeaderAdditionalParams(httpPost, headerParameters);
			
			StringEntity entity = new StringEntity(jsonString);
			httpPost.setEntity(entity);
			
			CloseableHttpResponse response = client.execute(httpPost);
			APIResponse apiResponse = new APIResponse();
			apiResponse.setStatus(response.getStatusLine().getStatusCode());
			HttpEntity responseEntity = response.getEntity();

			if (responseEntity != null) {
				apiResponse.setResult(EntityUtils.toString(responseEntity));
				EntityUtils.consume(responseEntity);
			}
			return apiResponse;
		} catch (Exception e) {
			LOGGER.error("apiRequest : Exception : ", e);
			throw (e);
		} finally {
			if (client != null)
				client.close();
		}
	}

	private static String getParamsString(Map<String, String> params) throws UnsupportedEncodingException {
		StringBuilder result = new StringBuilder();

		for (Map.Entry<String, String> entry : params.entrySet()) {
			result.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8.toString()));
			result.append("=");
			result.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8.toString()));
			result.append("&");
		}

		String resultString = result.toString();
		return resultString.length() > 0 ? resultString.substring(0, resultString.length() - 1) : resultString;
	}
	
	private static HttpPost setPostHeaderAdditionalParams(HttpPost httpPost, Map<String, String> params)  {

		for (Map.Entry<String, String> entry : params.entrySet()) {
			httpPost.setHeader(entry.getKey(), entry.getValue());
		}
		
		return httpPost;
	}
}
