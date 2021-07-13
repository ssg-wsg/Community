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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import tgs.dl.intfc.model.RequestData;
import tgs.dl.intfc.utils.JsonMapper;

public class TestUtils {
	private static final TestUtils INSTANCE = new TestUtils();
	
	public static TestUtils getInstance() {
        return INSTANCE;
    }

    private TestUtils() { }
	
	public String generateDesiarilizedRequest(String jsonString) {
		JsonMapper mapper = new JsonMapper();

		String serializedString = null;
		try {
			RequestData request = mapper.deserializeFromJson(jsonString, RequestData.class);
			serializedString = mapper.serializeToJson(request);
		} catch (JsonProcessingException e) {
			System.out.println(e.getMessage());
		} catch (IOException e) {
			System.out.println(e.getMessage());
		}
		return serializedString;
	}

	public String generateSerializedRequest(RequestData request) {
		JsonMapper mapper = new JsonMapper();
		String serializedString = null;
		try {

			serializedString = mapper.serializeToJson(request);
		} catch (JsonProcessingException e) {
			System.out.println(e.getMessage());
		}
		return serializedString;
	}
	
	public String generateDynamicRequest(String jsonString, int dataLength) {
		JsonMapper mapper = new JsonMapper();

		String serializedString = null;
		try {
			RequestData request = mapper.deserializeFromJson(jsonString, RequestData.class);
			
			JsonNode payloadNode = (ObjectNode) request.getPayload();
			((ObjectNode)payloadNode).put("addtionalTestData", generateStringWithLength(dataLength));
			
			request.setPayload(payloadNode);
			
			serializedString = mapper.serializeToJson(request);
			
		} catch (JsonProcessingException e) {
			System.out.println(e.getMessage());
		} catch (IOException e) {
			System.out.println(e.getMessage());
		}
		return serializedString;
	}

	protected String generateStringWithLength(int messageLength) {
		char[] charArray = new char[messageLength];
		Arrays.fill(charArray, 'x');
		return new String(charArray);
	}
	
	public String readFile(String file) {
		String content = null;
		try {
			InputStream inputStream =  getClass()
					.getClassLoader().getResourceAsStream(file);
			StringBuilder textBuilder = new StringBuilder();
			
		    try (Reader reader = new BufferedReader(new InputStreamReader
		      (inputStream, Charset.forName(StandardCharsets.UTF_8.name())))) {
		        int c = 0;
		        while ((c = reader.read()) != -1) {
		            textBuilder.append((char) c);
		        }
		    }
		    
		    content = textBuilder.toString();
		    
		}catch(Exception e) {
			System.out.println(e.getMessage());
		}
		return content;
	}
}
