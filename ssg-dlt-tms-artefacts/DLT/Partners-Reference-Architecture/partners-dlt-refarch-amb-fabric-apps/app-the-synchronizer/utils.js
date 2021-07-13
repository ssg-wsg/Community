/*
# Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# 
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# or in the "license" file accompanying this file. This file is distributed 
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either 
# express or implied. See the License for the specific language governing 
# permissions and limitations under the License.
#
*/

'use strict;'

/**
 * Helper function allows to copy objects, but skipping some of the attributes.
 * Helps to create mutable copy of the object from imutable like the one produced by "config" module.
 * @function
 * @prop {Object} obj - The original object.
 * @prop {string []} keys - Array of attribute names to be excluded during the copy.
 * @returns {Object} - A copy of original object without attributes specified in "keys" parameter. 
 */

const objectWithoutProperties = function (obj, keys) {
	var target = {};
	for (var i in obj) {
		if (keys.indexOf(i) >= 0) continue;
		if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
		target[i] = obj[i];
	}
	return target;
};

/**
 * Helper function implementing forEach logic in a syncronous way
 * @function
 * @prop {array} array - An array of items to process through.
 * @callback callback - Async Function to process each iteration.
 */
const asyncForEach = async function (array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

module.exports.objectWithoutProperties = objectWithoutProperties;
module.exports.asyncForEach = asyncForEach;