#!/usr/bin/env node
const path = require('path');
const { spawnSync } = require('child_process');

const VENDEDOR_ROOT = path.resolve(__dirname, '..', '..');
const scriptPath = path.join(VENDEDOR_ROOT, '4-followup.js');
const result = spawnSync('node', [scriptPath, ...process.argv.slice(2)], {
  env: process.env,
  stdio: 'inherit',
  cwd: VENDEDOR_ROOT
});
process.exit(result.status || 0);
