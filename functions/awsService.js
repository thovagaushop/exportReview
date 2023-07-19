// AWS
const AWS = require('aws-sdk');
AWS.config.update({region: 'ap-southeast-1'});
// S3 client
const s3 = new AWS.S3(require('./s3Config'));
// Bucket S3
const BUCKET = 'shopify-partners-data';

const readFileFromS3 = (fileName) =>  {
    return new Promise((resolve, reject) => {
        let params = {
            Bucket: BUCKET,
            Key: fileName
        };
        s3.getObject(params, (err, res) => {
            if (err) return reject(err);
            else {
                return resolve(res.Body.toString());
            }
        });
    });
};

module.exports = {
    s3,
    BUCKET
};

