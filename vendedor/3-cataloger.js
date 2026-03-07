#!/usr/bin/env node
const { cliCataloger } = require('./src/core/tracker');
cliCataloger(process.argv.slice(2));
