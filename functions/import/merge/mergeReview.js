// This function help to check exist product and check exist review of this product
// After check, we can merge all review

// Compare 2 review, if same return true, else return false
const findReviewExist = (listReview, review) => {
  return listReview.find((element) => {
    if (
      element.product_handle === review.product_handle &&
      element.rating === review.rating &&
      element.author === review.author &&
      element.title === review.title &&
      element.email === review.email &&
      element.body_text === review.body_text
    )
      return true;
    return false;
  });
};

const mergeReview = (
  productFromFile,
  productFromDatabase,
  tableName,
  handle
) => {
  // Change type for productFromDatabase
  if (tableName === "ryviu_data_2")
    productFromDatabase = JSON.parse(productFromDatabase);
  // Product is an array review, this product is exist in database
  productFromFile.forEach((review) => {
    if (!findReviewExist(productFromDatabase, review))
      productFromDatabase.push(review);
  });
  // Thay đổi product handle trong database trung với product handle của file csv nếu cả 2 không bằng nhau
  productFromDatabase[0].product_handle = handle;
  return productFromDatabase;
};

module.exports = {
  mergeReview,
};
