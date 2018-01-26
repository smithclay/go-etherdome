const log = require('lambda-log');
const jsonRPC = require('./lib/json-rpc');



exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    log.config.meta.function_version = process.env.AWS_LAMBDA_FUNCTION_VERSION;
    if (process.env.AWS_SAM_LOCAL || process.env.LOG_DEBUG) {
        log.config.debug = true;
    }

    log.info(require('child_process').execSync('ls -la /tmp').toString())

    // Import chain file (from S3? Elasticache?)
    var importOutput = jsonRPC.importChainSync('/tmp/fooChain', 'fooChain');
    if (importOutput.error || importOutput.status !== 0) {
        log.error(`chain import error: ${importOutput.error} ${importOutput.stderr}`);
    }
    log.info(`imported chain with status: ${importOutput.status}`);
    if (importOutput.status !== 0) {
        log.info(importOutput.stderr.toString());
    }

    // Start jsonRPC in background
    var geth = jsonRPC.start();

    log.debug(JSON.stringify(event));

    jsonRPC.proxyRPCRequest(event.body, function(err, gatewayResponse) {
        if (err) {
            return callback(null, { statusCode: 500, body: err.toString() });
        }

        // memory-based filesystem (golang)
        // to do: (long term) hack geth to make this a lot faster (?)
        // to do: s3 sync

        // If read: return immediately
        geth.kill('SIGINT');

        var exportOutput = jsonRPC.exportChainSync('/tmp/fooChain', 'fooChain');
        log.info(`exported chain with status: ${exportOutput.status}`);
        if (exportOutput.error || exportOutput.status !== 0) {
            log.error(`chain export error: ${importOutput.error} ${exportOutput.stderr}`);
        }

        callback(null, gatewayResponse);
    });
}
