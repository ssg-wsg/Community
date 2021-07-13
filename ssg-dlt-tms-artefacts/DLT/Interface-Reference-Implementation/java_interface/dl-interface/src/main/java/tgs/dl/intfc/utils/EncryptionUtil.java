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

import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bouncycastle.crypto.engines.AESEngine;
import org.bouncycastle.crypto.modes.CBCBlockCipher;
import org.bouncycastle.crypto.paddings.BlockCipherPadding;
import org.bouncycastle.crypto.paddings.PKCS7Padding;
import org.bouncycastle.crypto.paddings.PaddedBufferedBlockCipher;
import org.bouncycastle.crypto.params.KeyParameter;
import org.bouncycastle.crypto.params.ParametersWithIV;

public class EncryptionUtil{
	private static final Logger LOGGER = LogManager.getLogger(EncryptionUtil.class);
	final SecureRandom random = createSecureRandom();

	/**
	 * Generates a random iv
	 * @return byte array of generated random iv
	 */
	public byte[] generateRandomIV() {
		return random.generateSeed(16);
	}
	
	/**
	 * Encrypts a message
	 * @param dataKey: key used for cipher
	 * @param message: message to encrypt
	 * @param iv: random iv 
	 * @return String of encrypted message
	 * @throws Exception
	 */
	public String encryptMessage(char[] dataKey, String message, byte[] iv) throws Exception  {
		
		byte[] keys = null;
		KeyParameter keyParam = null;
		ParametersWithIV keyParamWithIV = null;
		try {
			
		    AESEngine engine = new AESEngine();
		    CBCBlockCipher blockCipher = new CBCBlockCipher(engine);
		    BlockCipherPadding padding = new PKCS7Padding();
		    PaddedBufferedBlockCipher cipher = new PaddedBufferedBlockCipher(blockCipher, padding); 
		    
		    //convert key to bytes
		    keys = EncodeUtil.convertToBytes(random, dataKey);
		    
		    //set cipher parameters
		    keyParam = new KeyParameter(keys);
		    keyParamWithIV = new ParametersWithIV(keyParam, iv, 0, iv.length);
		    cipher.init(true, keyParamWithIV);
		    
		    byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
		    byte[] outputBytes = new byte[cipher.getOutputSize(messageBytes.length)];
		    int length = cipher.processBytes(message.getBytes(),0,messageBytes.length, outputBytes, 0);
		    cipher.doFinal(outputBytes, length); 
		    
		    return Base64.getEncoder().encodeToString(outputBytes);
		}catch(Exception e) {
			LOGGER.error("encryptMessage : ", e);
			throw (e);
		}finally {
			//clear keys
			if(keyParam != null) keyParam = null;
			if(keyParamWithIV != null) keyParamWithIV = null;
			if(dataKey != null && keys != null) clearKeys(dataKey, keys);
		}
	}

	/**
	 * Decrypts a message
	 * @param dataKey: key used for cipher
	 * @param message: message to decrypt
	 * @param iv: random iv 
	 * @return String of decrypted message
	 * @throws Exception
	 */
	public String decryptMessage(char[] dataKey, String encryptedMessage, byte[] iv) throws Exception {
		byte[] keys = null;
		KeyParameter keyParam = null;
		ParametersWithIV keyParamWithIV = null;
		try {
			
			AESEngine engine = new AESEngine();
		    CBCBlockCipher blockCipher = new CBCBlockCipher(engine); 
		    BlockCipherPadding padding = new PKCS7Padding();
		    PaddedBufferedBlockCipher cipher = new PaddedBufferedBlockCipher(blockCipher, padding); 
		    
		    //convert key to bytes
		    keys = EncodeUtil.convertToBytes(random, dataKey);
		    
		    //set cipher parameters
		    keyParam = new KeyParameter(keys);
		    keyParamWithIV = new ParametersWithIV(keyParam, iv, 0, iv.length);
		    cipher.init(false, keyParamWithIV);
		    
		    byte[] outputBytes = Base64.getDecoder().decode(encryptedMessage);
		    byte[] comparisonBytes = new byte[cipher.getOutputSize(outputBytes.length)];
		    int length = cipher.processBytes(outputBytes, 0, outputBytes.length, comparisonBytes, 0);
		    cipher.doFinal(comparisonBytes, length);
		    
		    return new String(comparisonBytes).trim();
		}catch(Exception e) {
			LOGGER.error("decryptMessage : ", e);
			throw(e);
		}finally {
			//clear keys
			if(keyParam != null) keyParam = null;
			if(keyParamWithIV != null) keyParamWithIV = null;
			if(dataKey != null && keys != null) clearKeys(dataKey, keys);
		}
	}
	
	/**
	 * Clears array of characters
	 * @param chars array
	 */
	public void clearKeys(char[] chars) {
		Arrays.fill(chars, (char)(random.nextInt(26) + 'a'));
	}
	
	
	/***
	 * Clears array of characters and array of bytes
	 * @param chars array
	 * @param bytes array
	 */
	private void clearKeys(char[] chars, byte[] bytes) {
		Arrays.fill(chars, (char)(random.nextInt(26) + 'a'));
		random.nextBytes(bytes);
	}
	
	/***
	 * Instantiate Secure Random
	 * @return
	 */
	private static SecureRandom createSecureRandom() {
		try {
			return SecureRandom.getInstanceStrong();
		} catch (NoSuchAlgorithmException nae) {
			LOGGER.warn("Couldn't create strong secure random generator; reason: {}.", nae.getMessage());
			return new SecureRandom();
		}
	}
	
}
