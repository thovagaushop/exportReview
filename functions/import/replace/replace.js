// Replace product by import
// This mean delete all same product in database and insert new product list

const { checkDataExistByHandle, deleteByHandle } = require("../../pgFunction");
const { getListProduct } = require("../getListProduct");
const {
  prepareDataToImport,
  importDefault,
  updateDefault,
} = require("../insertOrUpdateDefault");

const importReplace = async (userId, tableName, fileName) => {
  // Get list product from csv file
  let listProduct = await getListProduct(fileName);

  try {
    // Divide listProduct to 2 array : New Product to insert, exist product to update
    let replaceProduct = await Object.keys(listProduct).reduce(
      async (acc, curr) => {
        let temp = await acc;
        let checkResult = await checkDataExistByHandle(userId, curr, tableName);

        // If not exist
        if (!checkResult) temp["insert"].push(listProduct[curr]);
        else {
          temp["update"].push(listProduct[curr]);
        }
        return temp;
      },
      { insert: [], update: [] }
    );

    let result = await Promise.all([
      importDefault(
        tableName,
        prepareDataToImport(userId, replaceProduct["insert"])
      ),
      updateDefault(
        tableName,
        prepareDataToImport(userId, replaceProduct["update"])
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
  } catch (e) {
    throw Error(e);
  }
};

module.exports = {
  importReplace,
};
