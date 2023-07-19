// Pool of pg
const { Pool } = require("pg");
// Pg config
const pgConfig = require("./pgConfig");
// Create pool
const pool = new Pool(pgConfig);

const QUERY_GET_TABLE_BY_USERID = `SELECT * FROM app_usermeta 
  WHERE meta_key = 'user_data_table' 
  AND meta_value = 'ryviu_data_2' 
  AND user_id = $1`;

const checkUserDataTable = (userId) => {
  return new Promise((resolve, reject) => {
    pool.connect((err, client, release) => {
      if (err) return reject(err);
      else {
        client.query(QUERY_GET_TABLE_BY_USERID, [userId], (err, res) => {
          release();
          if (err) return reject(err);
          else {
            if (res.rows.length) return resolve("ryviu_data_2");
            else return resolve("ryviu_data");
          }
        });
      }
    });
  });
};

const checkDataExistByHandle = async (userId, productHandle, tableName) => {
  return new Promise((resolve, reject) => {
    pool.connect((err, client, release) => {
      if (err) return reject(err);
      else {
        client.query(
          `SELECT * FROM ${tableName} 
                WHERE handle = $1 AND user_id = $2`,
          [productHandle, userId],
          (err, res) => {
            release();
            if (err) return reject(err);
            else {
              if (res.rows.length) return resolve(res.rows[0].data);
              else return resolve(null);
            }
          }
        );
      }
    });
  });
};

const checkReviewExistDatabase = async (userId, tableName, review) => {
  let { product_handle, author, rating, body_text, email } = review;
  // Check product exist
  let checkByHandle = await checkDataExistByHandle(
    userId,
    product_handle,
    tableName
  );

  // If no exist return false means : No have in db
  if (checkByHandle === null) return false;
  // If exist
  // Conver by table name
  // Because if data in table 2 : type text, in table 1 : type jsonb
  checkByHandle =
    tableName === "ryviu_data_2" ? JSON.parse(checkByHandle) : checkByHandle;

  let checkReview = checkByHandle.find((el) => {
    if (
      el.rating === rating &&
      el.author === author &&
      el.body_text === body_text &&
      el.email === email
    )
      return el;
  });

  // If exist
  if (checkReview) return true;
  return false;
};

//Insert reviews
const insertOrUpdateReivew = (query) => {
  return new Promise((resolve, reject) => {
    pool.query(query, (err, res) => {
      if (err) {
        console.log(err);
        return resolve(null);
      } else return resolve(res.rows);
    });
  });
};

// Delete product by handle
const deleteByHandle = (tableName, handle) => {
  return new Promise((resolve, reject) => {
    let query = `Delete from ${tableName} where handle = $1`;
    pool.connect((err, client, release) => {
      if (err) return reject(err);
      else {
        client.query(query, [handle], (err, res) => {
          release();
          if (err) return reject("Error when delete");
          else return resolve(true);
        });
      }
    });
  });
};

module.exports = {
  checkUserDataTable,
  checkDataExistByHandle,
  checkReviewExistDatabase,
  insertOrUpdateReivew,
  deleteByHandle,
};
