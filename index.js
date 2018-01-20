const path = require('path');
const http = require('http');
const log = require('lambda-log');
const { spawn } = require('child_process');

const GETH_BINARY_NAME = 'geth-linux-amd64-1.7.3-4bb3c89d';
const GETH_RPC_HOST = 'localhost';
const GETH_RPC_PORT = 8545;
const RETRY_TIMEOUT_MS = 500;

const geth = spawn(path.join(process.env.LAMBDA_TASK_ROOT, 'bin', GETH_BINARY_NAME),
    ['--dev', '--dev.period', '4', '--rpc', '  --ipcdisable']
);

geth.stdout.on('data', (data) => {
    log.debug(`geth stdout: ${data}`);
});

geth.stderr.on('data', (data) => {
    log.debug(`geth stderr: ${data}`);
});

geth.on('close', (code) => {
    log.error(`geth child process exited with code ${code}`);
});

// Proxy geth JSON-RPC request from gateway
var proxyRPCRequest = function(requestBody, cb, retries=0) {
    var opts = {
        host: GETH_RPC_HOST,
        port: GETH_RPC_PORT,
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    var post = http.request(opts, function(res) {
        res.setEncoding('utf8');
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function() {
            var gatewayResponse = {
                statusCode: 200,
                headers: {
                    'application/type': 'text/json'
                },
                body: data
            };
            log.info(`json-rpc response ${JSON.stringify(gatewayResponse)}`);
            cb(null, gatewayResponse);
        });
    });
    post.on('error', function(e) {
        if (e.code === 'ECONNREFUSED') {
            // retry
            setTimeout(function() {
                retries = retries + 1;
                log.info('json-rpc connection refused', {retry: retries});
                proxyRPCRequest(requestBody, cb, retries);
            }, RETRY_TIMEOUT_MS);
        } else {
            log.error(e);
            cb(null, {
                statusCode: 500,
                body: e.toString()
            });
        }
    });
    post.write(requestBody);
    post.end();
}

exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    log.config.meta.function_version = process.env.AWS_LAMBDA_FUNCTION_VERSION;
    if (process.env.AWS_SAM_LOCAL || process.env.LOG_DEBUG) {
        log.config.debug = true;
    }

    proxyRPCRequest(event.body, function(err, gatewayResponse) {
        if (err) {
            return callback(null, { statusCode: 500, body: err.toString() });
        }
        callback(null, gatewayResponse);
    });
}
