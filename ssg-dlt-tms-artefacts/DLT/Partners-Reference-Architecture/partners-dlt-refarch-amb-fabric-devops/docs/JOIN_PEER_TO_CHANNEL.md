To join peer to a channel repeat the following steps to trigger Lambda function:
     - Go to a list of Lambda functions in the [Lambda Console](https://console.aws.amazon.com/lambda/home).
     - Choose lambda function starting with `amb-devops-lambda-joinchannels-*`
     - Configure a test event in the upper right corner with the following format:
     ```
      {
          "networkId": "<AMB_NETWORK_ID>",
          "memberId": "<AMB_MEMBER_ID>",
          "peerId": "<PEER_ID>",
          "channelsNames": ["<CHANNEL_NAME>"]
      }
     ```
     You may find an example in `fcn-join-channels/tests/event.json` .

Now we can continue with installing chaincode and, in case it's a new chaincode, instantiating it on a channel.