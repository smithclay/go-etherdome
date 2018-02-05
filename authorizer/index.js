const jwk = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const request = require('request');
const log = require('lambda-log');

// For Auth0:       https://<project>.auth0.com/
// refer to:        http://bit.ly/2hoeRXk
// For AWS Cognito: https://cognito-idp.<region>.amazonaws.com/<user pool id>/
// refer to:        http://amzn.to/2fo77UI

// Generate policy to allow this user on this API:
const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
    authResponse.context = {};
  }
  return authResponse;
};

const iss = 'https://smithclay.auth0.com/';

// Reusable Authorizer function, set on `authorizer` field in serverless.yml
module.exports.handler = (event, context, cb) => {
  log.config.meta.function_version = process.env.AWS_LAMBDA_FUNCTION_VERSION;
  if (process.env.AWS_SAM_LOCAL || process.env.LOG_DEBUG) {
      log.config.debug = true;
  }

  log.debug(JSON.stringify(event));

  var token = event.queryStringParameters.auth;
  if (!token && event.headers.Authorization) {
    // Remove 'bearer ' from token:
    token = event.headers.Authorization.substring(7);
  }

  if (token) {
    // Make a request to the iss + .well-known/jwks.json URL:
    request(
      { url: `${iss}.well-known/jwks.json`, json: true },
      (error, response, body) => {
        if (error || response.statusCode !== 200) {
          log.error(`jwks request error ${iss}: ${error}`, { responseCode: response.statusCode });
          cb('Unauthorized');
        }
        const keys = body;
        // Based on the JSON of `jwks` create a Pem:
        const k = keys.keys[0];
        const jwkArray = {
          kty: k.kty,
          n: k.n,
          e: k.e,
        };
        const pem = jwkToPem(jwkArray);

        // Verify the token:
        jwk.verify(token, pem, { issuer: iss }, (err, decoded) => {
          if (err) {
            log.error(`Unauthorized user: ${err.message}`);
            cb('Unauthorized');
          } else {
            var policy = generatePolicy(decoded.sub, 'Allow', event.methodArn);
            // Add sub to 'context' so we can identify account in following request
            // https://docs.aws.amazon.com/apigateway/latest/developerguide/use-custom-authorizer.html#api-gateway-custom-authorizer-output
            // https://auth0.com/docs/tokens/id-token
            policy.context.sub = decoded.sub;
            cb(null, policy);
          }
        });
      });
  } else {
    log.error(`No auth parameter found in the query string.`);
    log.info(JSON.stringify(event));
    cb('Unauthorized');
  }
};