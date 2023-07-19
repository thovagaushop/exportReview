// fs
const fs = require("fs");
// AWS Service Function
const { checkDataExistByHandle } = require("../pgFunction");
const getStreamToReadFile = require("../getStreamReadFile");

// Check field of Object
const checkField = (headers) => {
  let errorCatched = {
    status: "warning",
    typeError: null,
    fieldErrorName: [],
  };

  // Bo cach khoang trang cua header truoc
  headers = headers.map((fieldName) => fieldName.trim());

  // Chỉ cần check có thiếu 4 trường cần thiết : product_handle, rating, author and email
  // Product handle
  if (!headers.includes("product_handle")) {
    errorCatched.typeError = "product_handle";
    errorCatched.fieldErrorName.push("product_handle");
  }
  // Rating
  else if (!headers.includes("rating")) {
    errorCatched.typeError = "rating";
    errorCatched.fieldErrorName.push("rating");
  }
  // Author
  else if (!headers.includes("author")) {
    errorCatched.typeError = "author";
    errorCatched.fieldErrorName.push("author");
  }
  // Email
  else if (!headers.includes("email")) {
    errorCatched.typeError = "email";
    errorCatched.fieldErrorName.push("email");
  }

  if (errorCatched.typeError !== null) return errorCatched;
  else return true;
};
// Check header
const isValidHeader = (stream) => {
  return new Promise((resolve, reject) => {
    stream
      .on("headers", (headers) => {
        let checkResult = checkField(headers);
        if (checkResult === true) {
          return resolve(true);
        }
        return resolve(checkResult);
      })
      .on("error", (error) => {
        return reject(error);
      });
  });
};
// Check format
const checkFormat = (data) => {
  // Validate email function
  var validateEmail = (input) => {
    let validRegex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (input.match(validRegex)) {
      return true;
    } else {
      return false;
    }
  };

  var validHandle = (input) => {
    let validRegex =
      /^[a-z0-9™®℠\p{L}\p{N}\p{Katakana}\p{Hiragana}\p{Han}-]+$/i;

    if (input.match(validRegex)) {
      return true;
    } else {
      return false;
    }
  };

  var validRating = (input) => {
    // Rating must be interger
    let toNumber = Number(input);
    if (isNaN(toNumber)) return false;
    else if (!Number.isInteger(toNumber)) return false;
    else return true;
  };

  let errorCatched = {
    status: "warning",
    typeError: null,
  };
  if (!validHandle(data.product_handle)) {
    errorCatched.typeError = "product_handle";
  } else if (!validateEmail(data.email)) {
    errorCatched.typeError = "email";
  } else if (!validRating(data.rating)) {
    errorCatched.typeError = "rating";
  }

  if (errorCatched.typeError !== null) return errorCatched;
  else return true;
};
// Check Required Field
const checkRequiredField = (data) => {
  let errorCatched = {
    status: "warning",
    typeError: null,
  };
  // Check product handle
  if (data.product_handle === "" || !data.product_handle) {
    errorCatched.typeError = "product_handle";
  } else if (data.rating === "" || !data.rating) {
    errorCatched.typeError = "rating";
  } else if (data.author === "" || !data.author) {
    errorCatched.typeError = "author";
  } else if (data.email === "" || !data.email) {
    errorCatched.typeError = "email";
  }
  if (errorCatched.typeError !== null) return errorCatched;
  else return true;
};
/*************************************************************************/
/*************************************************************************/
// Main function Validate
// Validate csv from s3
const validateCsv = async (userId, fileName, tableName) => {
  // Create response
  let response = {
    status: "success",
    row: 0,
    msg: [],
  };
  try {
    // Using Streaming to read file from s3
    let parser = await getStreamToReadFile(fileName);
    // let parser = fs.createReadStream(fileName).pipe(csv());

    // Check header first
    let checkHeader = await isValidHeader(parser);
    // Nếu header lỗi thì trả về kết quả luôn
    if (checkHeader !== true) {
      response.status = "error";
      response["error_header"] = checkHeader.fieldErrorName;
      console.log(response);
      return response;
    }

    // If header valid, validate each line of file CSV
    // validate each line and check exist
    let index = 1;
    response.totalValid = 0;
    response.existProduct = 0;

    // List handle of product
    let listHandle = [];
    // Check every line in csv File
    // Loop
    for await (let data of parser) {
      let isHaveError = false;
      index++;

      // Check row empy first, if not return error
      if (Object.keys(data).length === 0) {
        isHaveError = true;
        if (!response["row_empty"]) {
          response["row_empty"] = [];
        }

        response["row_empty"].push(index);
        if (response.status !== "error" && isHaveError)
          response.status = "error";
      } else {
        // Check required : product_handle, rating, author, email
        let checkRequireResult = checkRequiredField(data);
        if (checkRequireResult !== true) {
          isHaveError = true;
          if (!response["error_field_required"])
            response["error_field_required"] = {};
          if (!response["error_field_required"][checkRequireResult.typeError]) {
            response["error_field_required"][checkRequireResult.typeError] = [];
          }
          response["error_field_required"][checkRequireResult.typeError].push(
            index
          );
          if (response.status !== "error" && isHaveError)
            response.status = "error";
        } else {
          // Check format
          let checkFormatResult = checkFormat(data);
          if (checkFormatResult !== true) {
            isHaveError = true;
            if (!response["error_format"]) response["error_format"] = {};
            if (!response["error_format"][checkFormatResult.typeError]) {
              response["error_format"][checkFormatResult.typeError] = [];
            }
            response["error_format"][checkFormatResult.typeError].push(index);
            if (response.status !== "error" && isHaveError)
              response.status = "error";
          }
        }
      }

      if (isHaveError === false) {
        response.totalValid++;
        // Push to list handle
        if (!listHandle.includes(data.product_handle)) {
          listHandle.push(data.product_handle);
        }
      }
    }

    // If error, return
    // If success or warning, check exist product
    if (response.status !== "error") {
      // Check in handle list, which product have exist
      let listExistProduct = (
        await Promise.all(
          listHandle.map(async (handle) => {
            let checkResult = await checkDataExistByHandle(
              userId,
              handle,
              tableName
            );
            return checkResult ? handle : null;
          })
        )
      ).filter(Boolean);

      console.log(listExistProduct);

      response.existProduct = listExistProduct.length;
      response.msg.unshift(`Total valid line: ${response.totalValid}`);
      response.row = index - 1;
    }

    console.log(response);
    return response;
  } catch (e) {
    console.log(e);
    throw Error(e);
  }
};

module.exports = {
  validateCsv,
};
