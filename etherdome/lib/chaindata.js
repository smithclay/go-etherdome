'use strict';

const log = require('lambda-log');
const storage = require('./storage');
const jsonRPC = require('./json-rpc');

// TODO: Separate S3 Backend into another

class ChainData {
    constructor(name, datadir = '/tmp/datadir') {
        this.name = name;
        this.datadir = datadir;
        this.imported = false;
        log.debug(`initializing chain data: ${this.name} in directory ${this.datadir}`);
    }

    import(cb = () => {}) {
        storage.getFile(this.name, (err) => {
            if (err) {
                // TODO: Handle if key doesn't exist (not an err, new db)
                if (err.toString().indexOf('The specified key does not exist.') !== -1) {
                    require('child_process').execSync(`cp -R /var/task/datadir ${this.datadir}`).toString()
                    return cb();
                }
                log.error(err);
                cb(err);
            } else {
                var importOutput = jsonRPC.importChainSync(this.datadir, `/tmp/${this.name}`);
                if (importOutput.error || importOutput.status !== 0) {
                    log.error(`chain import error: ${importOutput.error} ${importOutput.stderr}`);
                }
                log.info(`imported chain with status: ${importOutput.status}`);
                if (importOutput.status !== 0) {
                    log.info(importOutput.stderr.toString());
                    return cb(importOutput.stderr.toString());
                }
                this.imported = true;
                cb();
            }
        });
    }

    export(cb = () => {}) {
        var exportOutput = jsonRPC.exportChainSync(this.datadir, `/tmp/${this.name}`);
        log.info(`exported chain with status: ${exportOutput.status}`);
        log.debug(exportOutput.stdout.toString());
        if (exportOutput.error || exportOutput.status !== 0) {
            log.error(`chain export error: ${exportOutput.stderr}`);
            cb(exportOutput.error);
        }

        // TODO: Only need to put if a write operation
        storage.putLocalFile(this.name, (err, data) => {
            if (err) {
                log.error(err);
            }
            cb();
        });
    }
}

module.exports = ChainData;