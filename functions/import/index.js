const { importSkip } = require("./skip/skip");
const { importReplace } = require("./replace/replace");
const { importMerge } = require("./merge/merge");
const { checkUserDataTable } = require("../pgFunction");
const { insertToCsvUpdateMetafieldTable } = require("./insertOrUpdateDefault");

const importReview = async (eventBody) => {
  const { type, userId, fileName } = eventBody;

  try {
    // Get table name by userID
    let tableName = await checkUserDataTable(userId);
    // Import data by type
    let resultImport = {};
    if (type === 1) {
      resultImport = await importSkip(userId, tableName, fileName);
    } else if (type === 2) {
      resultImport = await importReplace(userId, tableName, fileName);
    } else if (type === 3) {
      resultImport = await importMerge(userId, tableName, fileName);
    } else {
      resultImport = {
        status: "error",
        msg: `Wrong type ${type}`,
      };
    }

    // Insert them data vao bang moi : csv_update_metafield
    if (resultImport.status === "success") {
      console.log("Insert vao bang csv metafield");
      await insertToCsvUpdateMetafieldTable(resultImport.listImported, userId);
    }

    return resultImport;
  } catch (error) {
    return {
      status: "error",
      msg: "Some thing Wrong",
    };
  }
};

module.exports = {
  importReview,
};
