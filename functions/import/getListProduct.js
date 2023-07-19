// Moment
const moment = require("moment");
// Function get stream to read file csv
const getStreamToReadFile = require("../getStreamReadFile");

// Fix data format
const fixFormatOfData = (data) => {
  // Xoa bo cac empty field, va trim() de xoa khoang trang cua tung fieldName
  Object.keys(data).forEach((fieldName) => {
    if (fieldName.trim() === "") delete data[fieldName];
    // Neu co khoang trang
    else if (fieldName.trim() !== fieldName) {
      data[fieldName.trim()] = data[fieldName];
      delete data[fieldName];
    }
  });

  // 1 review it nhat phai co 4 field : product_handle, rating, author va email
  // Nen chung ta se chinh format cho 4 field nay truoc
  // Format rating
  // Change rating
  let rating = Number(data.rating);
  if (rating > 5) rating = 5;
  else if (rating < 1) rating = 1;

  data["rating"] = rating;

  // Change body_urls to array first
  if (data["photo_urls"] !== undefined) {
    data["body_urls"] = data["photo_urls"];
  }

  data["body_urls"] =
    data["body_urls"].replace(/[\[\]\"]/g, "") === ""
      ? []
      : data["body_urls"].replace(/[\[\]\"]/g, "").split(",");

  data["body_urls"] = data["body_urls"].map((url) => {
    const regexStr = /(?:\d+|full)x(?:\d+|full)\/(?:jpg|jpeg|png|webg)\//;
    let newUrl = url.match(regexStr)
      ? url.replace(url.match(regexStr), "")
      : url;
    return newUrl;
  });

  return {
    product_handle: data["product_handle"],
    rating: data["rating"],
    title: data["title"],
    author: data["author"],
    email: data["email"],
    body_text: data["body_text"] ?? "",
    body_urls: data["body_urls"],
    created_at: data["created_at"]
      ? moment(new Date(data["created_at"])).format("YYYY-MM-DD hh:mm:ss")
      : moment(new Date()).format("YYYY-MM-DD hh:mm:ss"),
    avatar: data["avatar"] ?? "",
    country_code: data["country_code"] ?? "",
    status: data["status"] ?? "enable",
    featured: data["featured"] ?? "0",
    source: data["source"] ?? "CSV",
  };
};

// Get list product function
// We get list product from csv file of review, which include many review same product together and return list product
const getListProduct = async (fileName) => {
  // S3 Read Stream File
  let parser = await getStreamToReadFile(fileName);

  // Create list Product
  let listProduct = {};
  // Loop
  // Noity : In loop, we change body_urls or photo_urls from string to array
  for await (let data of parser) {
    // If list product have not had this product yet
    let tempData = fixFormatOfData(data);

    if (!listProduct[tempData.product_handle]) {
      listProduct[tempData.product_handle] = [];
    }
    // push review to array of review of this product
    listProduct[tempData.product_handle].push(tempData);
  }
  console.log("List handle", Object.keys(listProduct));
  return listProduct;
};

module.exports = {
  getListProduct,
};
