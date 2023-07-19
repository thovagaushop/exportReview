"use strict";
const { validateBeforeImport } = require("./functions/validate");
const { importReview } = require("./functions/import");

module.exports.validateBeforeImport = async (event) => {
  let eventBody = JSON.parse(event.body);
  // let eventBody = event.body;
  console.log(eventBody.fileName);

  try {
    let result = await validateBeforeImport(eventBody);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify(error),
    };
  }
};

module.exports.importReview = async (event) => {
  let eventBody = JSON.parse(event.body);
  // let eventBody = event.body;
  console.log(eventBody.fileName);

  let result = await importReview(eventBody);
  console.log(result);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
