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

const exec = require('child_process').exec;
// const util = require('util');
// const exec = util.promisify(require('child_process').exec);

let logger = require("./logging").getLogger("run-cmd");

const runCMD = (command) => {
    const fcnName = "[runCMD]"

    logger.debug(`${fcnName} Executing command: ${command}`);

    return new Promise(async (resolve, reject) => {
        let proc = exec(command);
        let response = "";
        proc.stdout.on('data', (data) => {
            response = response + data;
        });

        proc.stderr.on('data', function (data) {
            response = response + data;
        });

        proc.stderr.on('error', (err) => {
            console.error(err);
            throw new Error(`${fcnName} ${err}`);
        });

        proc.on('exit', function (code) {
            console.debug(`${fcnName} Executed command. Exit code: ${code}`);
            // if (code > 0) {
            //     throw new Error(`${fcnName} Command exited with code > 0 `);
            // }
            resolve(response);
        });
        //Option 1:
        // try {
        //     const {
        //         stdout,
        //         stderr
        //     } = await exec(command);
        //     if (stderr) {
        //         resolve(stderr);
        //     }
        //     resolve(stdout);
        // } catch (err) {
        //     throw new Error(`${fcnName} ${err}`);
        // }
        //Option 2:
        // const child = exec(command, (err, stdout, stderr) => {
        //     // Resolve with result of process
        //     if (err) {
        //         //reject(`${fcnName}: ${err}`);
        //         throw new Error(`${fcnName} ${err}`);
        //     }
        //     if (stderr) {
        //         resolve(stderr);
        //     }
        //     resolve(stdout);
        // });

        // Log process stdout and stderr
        // child.stdout.on('data', console.debug);
        // child.stderr.on('error', (err) => {
        //     console.error(err);
        //     throw new Error(`${fcnName} ${err}`);
        // });
    })
}

module.exports = runCMD;