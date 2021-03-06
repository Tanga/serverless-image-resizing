'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

const ALLOWED_BUCKETS = new Array('tanga-images', 'tanga-verified-images-prod', 'tanga-fetched-images-prod', 'tanga-dev-images');

exports.handler = function(event, context, callback) {
  console.log(event.queryStringParameters);
  const url = event.queryStringParameters.url;
  var bucket = event.queryStringParameters.bucket;
  var filename = event.queryStringParameters.filename;
  var width = parseInt(event.queryStringParameters.width, 10)
  var height = parseInt(event.queryStringParameters.height, 10)
  var format = event.queryStringParameters.format || 'jpeg'
  if (format != 'webp' && format != 'jpeg') {
    format = 'jpeg';
  }
  if (width && !height) {
    height = width;
  }
  if (!width && height) {
    width = height;
  }
  if(!width) {
    width = 500;
  }
  if(!height) {
    height = 500;
  }
  const quality = parseInt(event.queryStringParameters.quality, 10) || 90;

  if (url != undefined && url != '') {
    bucket = url.split('/')[3]
    filename = url.split('/')[4]
  }

  if(!ALLOWED_BUCKETS.includes(bucket)) {
     callback(null, {
      statusCode: '403',
      headers: {},
      body: '',
    });
    return;
  }

  if (format == 'webp') {
    S3.getObject({Bucket: bucket, Key: filename}).promise()
      .then(data => Sharp(data.Body)
        .resize({
          width: width,
          height: height,
          background: {r: 255, g: 255, b: 255}
        })
        .toFormat(format)
        .webp({ quality: quality })
        .toBuffer()
      )
      .then(buffer => callback(null, {
          statusCode: '200',
          headers: {
            'Content-Type': 'image/webp',
            'version': '6a',
            'Cache-Control': 'max-age=31556952'
          },
          body: buffer.toString('base64'),
          isBase64Encoded: true,
        })
      )
      .catch(err => callback(err))
  } else {
    S3.getObject({Bucket: bucket, Key: filename}).promise()
      .then(data => Sharp(data.Body)
        .resize({
          width: width,
          height: height,
          background: {r: 255, g: 255, b: 255}
        })
        .toFormat(format)
        .jpeg({ quality: quality })
        .toBuffer()
      )
      .then(buffer => callback(null, {
          statusCode: '200',
          headers: {
            'Content-Type': 'image/jpeg',
            'version': '6b',
            'Cache-Control': 'max-age=31556952'
          },
          body: buffer.toString('base64'),
          isBase64Encoded: true,
        })
      )
      .catch(err => callback(err))
  }
}
