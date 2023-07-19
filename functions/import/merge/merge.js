const { checkDataExistByHandle } = require("../../pgFunction");
const { getListProduct } = require("../getListProduct");
const {
  prepareDataToImport,
  importDefault,
  updateDefault,
} = require("../insertOrUpdateDefault");
const { mergeReview } = require("./mergeReview");

// Merge function, this mean check review have exist in product in DB and merge with new review
const importMerge = async (userId, tableName, fileName) => {
  try {
    // Get list product from csv file
    let listProduct = await getListProduct(fileName);

    let mergeProduct = await Object.keys(listProduct).reduce(
      async (acc, curr) => {
        let temp = await acc;

        let checkResult = await checkDataExistByHandle(userId, curr, tableName);

        // If not exist
        if (!checkResult) temp["insert"].push(listProduct[curr]);
        else {
          temp["update"].push(
            mergeReview(listProduct[curr], checkResult, tableName, curr)
          );
        }
        return temp;
      },
      Promise.resolve({ insert: [], update: [] })
    );

    console.log("Insert", mergeProduct["insert"].length);
    console.log("Update", mergeProduct["update"].length);

    let result = await Promise.all([
      importDefault(
        tableName,
        prepareDataToImport(userId, mergeProduct["insert"])
      ),
      updateDefault(
        tableName,
        prepareDataToImport(userId, mergeProduct["update"])
      ),
    ]);

    console.log("result", result);
    if (
      result.every((el) => {
        if (el.status !== "success") return false;
        else return true;
      })
    ) {
      return {
        status: "success",
        listImported: [...result[0].listInserted, ...result[1].listUpdated],
      };
    }
    return {
      status: "error",
      msg: "Import fail",
    };
  } catch (error) {
    console.log(error);
    throw Error(error);
  }
};

module.exports = {
  importMerge,
};
