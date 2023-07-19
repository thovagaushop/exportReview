// Get list product function
const { getListProduct } = require('../getListProduct');
// Database function
const { 
    checkDataExistByHandle 
} = require('../../pgFunction');
// Import function
const { importDefault, prepareDataToImport } = require('../insertOrUpdateDefault');

const importSkip = async (userId, tableName, fileName) => {
    try {
        // Get list product from csv file of review
        let listProduct = await getListProduct(fileName);
        
        // Check exist product in database, if exist, jump over by filter Boolean
        let skipProduct = (await Promise.all(
            Object.keys(listProduct).map(async (handle) => {
                return !(await checkDataExistByHandle(userId, handle, tableName)) ? listProduct[handle] : null
            })
        )).filter(Boolean);

        // Create import to insert to database from list Products
        let importData = prepareDataToImport(userId, skipProduct);
        // Inserting ... 
        let importResult = await importDefault(tableName, importData);
        // tai sao phai lam the nay
        // vi muon insert them data vao bang moi la : csv_update_metafield, chan :((, hong het code dep
        return {
            status: "success",
            listImported: importResult.listInserted
        }
    } catch (error) {
        throw Error(error);
    }
};

module.exports = {
    importSkip
}