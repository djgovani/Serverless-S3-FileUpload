'use strict';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const busboy = require('busboy');
module.exports.hello = (event, context, callback) => {
  let mimeType;
  let ext;
  var contentType = event.headers['Content-Type'] || event.headers['content-type'];
  var bb = new busboy({ headers: { 'content-type': contentType } });
  bb.on('file', function (fieldname, file, filename, encoding, mimetype) {
    mimeType = mimetype;
    ext = filename.split('.')[1];
    let chunks;
    file.on('data', function (data) {
      chunks = data;
    }).on('end', function () {
      let base64Image = new Buffer(chunks.toString(), 'binary').toString('base64');
      const fileData = new Buffer(base64Image, 'base64');
      const filePath = `avatars/${Date.now()}.${ext}`;
      var params = {
        Bucket: process.env.S3_BucketName,
        Key: filePath,
        Body: fileData,
        ACL: 'public-read',
        ContentType: mimeType,
      };
      s3.upload(params, function (err, data) {
        if (err) {
          const response = {
            statusCode: 500,
            body: JSON.stringify({ message: "ERRROR", err })
          };
          callback(null, response);
        } else {
          console.log('succesfully uploaded the image!');
          const response = {
            statusCode: 201,
            body: JSON.stringify({ message: "Image uploaded", data })
          };
          callback(null, response);
        }
      }).on('httpUploadProgress', function (evt) {
        console.log('upload progres--->', evt);
      });
    });
  })
  bb.end(event.body);
};

