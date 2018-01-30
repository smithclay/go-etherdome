const log = require('lambda-log');
const jsonRPC = require('./lib/json-rpc');
const storage = require('./lib/storage');
const crypto = require('crypto');

const ChainData = require('./lib/chaindata');

exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    log.config.meta.function_version = process.env.AWS_LAMBDA_FUNCTION_VERSION;
    if (process.env.AWS_SAM_LOCAL || process.env.LOG_DEBUG) {
        log.config.debug = true;
    }

    log.info(require('child_process').execSync('ls -la /tmp').toString())

    log.debug(JSON.stringify(event));

    if (!event.queryStringParameters.auth) {
        return callback(null, { statusCode: 500, body: 'No authorization key found.' });
    }

    var authKeyHash = crypto.createHash('md5').update(event.queryStringParameters.auth).digest("hex");
    var datadir = `/tmp/datadir-${authKeyHash}`;
    var chainData = new ChainData(authKeyHash, datadir);

    chainData.import((err) => {
        if (err) {
            return callback(null, { statusCode: 500, body: err.toString() });
        }
        var geth = jsonRPC.start(datadir);

        geth.on('close', (statusCode) => {
            if (statusCode !== 0) {
                return callback(null, { statusCode: 500, body: 'error serving request' });
            }
        });

        jsonRPC.proxyRPCRequest(event.body, (err, gatewayResponse) => {
            if (err) {
                return callback(null, { statusCode: 500, body: err.toString() });
            }

            geth.kill('SIGINT');

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
            });
        });
    });

}
