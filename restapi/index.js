const log = require('lambda-log');
const AWS = require('aws-sdk');

if (process.env.AWS_SAM_LOCAL) {
    // awslocal dynamodb create-table --table-name NetworksTable --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
    AWS.config.update({
      endpoint: "http://http://192.168.0.105:4569"
    });
}

var docClient = new AWS.DynamoDB.DocumentClient()

exports.handler = (event, context, callback) => {
  log.info(JSON.stringify(event));
  log.info(JSON.stringify(context));
  var principalId = event.requestContext.authorizer.principalId;
  // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.03.html
  callback(null, { statusCode: 200, body: `performing action for: ${principalId}` });
};
