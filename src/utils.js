function createGetColNumber(header) {
  // Get column number from title
  const keys = header.reduce((obj, title, index) => {
    obj[title] = index;
    return obj;
  }, {});
  function getColNumber(key) {
    return keys[key];
  }

  return getColNumber;
}

function fillUndefinedWithEmptyString(rows, numCol) {
  rows = [...rows];
  for (let row of rows) {
    for (let i = 0; i < numCol; i++) {
      if (!row[i]) row[i] = '';
    }
  }
  return rows;
}

module.exports = {
  createGetColNumber,
  fillUndefinedWithEmptyString
};
