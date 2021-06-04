const isValidDate = (dateStr) => {
  let date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.valueOf());
};

module.exports = { isValidDate };
