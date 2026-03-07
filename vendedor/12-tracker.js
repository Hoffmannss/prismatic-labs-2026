#!/usr/bin/env node
const { cliTracker } = require('./src/core/tracker');
cliTracker(process.argv.slice(2));
