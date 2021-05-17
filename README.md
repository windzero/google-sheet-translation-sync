# GUIDE

[![npm version](https://badge.fury.io/js/google-sheet-translation-sync.svg)](https://badge.fury.io/js/google-sheet-translation-sync)

## Installation

```bash
yarn add -D google-sheet-translation-sync

npm install --save-dev google-sheet-translation-sync
```

## Create google sheet app and download app `credentials.json`

https://developers.google.com/sheets/api/quickstart/nodejs

## Add config file

- Should create a folder names `translation-sync` and put `translation-sync.config.js` file in it
- `translation-sync.config.js` examples:

```js
const path = require('path');
const languages = ['en', 'vi'];
const defaultLanguage = 'en';

module.exports = {
  credentialsPath: path.join(__dirname, 'credentials.json'),
  tokenPath: path.join(__dirname, 'token.json'),
  languages: languages,
  defaultLanguage: defaultLanguage,
  languagesRootPath: path.join(__dirname, '../src/languages'),
  languagePathPattern: '{{language}}/translation.json',
  header: ['note', 'key', ...languages],
  spreadsSheetId: '1m2BEgWXkQm***',
  sheetName: 'Sheet1',
  range: 'A1:F1500' // Sheet range
};
```

### Folder structure

```bash
project-folder
  example
    translation-sync.config.js
    credentials.json # Google app credentials
    token.json # Generated when run pull or push for the first time

  package.json
```

### .gitignore

Add `credential.json` and `token.json` to `.gitignore`
Example:

```bash
/example/credentials.json
/example/token.json
```

## CLI usage

### pull

- Pull translations from Google Sheet

```bash
translation-sync pull --config ./custom-path/translation-sync.config.js
```

### push

- Push translations from your project

```bash
translation-sync push --config ./custom-path/translation-sync.config.js
```

### sort

- Sort server translations
- Sort by key
- Move rows that have non-empty note to the bottom
- Move rows that have empty or `__NOT_TRANSLATED__` language value to the bottom

```bash
translation-sync sort --config ./custom-path/translation-sync.config.js
```

## API usage

```js
const { pull, push, sort } = require('google-sheet-translation-sync');
const config = require('./example/translation-sync.config.js');

pull(config);
push(config);
sort(config);
```
