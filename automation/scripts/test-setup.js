#!/usr/bin/env node
require('dotenv').config();

const tests = [
  {
    name: 'Gemini API Key',
    check: () => !!process.env.GEMINI_API_KEY,
    help: 'Configure GEMINI_API_KEY no arquivo .env'
  },
  {
    name: 'Google Service Account',
    check: () => {
      try {
        const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
        return sa.type === 'service_account';
      } catch {
        return false;
      }
    },
    help: 'Configure GOOGLE_SERVICE_ACCOUNT no arquivo .env (JSON completo)'
  },
  {
    name: 'Drive Folder ID',
    check: () => !!process.env.DRIVE_FOLDER_ID,
    help: 'Configure DRIVE_FOLDER_ID no arquivo .env'
  },
  {
    name: 'Make.com Webhook',
    check: () => process.env.MAKE_WEBHOOK_URL?.startsWith('https://hook'),
    help: 'Configure MAKE_WEBHOOK_URL no arquivo .env'
  }
];

console.log('\n🔧 Testando configurações...\n');

let passed = 0;
let failed = 0;

tests.forEach(test => {
  const result = test.check();
  const icon = result ? '✅' : '❌';
  console.log(`${icon} ${test.name}`);
  
  if (!result) {
    console.log(`   → ${test.help}`);
    failed++;
  } else {
    passed++;
  }
});

console.log(`\n📊 Resultado: ${passed}/${tests.length} testes passaram\n`);

if (failed > 0) {
  console.log('⚠️  Configure as variáveis faltantes antes de rodar a automação.');
  console.log('   Veja: automation/.env.example\n');
  process.exit(1);
} else {
  console.log('✅ Tudo configurado! Pode executar a automação.\n');
}