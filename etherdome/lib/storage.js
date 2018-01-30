'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');
const log = require('lambda-log');

const S3_BUCKET_NAME = process.env.CHAINDATA_S3_BUCKET || 'etherdome';
const BASE_DIR = '/tmp';

var s3options_local = {
    apiVersion: '2006-03-01',
    endpoint: 'http://192.168.0.105:4572',
    s3ForcePathStyle: true,
    params: {Bucket: S3_BUCKET_NAME}
};

var s3options = {
    apiVersion: '2006-03-01',
    params: {Bucket: S3_BUCKET_NAME}
};

var s3 = new AWS.S3(process.env.AWS_SAM_LOCAL ? s3options_local : s3options);

// TODO: Make all of these options configurable

var getFile = (fileKey, cb) => {
    var file = fs.createWriteStream(path.join(BASE_DIR, fileKey));
    file.on('close', function(){
        cb();
    });
    s3.getObject({Key: fileKey}).createReadStream().on('error', (err) => {
        if (err) {
            log.error(`s3 GetObject ${S3_BUCKET_NAME} ${fileKey} failed: ${err}`);
            return cb(err);
        }
        cb();
    }).pipe(file);
};

var putLocalFile = (fileKey, cb) => {
    var stream = fs.createReadStream(path.join(BASE_DIR, fileKey));
    s3.putObject({Key: fileKey, Body: stream}, (err, data) => {
      if (err) {
        log.error(`s3 PutObject failed: ${err}`);
        return cb(err, null);
      }
      cb(null, data);
    });
}

module.exports = {
    getFile: getFile,
    putLocalFile: putLocalFile
};