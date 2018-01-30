'use strict';

const log = require('lambda-log');
const storage = require('./storage');
const jsonRPC = require('./json-rpc');
const path = require('path');

// TODO: Separate S3 Backend into another

// Empty clique network chain
const DEFAULT_INITIAL_CHAIN =  path.join(__dirname, '../network/etherdome-export.bk');

class ChainData {
    constructor(name, datadir = '/tmp/datadir') {
        this.name = name;
        this.datadir = datadir;
        this.imported = false;
        log.debug(`initializing chain data: ${this.name} in directory ${this.datadir}`);
    }

    _jsonRPCImport(chainBackupFile, cb) {
        var importOutput = jsonRPC.importChainSync(this.datadir, chainBackupFile);
        if (importOutput.error || importOutput.status !== 0) {
            log.error(`chain import error: ${importOutput.error} ${importOutput.stderr}`);
        }
        log.info(`imported chain with status: ${importOutput.status}`);
        if (importOutput.status !== 0) {
            log.info(importOutput.stderr.toString());
            return cb(importOutput.stderr.toString());
        }
        this.imported = true;
        this.importFileName = chainBackupFile;
        cb();
    }

    import(cb = () => {}) {
        storage.getFile(this.name, (err) => {
            if (err) {
                // TODO: Handle if key doesn't exist (not an err, new db)
                if (err.toString().indexOf('The specified key does not exist.') !== -1) {
                    return this._jsonRPCImport(DEFAULT_INITIAL_CHAIN, cb);
                }
                log.error(err);
                cb(err);
            } else {
                return this._jsonRPCImport(`/tmp/${this.name}`, cb);
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