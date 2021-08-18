const authorize = require('./authorize');
const { google } = require('googleapis');

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const { createGetColNumber, fillUndefinedWithEmptyString } = require('./utils');

const parser = require('xml2json');

module.exports = function(config) {
  authorize(config, run);
  const getColNumber = createGetColNumber(config.header);

  async function run(auth) {
    try {
      console.log('Pushing...');

      rows = await getTranslationRows(config.format);
      console.log(rows)
      newRows = fillUndefinedWithEmptyString(rows, rows[0].length);
      await push(auth, newRows);

      console.log('Push completed');
    } catch (error) {
      console.log('Pull error = ', error);
    }
  }

  async function getTranslationRows(format) {
    // Get language path
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiled = _.template(config.languagePathPattern);
    function getTranslationPath(lang) {
      return path.join(config.languagesRootPath, compiled({ language: lang }));
    }

    const obj = {};

    switch (format) {
      case "xml":
        for (let lang of config.languages) {
          const xml = await fs.readFile(getTranslationPath(lang))
          const json = JSON.parse(parser.toJson(xml, {reversible: true}));
          // translate to the desired format
          const contents = Object.fromEntries(json?.resources?.string?.map(i => [i['name'], i['$t']]))
          // console.log(JSON.stringify(contents))

           obj[lang] = contents;
        }

        break;

      case "strings":
        for (let lang of config.languages) {
          const text = await fs.readFile(getTranslationPath(lang), 'utf8')
          const lines = text.split('\n')

          const re = /"(.+)"\s*\=\s*"(.+)"/;
          const entries = lines.map(line => {
            const match = line.match(re)
            if (match) {
              return [match[1].replaceAll("\\\"", "\"").replaceAll("\\\\", "\\"), match[2].replaceAll("\\\"", "\"").replaceAll("\\\\", "\\")]
            }
          }).filter(i => i)

          // console.log(Object.fromEntries(entries))

           obj[lang] = Object.fromEntries(entries);
        }

        break;

      default: // json
        for (let lang of config.languages) {
          obj[lang] = await fs.readJson(getTranslationPath(lang));
        }

        break;
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
