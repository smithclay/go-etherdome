const log = require('lambda-log');
const http = require('http');
const path = require('path');

const { spawn, spawnSync } = require('child_process');

const GETH_BINARY_NAME = 'geth-linux-amd64-1.7.3-4bb3c89d';
const GETH_RPC_HOST = 'localhost';
const GETH_RPC_PORT = 8545;
const RETRY_TIMEOUT_MS = 500;

const proxyRPCRequest = (requestBody, cb, retries=0) => {
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

const exportChainSync = (datadir, chainFile) => {
    var args = ['export', '--datadir', datadir, chainFile];
    log.debug(`calling geth export: ${args.join(' ')}`, { command: true });
    return spawnSync(path.join(process.env.LAMBDA_TASK_ROOT, 'bin', GETH_BINARY_NAME),
        args
    );
};

const importChainSync = (datadir, chainFile) => {
    var args = ['import', '--datadir', datadir, chainFile];
    log.debug(`calling geth import: ${args.join(' ')}`, { command: true });
    return spawnSync(path.join(process.env.LAMBDA_TASK_ROOT, 'bin', GETH_BINARY_NAME),
        args
    );
};

const start = (datadir) => {
    var args = [
    '--datadir', datadir,
    '--rpc',
    '--ipcdisable'];
    log.debug(`calling geth: ${args.join(' ')}`, { command: true });
    const geth = spawn(path.join(process.env.LAMBDA_TASK_ROOT, 'bin', GETH_BINARY_NAME),
        args
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

    return geth;
}

module.exports = {
    proxyRPCRequest: proxyRPCRequest,
    start: start,
    exportChainSync: exportChainSync,
    importChainSync: importChainSync
};