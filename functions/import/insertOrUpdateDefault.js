const { insertOrUpdateReivew } = require("../pgFunction");
const format = require("pg-format");

// Number of product insert 1 time
const BATCH_SIZE = 1000;

// Prepare data before insert
const prepareDataToImport = (userId, products) => {
  // Get data to Import
  let dateNow = new Date().toISOString().split(".")[0] + "Z";
  // Field "data" in each row insert is array of review
  return products.map((curr) => [
    JSON.stringify(curr), // data
    userId, // user_id
    curr[0].product_handle, // handle
    0, // shopify
    "csv", // source
    "", // domain
    curr.length, // number
    "", // frame
    0, // current
    1, // active
    0, // product_id
    Math.ceil(curr.length / 10), // total_page
    curr.length, // total_reviews
    curr.length, // total_reviews_loaded
    "", // title
    "", // image
    dateNow, // date
  ]);
};

// Insert each 1000 product 1 time
const importDefault = async (tableName, importData) => {
  // Calculate how many batch to insert
  let count = Math.ceil(importData.length / BATCH_SIZE);
  // Array Promise to insert
  const inserts = [];

  for (let i = 0; i < count; i++) {
    // Get each batch of product to insert
    let sliceArray = importData.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

    // Create query to insert by PG Format
    let query = format(
      `Insert into ${tableName} (data, user_id, handle, shopify, source, domain, number, frame, current, active, product_id, total_page, total_reviews, total_reviews_loaded, title, image, date) 
                     values %L returning id`,
      sliceArray
    );
    // Push in array Promise
    inserts.push(insertOrUpdateReivew(query));
  }

  // Inserting ....
  try {
    let insertResult = await Promise.all(inserts);
    let listInserted = [];
    insertResult.forEach((array) => {
      let result = array.map(({ id }) => id);
      listInserted.push(...result);
    });
    return {
      status: "success",
      listInserted: listInserted,
    };
  } catch (e) {
    // Catch error
    console.log("insert", e);
    throw Error(e);
  }
};

// Update each 1000 product 1 time
const updateDefault = async (tableName, updateData) => {
  // Calculate how many batch to insert
  let count = Math.ceil(updateData.length / BATCH_SIZE);

  // Array promise to update
  const updates = [];

  for (let i = 0; i < count; i++) {
    let sliceArray = updateData.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

    // if (tableName === "ryviu_data") {
    //   sliceArray = sliceArray.map((el) => {
    //     el[0] = JSON.parse(el[0]);
    //     return el;
    //   })
    // }
    let typeDataInQuery =
      tableName === "ryviu_data" ? "a.data::jsonb" : "a.data";
    const query = format(
      `Update ${tableName} r Set 
            data = ${typeDataInQuery}, 
            source = a.source, 
            number = a.number::int4,  
            total_page = a.total_page::int4, 
            total_reviews = a.total_reviews::int4, 
            total_reviews_loaded = a.total_reviews_loaded::int4, 
            updated_at = a.date::timestamp
            From (Values %L) As a (data, user_id, handle, shopify, source, domain, number, frame, current, active, 
                product_id, total_page, total_reviews, total_reviews_loaded, title, image, date)
            Where r.handle = a.handle and r.user_id = a.user_id::int8 returning r.id`,
      sliceArray
    );

    updates.push(insertOrUpdateReivew(query));
  }

  // Updating ...
  try {
    let updateResult = await Promise.all(updates);
    let listUpdated = [];
    updateResult.forEach((array) => {
      let result = array.map(({ id }) => id);
      listUpdated.push(...result);
    });
    return {
      status: "success",
      listUpdated: listUpdated,
    };
  } catch (e) {
    // Catch error
    console.log("update", e);
    throw Error(e);
  }
};

// Function to insert to csv_update_metafield
const insertToCsvUpdateMetafieldTable = async (arrayIdInserted, userId) => {
  // Prepare array data to insert
  let importData = arrayIdInserted.map((id) => [
    userId, // userId
    id, // productId
  ]);

  // Calculate how many batch to insert
  let count = Math.ceil(importData.length / BATCH_SIZE);
  // Array Promise to insert
  const inserts = [];

  for (let i = 0; i < count; i++) {
    // Get each batch of product to insert
    const sliceArray = importData.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    // Create query to insert by PG Format
    let query = format(
      `Insert into csv_update_metafield (user_id, product_id) 
          values %L returning id`,
      sliceArray
    );
    // Push in array Promise
    inserts.push(insertOrUpdateReivew(query));
  }

  // Inserting ....
  try {
    let insertResult = await Promise.all(inserts);
    return {
      status: "success",
    };
  } catch (e) {
    console.log(e);
    // Catch error
    throw Error(e);
  }
};

module.exports = {
  importDefault,
  updateDefault,
  prepareDataToImport,
  insertToCsvUpdateMetafieldTable,
};
