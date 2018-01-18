const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const GETH_BINARY_NAME = 'geth-linux-amd64-1.7.3-4bb3c89d';

const geth = spawn(path.join(process.env.LAMBDA_TASK_ROOT, 'bin', GETH_BINARY_NAME), ['--dev', '--dev.period', '4', '--rpc', '  --ipcdisable']);

geth.stdout.on('data', (data) => {
    console.log(`geth > stdout: ${data}`);
});

geth.stderr.on('data', (data) => {
    console.log(`geth > stderr: ${data}`);
});

geth.on('close', (code) => {
    console.log(`geth > child process exited with code ${code}`);
});

exports.handler = (event, context, callback) => {
    // Need to wait until geth is started
    setTimeout(function() {
        // Proxy JSON-RPC Request
        var post_data = event.body;
        var post_options = {
            host: 'localhost',
            port: '8545',
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(post_data)
            }
        };
        // Set up the request
        var post_req = http.request(post_options, function(res) {
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function() {
                var gatewayResponse = {
                    statusCode: 200,
                    body: data
                };
                console.log('>> data', data)
                console.log('>> response ', JSON.stringify(gatewayResponse));
                callback(null, gatewayResponse);
            });
        });
        post_req.write(post_data);
        post_req.end();
    }, 5000);
}