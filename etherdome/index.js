const log = require('lambda-log');
const jsonRPC = require('./lib/json-rpc');

// Start jsonRPC in background
jsonRPC.start();

exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    log.config.meta.function_version = process.env.AWS_LAMBDA_FUNCTION_VERSION;
    if (process.env.AWS_SAM_LOCAL || process.env.LOG_DEBUG) {
        log.config.debug = true;
    }

    log.debug(JSON.stringify(event));

    jsonRPC.proxyRPCRequest(event.body, function(err, gatewayResponse) {
        if (err) {
            return callback(null, { statusCode: 500, body: err.toString() });
        }

        // If write: save to S3 (or cache?)
        // admin.exportChain('blockchain_backup')
        // admin.importChain('blockchain_backup')

        // If read: return immediately

        callback(null, gatewayResponse);
    });
}
