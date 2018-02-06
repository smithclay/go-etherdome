const log = require('lambda-log');
const AWS = require('aws-sdk');

if (process.env.AWS_SAM_LOCAL) {
    // awslocal dynamodb create-table --table-name NetworksTable --attribute-definitions AttributeName=user_id,AttributeType=S --key-schema AttributeName=user_id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
    AWS.config.update({
      endpoint: "http://192.168.0.105:4569"
    });
    process.env.TABLE_NAME = 'NetworksTable';
}

var docClient = new AWS.DynamoDB.DocumentClient()

const ListNetworks = (userId, cb) => {
    var params = {
        TableName : process.env.TABLE_NAME,
        ExpressionAttributeValues: {
            ":id": userId
        },
        KeyConditionExpression: "user_id = :id"
    };

    docClient.query(params, function(err, data) {
        if (err) {
            log.error(`Unable to query. Error: ${JSON.stringify(err, null, 2)}`);
            cb(err);
        } else {
            cb(null, data.Items);
        }
    });
};

const CreateNetwork = (userId, cb) => {
    var params = {
        TableName: process.env.TABLE_NAME,
        Item: {
            "user_id": userId,
            "name": 'This is a test network name',
            "created_on": (new Date()).toISOString()
        }
    };
    console.log("Adding a new item...");
    docClient.put(params, function(err, data) {
        if (err) {
            log.error(`Unable to add item. Error JSON: ${JSON.stringify(err, null, 2)}`);
            return cb(err);
        }
        console.log("Added item:", JSON.stringify(data, null, 2));
        cb(null, data);
    });
}

exports.handler = (event, context, callback) => {
  log.info(JSON.stringify(event));

  var principalId = event.requestContext.authorizer.principalId;
  // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.03.html
  ListNetworks(principalId, (err, data) => {
    if (err) {
        return callback(null, { statusCode: 500, body: err });
    }
    callback(null, { statusCode: 200, body: JSON.stringify(data) });
  });
  /*CreateNetwork(principalId, (err, data) => {
    if (err) {
        return callback(null, { statusCode: 500, body: err });
    }
    callback(null, { statusCode: 201, body: JSON.stringify(data) });
  });*/
};
