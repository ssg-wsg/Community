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

const AWS = require('aws-sdk');
const logger = require("./logging").getLogger("cloud-watch-client");
const Utils = require('./utils');

const ALARM_NAME_PREFIX = process.env.AMB_DEVOPS_CW_ALARM_NAME_PREFIX ? `${process.env.AMB_DEVOPS_CW_ALARM_NAME_PREFIX}-"NodeAvailability-"` : "NodeAvailability-"

module.exports = class CW {
    constructor(context) {
        const fcnName = "[CW.constructor]"
        let self = this;
        return new Promise(async (resolve, reject) => {

            try {
                // set a timeout on the AWS SDK calls, to ensure they complete before the Lambda timeout. We do not want to
                // throw an exception if the Lambda times out, otherwise this will raise a false CW alarm
                if (context) {
                    AWS.config.update({
                        httpOptions: {
                            connectTimeout: context.getRemainingTimeInMillis() - 2 * 1000, // timeout after failing to establish a connection
                            timeout: context.getRemainingTimeInMillis() - 1 * 1000 // timeout after a period of inactivity
                        }
                    });
                }
                self.cloudwatch = new AWS.CloudWatch();
                self.cloudformation = new AWS.CloudFormation();
                resolve(self);
            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
    putMetricData(networkId, memberId, memberIsOwned, nodeId, nodeInstanceType, nodeAvailabilityZone, nodeAvailable) {
        const fcnName = "[CW.putMetricData]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Putting metric data`);

            try {
                if (!networkId || !networkId instanceof String || !networkId.length) {
                    throw new Error(`${fcnName} Please specify "networkId", current value: ${JSON.stringify(networkId)}`)
                };
                if (!memberId || !memberId instanceof String || !memberId.length) {
                    throw new Error(`${fcnName} Please specify "memberId", current value: ${JSON.stringify(memberId)}`)
                };
                if (!memberIsOwned) {
                    throw new Error(`${fcnName} Please specify "memberIsOwned", current value: ${JSON.stringify(memberIsOwned)}`)
                };
                if (!nodeId || !nodeId instanceof String || !nodeId.length) {
                    throw new Error(`${fcnName} Please specify "nodeId", current value: ${JSON.stringify(nodeId)}`)
                };
                if (!nodeInstanceType || !nodeInstanceType instanceof String || !nodeInstanceType.length) {
                    throw new Error(`${fcnName} Please specify "nodeInstanceType", current value: ${JSON.stringify(nodeInstanceType)}`)
                };
                if (!nodeAvailabilityZone || !nodeAvailabilityZone instanceof String || !nodeAvailabilityZone.length) {
                    throw new Error(`${fcnName} Please specify "nodeAvailabilityZone", current value: ${JSON.stringify(nodeAvailabilityZone)}`)
                };
                if (nodeAvailable !== 1 && nodeAvailable !== 0) {
                    throw new Error(`${fcnName} Please specify "nodeAvailable" as 1 or 0, current value: ${JSON.stringify(nodeAvailable)}`)
                };

                // Publish a custom metric for each node to indidate whether available or not
                const cwParams = {
                    Namespace: 'custom/managedblockchain',
                    MetricData: [{
                        MetricName: 'Availability',
                        Dimensions: [{
                                Name: 'NetworkId',
                                Value: networkId
                            },
                            {
                                Name: 'MemberId',
                                Value: memberId
                            },
                            {
                                Name: 'AccountOwnsMember',
                                Value: memberIsOwned.toString()
                            },
                            {
                                Name: 'NodeId',
                                Value: nodeId
                            },
                            {
                                Name: 'NodeInstanceType',
                                Value: nodeInstanceType
                            },
                            {
                                Name: 'NodeAvailabilityZone',
                                Value: nodeAvailabilityZone
                            }
                        ],
                        StorageResolution: '60',
                        Unit: 'Count',
                        Value: nodeAvailable
                    }, ]
                };
                let cwMetric = await self.cloudwatch.putMetricData(cwParams).promise();
                logger.debug(`${fcnName} Output of putMetricData called during peer health check: ${JSON.stringify(cwMetric)}`);
                resolve(cwMetric);

            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }

    putMetricAlarm(networkId, memberId, alarmName, memberIsOwned, nodeId, nodeInstanceType, nodeAvailabilityZone, alarmSNSTopicARN) {
        const fcnName = "[CW.putMetricAlarm]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Putting metric alarm`);

            try {
                if (!networkId || !networkId instanceof String || !networkId.length) {
                    throw new Error(`${fcnName} Please specify "networkId", current value: ${JSON.stringify(networkId)}`)
                };
                if (!alarmSNSTopicARN || !alarmSNSTopicARN instanceof String || !alarmSNSTopicARN.length) {
                    throw new Error(`${fcnName} Please specify "alarmSNSTopicARN", current value: ${JSON.stringify(alarmSNSTopicARN)}`)
                };
                // if (!alarmName || !alarmName instanceof String || !alarmName.length) {
                //     throw new Error(`${fcnName} Please specify "alarmName", current value: ${JSON.stringify(alarmName)}`)
                // };
                if (!memberId || !memberId instanceof String || !memberId.length) {
                    throw new Error(`${fcnName} Please specify "memberId", current value: ${JSON.stringify(memberId)}`)
                };
                if (!memberIsOwned) {
                    throw new Error(`${fcnName} Please specify "memberIsOwned", current value: ${JSON.stringify(memberIsOwned)}`)
                };
                if (!nodeId || !nodeId instanceof String || !nodeId.length) {
                    throw new Error(`${fcnName} Please specify "nodeId", current value: ${JSON.stringify(nodeId)}`)
                };
                if (!nodeInstanceType || !nodeInstanceType instanceof String || !nodeInstanceType.length) {
                    throw new Error(`${fcnName} Please specify "nodeInstanceType", current value: ${JSON.stringify(nodeInstanceType)}`)
                };
                if (!nodeAvailabilityZone || !nodeAvailabilityZone instanceof String || !nodeAvailabilityZone.length) {
                    throw new Error(`${fcnName} Please specify "nodeAvailabilityZone", current value: ${JSON.stringify(nodeAvailabilityZone)}`)
                };

                // Get the ARN of the SNS Topic created in the peer-health CloudFormation stack. The alarm will be published
                // to this topic. If the code below does not find the topic, the alarm is still created, though it has no
                // topic subscription
                // const stackParams = {
                //     'StackName': networkName + '-peer-health'
                // };
                // let snsTopicName;
                // const stackInfo = await cloudformation.describeStacks(stackParams).promise();
                // logger.debug(`${fcnName} Stackinfo for stack: ${stackParams} ${JSON.stringify(stackInfo)}`);
                // for (let i = 0; i < stackInfo.Stacks[0].Outputs.length; i++) {
                //     if (stackInfo.Stacks[0].Outputs[i].OutputKey == "PeerNodeAlarmTopic") {
                //         snsTopicName = stackInfo.Stacks[0].Outputs[i].OutputValue;
                //         break;
                //     }
                // }

                // const allExports = this.cloudformation.listExports().promise();

                // let snsTopicName = "";
                // await Utils(allExports.Exports, (exportedValue) => {
                //     if(exportedValue.includes("-AlarmSNSTopic"))
                // })

                // Publish a custom metric for each node to indicate whether available or not
                let cwAlarmParams = {
                    AlarmName: alarmName ? alarmName : `${ALARM_NAME_PREFIX}${nodeId}`,
                    ComparisonOperator: 'LessThanThreshold',
                    EvaluationPeriods: '1',
                    AlarmDescription: 'Alarm if managed blockchain peer node becomes UNAVAILABLE',
                    ActionsEnabled: true,
                    AlarmActions: [alarmSNSTopicARN],
                    Dimensions: [{
                            Name: 'NetworkId',
                            Value: networkId
                        },
                        {
                            Name: 'MemberId',
                            Value: memberId
                        },
                        {
                            Name: 'AccountOwnsMember',
                            Value: memberIsOwned.toString()
                        },
                        {
                            Name: 'NodeId',
                            Value: nodeId
                        },
                        {
                            Name: 'NodeInstanceType',
                            Value: nodeInstanceType
                        },
                        {
                            Name: 'NodeAvailabilityZone',
                            Value: nodeAvailabilityZone
                        }
                    ],
                    MetricName: 'Availability',
                    Namespace: 'custom/managedblockchain',
                    Period: '60',
                    Statistic: 'Sum',
                    Threshold: '1',
                    TreatMissingData: 'missing'
                };
                let cwAlarm = await self.cloudwatch.putMetricAlarm(cwAlarmParams).promise();
                logger.debug(`${fcnName} Pushing alarms to topic: ${alarmSNSTopicARN}. Output of putMetricAlarm during peer health check: ${JSON.stringify(cwAlarmParams)}`);
                resolve(cwAlarm);

            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }

    describeAlarms(alarmPrefix) {
        const fcnName = "[CW.describeAlarms]"
        let self = this;
        return new Promise(async (resolve, reject) => {
            logger.debug(`${fcnName} Requesting alarms with prefix ${alarmPrefix}`);

            try {
                if (!alarmPrefix || !alarmPrefix instanceof String || !alarmPrefix.length) {
                    throw new Error(`${fcnName} Please specify "alarmPrefix", current value: ${JSON.stringify(alarmPrefix)}`)
                };

                const cwAlarmParams = {
                    AlarmNamePrefix: alarmPrefix
                }

                let cwAlarms = await self.cloudwatch.describeAlarms(cwAlarmParams).promise();
                let output = [];
                if (cwAlarms.MetricAlarms) {
                    output = cwAlarms.MetricAlarms
                }
                logger.debug(`${fcnName} Output of describeAlarms: ${JSON.stringify(output)}`);
                resolve(output);

            } catch (err) {
                reject(`${fcnName}: ${err}`);
                throw new Error(`${fcnName}: ${err}`);
            }
        });
    }
}