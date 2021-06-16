const isValidDate = (dateStr) => {
  let date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.valueOf());
};
const isNaN = (value) => {
  return value === null || value === undefined;
};
const stringToBool = (value) => {
  if (typeof value != "boolean" && typeof value == "string") {
    return value === "true" ? true : false;
  }
};
const isObjEmpty = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};
module.exports = { isValidDate, isNaN, stringToBool, isObjEmpty };
