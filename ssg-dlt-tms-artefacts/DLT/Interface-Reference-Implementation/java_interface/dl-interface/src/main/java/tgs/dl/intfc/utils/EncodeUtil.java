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

import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

public class EncodeUtil {
	
	/***
	 * Converts char array to Base 64 String
	 * @param char array
	 * @return String
	 */
	public static String charsToBase64String(char[] chars)
	{
	    final ByteBuffer byteBuffer = StandardCharsets.UTF_8.encode(CharBuffer.wrap(chars));
	    byte[] bytes = Arrays.copyOf(byteBuffer.array(), byteBuffer.limit());
	    return Base64.getEncoder().encodeToString(bytes);
	}
	
	/***
	 * Converts Base 64 String to char array
	 * @param base64String
	 * @return char array
	 */
	public static char[] base64StringToChars(String base64String)
	{
		byte[] bytes = Base64.getDecoder().decode(base64String); 
	    final CharBuffer charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
	    return Arrays.copyOf(charBuffer.array(), charBuffer.limit());    
	}
	
	/**
	 * Converts char array to base64 byte array
	 * @param char array
	 * @return byte array
	 */
	public static byte[] convertToBytes(SecureRandom random, char[] chars) {
		CharBuffer charBuffer = CharBuffer.wrap(chars);
	    ByteBuffer byteBuffer = Charset.forName(StandardCharsets.UTF_8.toString()).encode(charBuffer);
	    
	    Arrays.fill(charBuffer.array(), (char)(random.nextInt(26) + 'a'));
	    
	    ByteBuffer base64Buffer = Base64.getDecoder().decode(byteBuffer);
	    byte[] bytesArray = new byte[base64Buffer.remaining()];
	    base64Buffer.get(bytesArray, 0, bytesArray.length);
	    
	    random.nextBytes(byteBuffer.array());
	    random.nextBytes(base64Buffer.array());
	    
	    return bytesArray;
	}
}
