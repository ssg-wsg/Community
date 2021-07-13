Run the `fcn-share-certs` function to share admin certificate and root certificate authority certificate with the CHANNEL ADMIN through the channel S3 bucket.
	
Trigger Lambda function to share required certificates to the channel S3 bucket and generate a new member object:
	
Open list of Lambda functions in the Lambda Console.
Choose the lambda function starting with name amb-devops-lambda-sharecerts-*
Configure a test event in the upper right corner with the following format:
{
	"memberId": "<AMB_MEMBER_ID>",
	"connectionProfileUpdate": "<CONFIG_STRING_FROM_STEP_1>"
}
You may find an example in fcn-share-certs/tests/event.json. 
Example of function-generated setup object:
	
```
"newMemberData": "{\"newMemberAccountId\":\"728055174776\",\"newMemberId\":\"m-K2DKRVZSWNGSHPBR23QQNOZIDU\",\"connectionProfileUpdate\":{\"channelProfile\":{\"name\":\"testchannel\",\"s3BucketName\":\"amb-devops-testchannel-shared\",\"orderers\":[\"orderer1\"],\"peers\":{\"nd-BMMR5ASKW5BXNGEKNGUMLNZV6A\":{\"endorsingPeer\":true,\"chaincodeQuery\":true,\"ledgerQuery\":true,\"eventSource\":true}}},\"organizationProfile\":{\"name\":\"m-K2DKRVZSWNGSHPBR23QQNOZIDU\",\"mspid\":\"m-K2DKRVZSWNGSHPBR23QQNOZIDU\",\"peers\":[\"nd-5URGKZNFKVB5TOWRTFXV4L66NA\"],\"certificateAuthorities\":[\"m-K2DKRVZSWNGSHPBR23QQNOZIDU\"]},\"endorsingPeerProfiles\":[{\"name\":\"nd-5URGKZNFKVB5TOWRTFXV4L66NA\",\"url\":\"grpcs://nd-5urgkznfkvb5towrtfxv4l66na.m-k2dkrvzswngshpbr23qqnozidu.n-oiflkxucujdpnf734kf2bmyaxu.managedblockchain.us-east-1.amazonaws.com:30006\",\"eventUrl\":\"grpcs://nd-5urgkznfkvb5towrtfxv4l66na.m-k2dkrvzswngshpbr23qqnozidu.n-oiflkxucujdpnf734kf2bmyaxu.managedblockchain.us-east-1.amazonaws.com:30007\",\"grpcOptions\":{\"ssl-target-name-override\":\"nd-5urgkznfkvb5towrtfxv4l66na.m-k2dkrvzswngshpbr23qqnozidu.n-oiflkxucujdpnf734kf2bmyaxu.managedblockchain.us-east-1.amazonaws.com\"},\"tlsCACerts\":{\"path\":\"/tmp/managedblockchain-tls-chain.pem\"}}]}}"
```
	
Copy and pass the output from this function back to the CHANNEL ADMIN.