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

namespace DL.Interface
{
   
    /// <summary>
    /// model class for Request Data object
    /// </summary>
    public class RequestData
    {
        public dynamic header { get; set; }
        public dynamic payload { get; set; }
        public dynamic publicPayload { get; set; }
        public dynamic dltData { get; set; }
        public override string ToString()
        {
            return " Header : " + header.ToString() + " Payload : " + payload + " PublicPayload : " + publicPayload + " DltData : " + dltData;
        }

    }

    public class DLTPayload
    {
        public string networkId { get; set; }
        public string memberId { get; set; }
        public string channelName { get; set; }
        public string userEnrollmentId { get; set; }
        public string chaincodeName { get; set; }
        public string triggerType { get; set; }
        public string functionName { get; set; }
        public RequestData[] args { get; set; }
        public override string ToString()
        {
            return " Network Id : " + networkId + " Member Id : " + memberId + " Channel Name : " + channelName
                + " User Enrolment Id : " + userEnrollmentId + " Chaincode Name : " + chaincodeName + " Trigger Type : " + triggerType
                + " Trigger Type : " + triggerType + " Function Name : " + functionName + " Args : " + args; ;
        }
    }

}