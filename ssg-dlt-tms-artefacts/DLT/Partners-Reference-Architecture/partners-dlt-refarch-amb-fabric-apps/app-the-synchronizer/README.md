# The Synchronizer of Faric World State with DynamoDB

The Synchronizer is a Node.js application that uses the Fabric SDK to listen for block creation events of a specific channel, extract the Write Set of valid transactions and persist them to DynamoDB table. This allows to optimize queries initiated from the RESTful API server against the data from the World State and impement extra features like pagination.

When the Synchronizer starts for the first time with empty target database, it will sync all blocks from the specified channel with numbers between `blockchain.startBlock` and `blockchain.endBlock` configuration paraneters specified in the configuration file `../config/default.json`. If you need to sync the whole world state and stop and listen for the new blocks to sync then in real time, leave both `blockchain.startBlock` and `blockchain.endBlock` empty.

The logic is as follows: 
- If `blockchain.startBlock` is empty, the Synchronizer will start from the first block in the channel.
- If `blockchain.endBlock` is empty, the Synchronizer will keep listening for the new blocks after syncing blocks before `blockchain.startBlock`.

## Pre-requisites

### Dependency 1: RESTful API server
The Synchronizer relies on the RESTful API server to generate the blockchain user credentials (keys and enrollemnt profile), therefore `blockchain.userName` should use the user name that is already registered and enrolled.  `blockchain.connectionProfilesFolder` is pointing to the folder on the file system with the RESTful API connection profiles.

### Dependency 2: DynamoDB
Apart from creating a table in DynamoDB (specified in config in `dynamodb.tableName`), it's required to create an index with name specified in `dynamodb.paginationIndex` for `docType` attribute in order to perform paginated queries of different document types later by the RESTful API server. This index is not required by the Synchronizer itsef but in order to work correctly it needs to be created before data items will start to be pushed to the table.

Although it is possible to configure the app using the files in `config` folder (you may find a sample config file in `../config/default.json`), we recommend to configure your app with environment variables that overwrite any values in the `config` folder. Below is the list of all environmental variables and mapping to configuration parameters is defined in `./config/ustom-environment-variables.json`

```
# Configuration parameters for The Synchronizer app
export AMB_APPS_SYNC_IS_MASTER=<false | true>          # Defines if the current instance starts in a master or slave mode. Default is slave. See "Highly available behavior" section in the README.md

export AMB_APPS_SYNC_LOG_LEVEL=<debug | info | error>  # Defines the log level for the app

export AMB_APPS_SYNC_BC_NETWORK_ID=<amb_network_id>    # An ID of the network created in AMB service, e.g.: n-JMRTZFI43BCNHC7DSXS7T5MATU

export AMB_APPS_SYNC_BC_MEMBER_ID=<amb_member_id>      # An ID of the member of the network in AMB service, e.g.: m-WB2QHDUUVNEKTO2T6GRPME4OXE

export AMB_APPS_SYNC_BC_USER_NAME=<user_enrollment_id> # An enrollment id of the user that will be used to connect and watch for the block events. E.g. "admin"

export AMB_APPS_SYNC_BC_CHANNEL_NAME=<channel_name>    # A name of a channel to listen the events from. E.g. "testnet

export AMB_APPS_SYNC_BC_PEER_ID=<peer_id>              # An ID of the peer that The Sychronizer app will connect to. The app can connect to any peer, as long as the user identity has enough authorization. E.g.: nd-3GG4GQ3ZIBBWHMDKYDGD6QEGZA

export AMB_APPS_SYNC_BC_START_BLOCK=<block_number>     # A block number to start synchronization from every time the app starts or re-starts. To synchronize from the latest block, use -1.

export AMB_APPS_SYNC_BC_END_BLOCK=<block_number>       # A block number to stop synchronization on, every time the app starts or re-starts. To leave the app constantly watching for the latest block, use -1.

export AMB_APPS_SYNC_BC_MAX_EVENT_HUB_RETRIES=<number_of_retries> # A number of retries in case the EventsHub drops connection. Default value is 10.

export AMB_APPS_SYNC_DYNAMO_TABLE_NAME=<dynamodb_table_name> # A name of a target table to synchronize data to. There should be one table per channel in case multiple instances of The Synchronizer are syncing data for multiple channels. E.g.  "amb-testnet-blockchainWriteSet"

export AMB_APPS_SYNC_DYNAMO_PROFILE_NAME=default # A credentials profile if the app is running on a local machine.

export AMB_APPS_SYNC_DYNAMO_REGION=<aws_region_id> # And ID of the region to create DynamoDB service. E.g. "us-east-1"

export AMB_APPS_SYNC_DYNAMO_PAGINATION_INDEX=<index_if> # And ID of an index that will be used to retrieve multiple data items with pagination. E.g. "docType-index"
```

### Highly available behavior
By default the Synchronizer starts as `slave` instance and waits for five seconds after receiving the block before starting to send data to the DynamoDB. It retrieves the latest block number from the table and if it is lower than the one in the database, it will switch to become `master`. You can force the instance to start as master by setting `isMaster` to `true` in the config.

## To run The Synchronizer locally as a node application:

### Step 1 - Check configuration for the main configuration parameters
The following configuration parameters do not have any default values and therefore need to be set before starting the app:
- AMB_APPS_SYNC_BC_NETWORK_ID
- AMB_APPS_SYNC_BC_MEMBER_ID
- AMB_APPS_SYNC_BC_USER_NAME
- AMB_APPS_SYNC_BC_CHANNEL_NAME
- AMB_APPS_SYNC_DYNAMO_TABLE_NAME

In case you run it on a local machine, you might need to set up AWS vars as well:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

You may use `./test/env.sh` to automate the setup.

### Step 2 - Run the Synchronizer
Run `./start.sh` or `npm start`.

## To build a Docker image with The Synchronizer:

### Step 1 - Check configuration for the main configuration parameters
In `./test/docker-env.list` check the values for the following configuration parameters:
- AMB_APPS_SYNC_BC_NETWORK_ID
- AMB_APPS_SYNC_BC_MEMBER_ID
- AMB_APPS_SYNC_BC_USER_NAME
- AMB_APPS_SYNC_BC_CHANNEL_NAME
- AMB_APPS_SYNC_DYNAMO_TABLE_NAME

In case you run it on a local machine, you might need to set up AWS vars as well:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

### Step 2 - Build a Docker image (assuming you already have docker cli installed and configured)
Inside `app-the-synchronizer` folder:
- `docker build . -`
