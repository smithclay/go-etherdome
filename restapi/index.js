const log = require('lambda-log');
const AWS = require('aws-sdk');
const uuidv1 = require('uuid/v1')

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
            // TODO: generate funny name
            // "name": 'This is a test network name',
            "uuid": uuidv1(),
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

const GetNetwork = (userId, networkId, cb) => {
    var params = {
        TableName: process.env.TABLE_NAME,
        AttributesToGet: ["user_id"],
        Key: {
            "userID": userId
        }
    };
    docClient.getItem(params, function(err, data) {
        if (err) {
            return cb(err);
        }
        cb(null, data);
    });
}

exports.handler = (event, context, callback) => {
  log.info(JSON.stringify(event));

  var principalId = event.requestContext.authorizer.principalId;
  if (event.path === '/networks' && event.httpMethod === 'GET') {
    ListNetworks(principalId, (err, data) => {
        if (err) {
            return callback(null, { statusCode: 500, body: err });
        }
        callback(null, { statusCode: 200, body: JSON.stringify(data) });
     });
  } else if (event.path === '/networks' && event.httpMethod === 'POST') {
    CreateNetwork(principalId, (err, data) => {
        if (err) {
            return callback(null, { statusCode: 500, body: err });
        }
        callback(null, { statusCode: 201, body: JSON.stringify(data) });
    });
  } else if (event.resource === '/networks/{networkId}' && event.httpMethod === 'GET') {
    callback(null, { statusCode: 501, body: 'not implemented' });
  } else if (event.resource === '/networks/{networkId}' && event.httpMethod === 'DELETE') {
    callback(null, { statusCode: 501, body: 'not implemented' });
  } else {
    callback(null, { statusCode: 404, body: 'not found' });
  }
};
