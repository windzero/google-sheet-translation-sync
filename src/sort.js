const authorize = require('./authorize');

const { google } = require('googleapis');

const { createGetColNumber, fillUndefinedWithEmptyString } = require('./utils');

module.exports = function sort(config) {
  authorize(config, run);
  const getColNumber = createGetColNumber(config.header);

  async function run(auth) {
    try {
      const sheets = google.sheets({ version: 'v4', auth });
      console.log('Pulling...');
      const rows = await pullRows(sheets);

      console.log('Sorting...');
      const header = rows.shift();
      const newRows = await handleSort(header, rows);

      console.log('Pushing...');
      await pushRows(sheets, [header, ...newRows]);

      console.log('Sorting completed');
    } catch (error) {
      console.log('Sorting error = ', error);
    }
  }

  function handleSort(header, rows) {
    const newRows = fillUndefinedWithEmptyString(rows, header.length);
    const { languages } = config;

    function isNeedTranslation(row) {
      const note = getColNumber('note');
      if (row[note]) return true;

      const languageNeedTranslation = languages.find(language => {
        const key = getColNumber(language);
        const value = row[key] ? row[key].trim() : '';
        return !value || value === '__NOT_TRANSLATED__';
      });

      return Boolean(languageNeedTranslation);
    }

    newRows.sort((a, b) => {
      const isANeedTranslation = isNeedTranslation(a);
      const isBNeedTranslation = isNeedTranslation(b);

      if (isANeedTranslation && !isBNeedTranslation) {
        return 1;
      } else if (isBNeedTranslation && !isANeedTranslation) {
        return -1;
      }

      const key = getColNumber('key');
      if (a[key] > b[key]) return 1;
      if (a[key] < b[key]) return -1;
      return 0;
    });

    return newRows;
  }

  async function pullRows(sheets) {
    const res = await new Promise((resolve, reject) => {
      sheets.spreadsheets.values.get(
        {
          spreadsheetId: config.spreadsSheetId,
          range: `${config.sheetName}!${config.range}`
        },
        (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(res);
        }
      );
    });
    return res.data.values;
  }

  async function pushRows(sheets, rows) {
    console.log(rows);
    return new Promise((resolve, reject) => {
      sheets.spreadsheets.values.update(
        {
          spreadsheetId: config.spreadsSheetId,
          range: `${config.sheetName}!${config.range}`,
          valueInputOption: 'RAW',
          resource: {
            values: rows
          }
        },
        (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(res);
        }
      );
    });
  }
};
