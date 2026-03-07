#!/usr/bin/env node
const { runLearner } = require('./src/agents/learner');
runLearner().catch((err) => {
  console.error('[LEARNER] Erro fatal:', err.message);
  process.exit(1);
});
