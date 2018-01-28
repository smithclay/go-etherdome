const log = require('lambda-log');
const jsonRPC = require('./lib/json-rpc');
const storage = require('./lib/storage');

const ChainData = require('./lib/chaindata');


exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    log.config.meta.function_version = process.env.AWS_LAMBDA_FUNCTION_VERSION;
    if (process.env.AWS_SAM_LOCAL || process.env.LOG_DEBUG) {
        log.config.debug = true;
    }

    log.info(require('child_process').execSync('pwd').toString())

    log.info(require('child_process').execSync('ls -la /tmp').toString())

    log.debug(JSON.stringify(event));
    var authKey = 'foo-auth-key-1';

    var chainData = new ChainData(authKey, '/tmp/devnet-1');
    chainData.import((err) => {
        if (err) {
            return callback(null, { statusCode: 500, body: err.toString() });
        }
        var geth = jsonRPC.start('/tmp/devnet-1');
        jsonRPC.proxyRPCRequest(event.body, function(err, gatewayResponse) {
            if (err) {
                return callback(null, { statusCode: 500, body: err.toString() });
            }

            geth.kill('SIGINT');
            // TODO: try this flow with geth locally...
            geth.on('exit', () => {
                // If read: return immediately and skip this stepp (but still need to exit)
                chainData.export((err) => {
                    if (err) {
                        log.error(err);
                    } else {
                        log.info('exported chain database to s3');
                    }
                    return callback(null, gatewayResponse);
                });
            })

        });
    });

}
