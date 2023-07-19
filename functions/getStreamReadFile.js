// Fs
const fs = require("fs");
// S3 and Bucket
const { s3, BUCKET } = require("./awsService");
// Csv parser
const csv = require("fast-csv");
// N readline
const readline = require("readline");

// Ham nay de check xem file csv ngan cach boi dau ; hay dau ,
const getStreamToReadFile = async (fileName) => {
  // Create params of s3 to read s3 file
  let params = {
    Bucket: BUCKET,
    Key: fileName,
  };

  // Read S3 using streaming
  // let parser = fs.createReadStream(fileName);
  // Read file line by line
  const readed = readline.createInterface({
    input: s3.getObject(params).createReadStream(fileName),
    crlfDelay: Infinity,
  });

  // Check delimiter
  let streamOptions = { headers: true, delimiter: "," };
  for await (const line of readed) {
    console.log(line);
    if (line.includes(";")) streamOptions = { headers: true, delimiter: ";" };
    break;
  }
  console.log(streamOptions);
  return s3
    .getObject(params)
    .createReadStream(fileName)
    .pipe(csv.parse(streamOptions));
};

module.exports = getStreamToReadFile;
