// Validate header
const { validateCsv } = require("./validateCsv");
// DB Function
const { checkUserDataTable } = require("../pgFunction");

const validateBeforeImport = async (eventBody) => {
  let { userId, fileName } = eventBody;
  // Get table name by userId
  let tableName = await checkUserDataTable(userId);
  console.log(tableName);
  // Validate csv first
  let validateResponse = await validateCsv(userId, fileName, tableName);
  return validateResponse;
};

module.exports = {
  validateBeforeImport,
};
