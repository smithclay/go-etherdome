const log = require('lambda-log');
const AWS = require('aws-sdk');
const uuidv1 = require('uuid/v1')

const nameGenerator = require('./name-generator');

if (process.env.AWS_SAM_LOCAL) {
    // awslocal dynamodb create-table --table-name NetworksTable --attribute-definitions AttributeName=user_id,AttributeType=S AttributeName=network_id,AttributeType=S  --key-schema AttributeName=user_id,KeyType=HASH AttributeName=network_id,KeyType=RANGE --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
    AWS.config.update({
      endpoint: "http://192.168.0.105:4569"
    });
    process.env.TABLE_NAME = 'NetworksTable';
}

var docClient = new AWS.DynamoDB.DocumentClient()
const DEFAULT_PROJECTION = "network_id,created_on,friendly_name";

// TODO: Move methods into a different file

const ListNetworks = (userId, cb) => {
    var params = {
        TableName : process.env.TABLE_NAME,
        ProjectionExpression: DEFAULT_PROJECTION,
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
    var item = {
        "user_id": userId,
        "friendly_name": nameGenerator(),
        "network_id": uuidv1(),
        "network_type": "ethereum-linux-amd64-1.7.3-4bb3c89d",
        "created_on": (new Date()).toISOString()
    };

    var params = {
        TableName: process.env.TABLE_NAME,
        Item: item
    };
    docClient.put(params, function(err, data) {
        if (err) {
            log.error(`Unable to add item. Error JSON: ${JSON.stringify(err, null, 2)}`);
            return cb(err);
        }
        log.debug("Added item:", JSON.stringify(data, null, 2));
        // TODO: Use some sort of projection helper here?
        cb(null, { network_id: item.network_id,
            friendly_name: item.friendly_name, created_on: item.created_on });
    });
}

const GetNetwork = (userId, networkId, cb) => {
    var params = {
        TableName: process.env.TABLE_NAME,
        ProjectionExpression: DEFAULT_PROJECTION,
        Key: {
            "network_id": networkId,
            "user_id": userId
        }
    };
    docClient.get(params, (err, data) => {
        if (err) {
            return cb(err);
        }
        cb(null, data.Item);
    });
}

const DeleteNetwork = (userId, networkId, cb) => {
    var params = {
        TableName: process.env.TABLE_NAME,
        Key: {
            "network_id": networkId,
            "user_id": userId
        }
    };
    docClient.delete(params, (err, data) => {
        if (err) {
            return cb(err);
        }
        cb(null, { "network_id": networkId });
    });
}

exports.handler = (event, context, callback) => {
  log.debug(JSON.stringify(event));

  var principalId = event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.principalId;
  if (!principalId) {
      callback(null, { statusCode: 400, body: 'user not set'});
  }

  if (event.resource === '/networks' && event.httpMethod === 'GET') {
    ListNetworks(principalId, (err, data) => {
        if (err) {
            return callback(null, { statusCode: 500, body: err });
        }
        callback(null, { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' },  body: JSON.stringify(data) });
     });
  } else if (event.resource === '/networks' && event.httpMethod === 'POST') {
    CreateNetwork(principalId, (err, data) => {
        if (err) {
            return callback(null, { statusCode: 500, body: err });
        }
        callback(null, { statusCode: 201, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) });
    });
  } else if (event.resource === '/networks/{networkId}' && event.httpMethod === 'GET') {
    GetNetwork(principalId, event.pathParameters && event.pathParameters.networkId, (err, data) => {
        if (err) {
            return callback(null, { statusCode: 500, body: err });
        }
        callback(null, { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) });
    });
  } else if (event.resource === '/networks/{networkId}' && event.httpMethod === 'DELETE') {
    DeleteNetwork(principalId, event.pathParameters && event.pathParameters.networkId, (err, data) => {
        if (err) {
            return callback(null, { statusCode: 500, body: err });
        }
        callback(null, { statusCode: 202, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) });
    });
  } else {
    callback(null, { statusCode: 404, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'not found' });
  }
};
