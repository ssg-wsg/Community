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

package tgs.dl.infc.app;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import tgs.dl.intfc.model.RequestData;
import tgs.dl.intfc.utils.JsonMapper;

@RestController
@RequestMapping("/grants")
public class GatewayController {
	
	@Autowired
	private GatewayService gatewayService;

	@PostMapping("/writeData")
	public ResponseEntity<GatewayResponse> writeGrantsData(@RequestBody RequestData request) {
		
		GatewayResponse response = gatewayService.writeGrantsData(request);

		if (response.getStatus() == HttpStatus.CREATED.value()) {
			return ResponseEntity.ok(response);
		}
		return ResponseEntity.badRequest().body(response);
	}

	@PostMapping("/readData")
	public ResponseEntity<String> readGrantsData(@RequestBody RequestData request) throws IOException {
		GatewayResponse response = gatewayService.readGrantsData(request);

		if (response.getStatus() == HttpStatus.OK.value()) {
			String result = new JsonMapper().serializeToPrettyJson(response);
			result = result.replaceAll("\\\\", "");
			return ResponseEntity.ok(result);
		}
		return ResponseEntity.notFound().build();
	}

}
