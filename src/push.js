const authorize = require('./authorize');
const { google } = require('googleapis');

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const { createGetColNumber, fillUndefinedWithEmptyString } = require('./utils');

module.exports = function(config) {
  authorize(config, run);
  const getColNumber = createGetColNumber(config.header);

  async function run(auth) {
    try {
      console.log('Pushing...');
      const rows = await getTranslationRows();
      const newRows = fillUndefinedWithEmptyString(rows, rows[0].length);
      await push(auth, newRows);
      console.log('Push completed');
    } catch (error) {
      console.log('Pull error = ', error);
    }
  }

  async function getTranslationRows() {
    // Get language path
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiled = _.template(config.languagePathPattern);
    function getTranslationPath(lang) {
      return path.join(config.languagesRootPath, compiled({ language: lang }));
    }

    const obj = {};
    for (let lang of config.languages) {
      obj[lang] = await fs.readJson(getTranslationPath(lang));
    }

    // Get all keys
    let keys = [];
    const langSources = {};
    for (let lang of config.languages) {
      const langKeys = Object.keys(obj[lang]);
      keys = _.union(keys, langKeys);

      langSources[lang] = obj[lang];
    }

    const rows = [];
    rows.push(config.header);
    for (let key of keys) {
      const row = [];
      row[getColNumber('key')] = key;
      row[getColNumber('note')] = '';
      for (let lang of config.languages) {
        row[getColNumber(lang)] = _.get(obj[lang], key);
      }

      rows.push(row);
    }

    return rows;
  }

  async function push(auth, rows) {
    const sheets = google.sheets({ version: 'v4', auth });

    console.log(rows);
    return await new Promise((resolve, reject) => {
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
