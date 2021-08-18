const authorize = require('./authorize');
const { google } = require('googleapis');

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const { createGetColNumber } = require('./utils');

const parser = require('xml2json');

module.exports = function(config) {
  authorize(config, run);
  const getColNumber = createGetColNumber(config.header);

  async function run(auth) {
    try {
      console.log('Pulling...');
      const rows = await pull(auth);
      await writeTranslation(rows);
      console.log('Pull completed');
    } catch (error) {
      console.log('Pull error = ', error);
    }
  }

  async function pull(auth) {
    const sheets = google.sheets({ version: 'v4', auth });

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

    const rows = res.data.values;
    return rows;
  }

  async function writeTranslation(rows) {
    // Get language path
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    const compiled = _.template(config.languagePathPattern);
    function getTranslationPath(lang) {
      return path.join(config.languagesRootPath, compiled({ language: lang }));
    }

    // Remove header
    if (config.header) {
      rows.shift();
    }

    // Write file
    for (let lang of config.languages) {
      const prevPath = getTranslationPath(lang);
      let prevObj;
      try {
        prevObj = (await fs.readJson(prevPath)) || {};
      } catch (error) {
        prevObj = {};
      }

      const translation = {};
      rows.forEach(row => {
        const key = row[getColNumber('key')];
        const value = row[getColNumber(lang)];

        // value undefined or contain \n
        if (value) {
          translation[key] = value.trim();
        }
      });

      // structure for xml
      const entries = {
        ...prevObj,
        ...translation
      }

      switch (config.format) {
        case 'xml':
          const finalTranslation = {
            resources: {
              string: Object.entries(entries).map(([k,v]) => {
                return {
                  name: k,
                  ['$t']: v,
                }
              })
            }
          };

          // console.log(finalTranslation)

          // force some formatting in a lazy way
          var xml = parser.toXml(JSON.stringify(finalTranslation), { sanitize: true, reversible: true }).replace('<resources>', '<resources>\n').replaceAll('</string>', '</string>\n').replaceAll('<string name=', '\t<string name=');
          fs.writeFile(prevPath, xml, function(err, data) {
            if (err) {
              console.log(err);
            }
          });

          break

        case 'strings':
          // escape quotes
          let output = Object.entries(entries).map(([k,v]) => {
                return `"${k.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}" = "${v.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`
              }).join('\n')
          fs.writeFile(prevPath, output, function(err, data) {
            if (err) {
              console.log(err);
            }
          });

          break

        default: // json
          await fs.outputJSON(prevPath, entries, { spaces: 2 });

          break
      }
    }
  }
};
