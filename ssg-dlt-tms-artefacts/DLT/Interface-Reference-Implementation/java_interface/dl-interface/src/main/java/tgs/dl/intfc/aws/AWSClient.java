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

package tgs.dl.intfc.aws;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.AWSLambdaClientBuilder;
import com.amazonaws.services.secretsmanager.AWSSecretsManager;
import com.amazonaws.services.secretsmanager.AWSSecretsManagerClientBuilder;
import com.amazonaws.services.sqs.AmazonSQSAsync;
import com.amazonaws.services.sqs.AmazonSQSAsyncClientBuilder;
import com.amazonaws.util.StringUtils;

import tgs.dl.intfc.config.model.AWSProperties;
import tgs.dl.intfc.constants.Constants;

/***
 * Class for Building AWS Service Clients
 */
public class AWSClient {

	private static final Logger LOGGER = LogManager.getLogger(AWSClient.class);

	private AWSProperties awsProperties = Constants.AWS_PROPERTIES;
	private BasicAWSCredentials awsCreds;
	private Regions regionName;

	/***
	 * Set AWS credentials
	 * 
	 * @throws Exception
	 */
	public AWSClient() {
		initializeProperties();
	}
	
	private void initializeProperties() {
		try {
			this.awsProperties = getAWSProperties();
			this.awsCreds = new BasicAWSCredentials(awsProperties.getAccessKey(), awsProperties.getSecretKey());
			this.regionName = Regions.fromName(awsProperties.getRegion());
		} catch (Exception e) {
			LOGGER.error("initializeProperties : ", e);
		}
		
	}

	private AWSProperties getAWSProperties() throws Exception {
		AWSProperties properties = Constants.AWS_PROPERTIES;

		if (properties == null) {
			String msg = "AWS Credentials properties is not found.";
			Exception e = new Exception(msg);
			LOGGER.error("getAWSProperties : ", e);
			throw e;
		}
		if (StringUtils.isNullOrEmpty(properties.getAccessKey())
				|| StringUtils.isNullOrEmpty(properties.getSecretKey())) {
			String msg = "AWS Credentials has missing properties.";
			Exception e = new Exception(msg);
			LOGGER.error("getAWSProperties : ", msg);
			throw e;
		}

		return properties;
	}

	/***
	 * Set Lambda Client
	 * 
	 * @return Lambda Client
	 */
	public AWSLambda getLambdaClient() {
		try {
			return AWSLambdaClientBuilder.standard().withCredentials(new AWSStaticCredentialsProvider(awsCreds))
					.withRegion(regionName).build();
		} catch (Exception e) {
			LOGGER.error("getLambdaClient : Exception : ", e);
			throw (e);
		}
	}

	/***
	 * Set SQS Client
	 * 
	 * @return SQS Client
	 */
	public AmazonSQSAsync getSQSClient() {
		try {
			return AmazonSQSAsyncClientBuilder.standard().withCredentials(new AWSStaticCredentialsProvider(awsCreds))
					.withRegion(regionName).build();
		} catch (Exception e) {
			LOGGER.error("getSQSClient : Exception : ", e);
			throw (e);
		}
	}

	/***
	 * Set Secrets Manager Client
	 * @return AWSSecretsManagerClient
	 */
	public AWSSecretsManager getSecretsMgrClient() {
		try {
			return AWSSecretsManagerClientBuilder.standard().withRegion(regionName).build();
		} catch (Exception e) {
			LOGGER.error("getSecretsMgrClient : Exception : ", e);
			throw (e);
		}
	}

}
