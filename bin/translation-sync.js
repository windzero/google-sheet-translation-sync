#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const packageJson = require('../package.json');
const pull = require('../src/pull');
const push = require('../src/push');
const sort = require('../src/sort');

const cliName = 'translation-sync';

program
  .version(packageJson.version, '-v, --version', 'output cli version')
  .name(cliName)
  .description(packageJson.description);

program
  .command('pull')
  .description('pull translations from server')
  .option('-c, --config <configPath>', 'config custom path')
  .action(cmdObj => {
    const defaultConfigPath = path.resolve(process.cwd(), 'translation-sync.config.js');
    const configPath = path.resolve(cmdObj.config || defaultConfigPath);
    const isExist = fs.existsSync(configPath);
    if (!isExist) {
      console.log(chalk.red('Config file not exist', configPath));
      cmdObj.help();
      return;
    }

    const config = require(configPath);
    pull(config);
  })
  .on('--help', function() {
    console.log('');
    console.log('Examples:');
    console.log('  $ translation-sync pull');
    console.log('  $ translation-sync pull --config ./custom-path/translation-sync.config.js');
  });

program
  .command('push')
  .description('push translations to server')
  .option('-c, --config <configPath>', 'config custom path')
  .action(cmdObj => {
    const defaultConfigPath = path.resolve(process.cwd(), 'translation-sync.config.js');
    const configPath = path.resolve(cmdObj.config || defaultConfigPath);
    const isExist = fs.existsSync(configPath);
    if (!isExist) {
      console.log(chalk.red('Config file not exist', configPath));
      cmdObj.help();
      return;
    }

    const config = require(configPath);
    push(config);
  })
  .on('--help', function() {
    console.log('');
    console.log('Examples:');
    console.log('  $ translation-sync push');
    console.log('  $ translation-sync push --config ./custom-path/translation-sync.config.js');
  });

program
  .command('sort')
  .description('sort server translations')
  .option('-c, --config <configPath>', 'config custom path')
  .action(cmdObj => {
    const defaultConfigPath = path.resolve(process.cwd(), 'translation-sync.config.js');
    const configPath = path.resolve(cmdObj.config || defaultConfigPath);
    const isExist = fs.existsSync(configPath);
    if (!isExist) {
      console.log(chalk.red('Config file not exist', configPath));
      cmdObj.help();
      return;
    }

    const config = require(configPath);
    sort(config);
  })
  .on('--help', function() {
    console.log('');
    console.log('Examples:');
    console.log('  $ translation-sync sort');
    console.log('  $ translation-sync sort --config ./custom-path/translation-sync.config.js');
  });

program.parse(process.argv);
