const isValidDate = (dateStr) => {
  let date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.valueOf());
};
const isNaN = (value) => {
  return value === null || value === undefined;
};
const toBool = (value) => {
  if (typeof value != "boolean" && !isNaN(value)) {
    return value === "true" ? true : false;
  }
  return value;
};
const isObjEmpty = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};
module.exports = { isValidDate, isNaN, toBool, isObjEmpty };
