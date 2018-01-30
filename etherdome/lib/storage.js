'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const path = require('path');

const S3_BUCKET_NAME = 'etherdome';

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
    s3.getObject({Key: fileKey}).createReadStream().on('error', function(err){
        cb(err);
    }).pipe(file);
};

var putLocalFile = (fileKey, cb) => {
    var stream = fs.createReadStream(path.join(BASE_DIR, fileKey));
    s3.putObject({Key: fileKey, Body: stream}, function(err, data) {
      if (err) {
        return cb(err, null);
      }
      cb(null, data);
    });
}

module.exports = {
    getFile: getFile,
    putLocalFile: putLocalFile
};