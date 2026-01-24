#!/usr/bin/env node
require('dotenv').config();

const tests = [
  {
    name: 'Groq API Key',
    check: () => {
      const key = process.env.GROQ_API_KEY;
      return key && key.startsWith('gsk_');
    },
    help: 'Configure GROQ_API_KEY no arquivo .env (obtenha em https://console.groq.com/keys)'
  },
  {
    name: 'Google Drive Credentials',
    check: () => {
      try {
        const creds = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS_JSON || '{}');
        return creds.type === 'service_account';
      } catch {
        return false;
      }
    },
    help: 'Configure GOOGLE_DRIVE_CREDENTIALS_JSON no arquivo .env (JSON completo)'
  },
  {
    name: 'Google Drive Folder ID',
    check: () => !!process.env.GOOGLE_DRIVE_FOLDER_ID,
    help: 'Configure GOOGLE_DRIVE_FOLDER_ID no arquivo .env'
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
  console.log('   Veja: automation/SETUP-GROQ.md\n');
  process.exit(1);
} else {
  console.log('✅ Tudo configurado! Pode executar a automação.');
  console.log('🚀 Execute: npm run generate:all Fevereiro\n');
}
