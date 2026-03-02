#!/usr/bin/env node
// ============================================================
// MODULO 4: REVIEWER
// Revisa mensagens antes de aprovacao para envio
// Garante qualidade e evita publicacao prematura
// ============================================================

const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey: GROQ_API_KEY });

const CRM_FILE = path.join(__dirname, 'data', 'crm.json');
const MISSION_CONTROL = path.join(__dirname, '..', 'jarvis', 'mission-control.json');

function loadCRM() {
  if (fs.existsSync(CRM_FILE)) {
    return JSON.parse(fs.readFileSync(CRM_FILE, 'utf8'));
  }
  return { leads: [], ultimaAtualizacao: null };
}

function saveCRM(crm) {
  crm.ultimaAtualizacao = new Date().toISOString();
  fs.writeFileSync(CRM_FILE, JSON.stringify(crm, null, 2));
}

function updateDashboard(metrics) {
  if (fs.existsSync(MISSION_CONTROL)) {
    const dashboard = JSON.parse(fs.readFileSync(MISSION_CONTROL, 'utf8'));
    dashboard.agents.reviewer.lastActivity = new Date().toISOString();
    dashboard.agents.reviewer.metrics = metrics;
    dashboard.agents.reviewer.status = 'idle';
    fs.writeFileSync(MISSION_CONTROL, JSON.stringify(dashboard, null, 2));
  }
}

async function reviewMessage(lead) {
  const prompt = `Você é um revisor de qualidade de mensagens de vendas.

ANALISE ESTA MENSAGEM:

Lead: @${lead.username}
Perfil: ${lead.perfil || 'N/A'}
Score: ${lead.score}/100
Nicho: ${lead.nicho || 'infoprodutores'}

Mensagem:
${lead.mensagem}

CRITÉRIOS DE APROVAÇÃO:
1. Tom profissional mas amigável ✓
2. Sem erros gramaticais ✓
3. Personalização adequada ao perfil ✓
4. CTA claro e não agressivo ✓
5. Comprimento adequado (não muito longo) ✓
6. Evita spam triggers ✓

RESPONDA EM JSON:
{
  "aprovado": true/false,
  "score_qualidade": 0-100,
  "problemas": ["lista de problemas encontrados"],
  "sugestoes": ["melhorias opcionais"],
  "motivo_rejeicao": "se rejeitado, explicar por que"
}`;

  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0]?.message?.content || '{}');
}

async function reviewBatch(usernames = null) {
  console.log('\x1b[36m');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🔍 REVIEWER - Quality Control Agent    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\x1b[0m\n');

  const crm = loadCRM();
  
  // Filtrar leads aguardando revisão
  let leadsParaRevisar = crm.leads.filter(l => 
    l.mensagem && 
    (l.status === 'aguardando_revisao' || !l.status)
  );

  // Se usernames especificados, filtrar apenas esses
  if (usernames && usernames.length > 0) {
    leadsParaRevisar = leadsParaRevisar.filter(l => usernames.includes(l.username));
  }

  if (leadsParaRevisar.length === 0) {
    console.log('\x1b[33m⚠️  Nenhuma mensagem aguardando revisão\x1b[0m\n');
    updateDashboard({
      messagesReviewed: 0,
      rejectionRate: 0
    });
    return;
  }

  console.log(`📋 ${leadsParaRevisar.length} mensagens para revisar\n`);

  let approved = 0;
  let rejected = 0;
  let totalQualityScore = 0;

  for (const lead of leadsParaRevisar) {
    console.log(`\x1b[36m━━━ @${lead.username} ━━━\x1b[0m`);
    
    try {
      const review = await reviewMessage(lead);
      
      totalQualityScore += review.score_qualidade || 0;

      if (review.aprovado) {
        lead.status = 'aprovado';
        lead.qualityScore = review.score_qualidade;
        lead.revisadoEm = new Date().toISOString();
        approved++;
        
        console.log(`\x1b[32m✅ APROVADO\x1b[0m (Qualidade: ${review.score_qualidade}/100)`);
        
        if (review.sugestoes && review.sugestoes.length > 0) {
          console.log('💡 Sugestões:', review.sugestoes.join(', '));
        }
      } else {
        lead.status = 'rejeitado';
        lead.motivoRejeicao = review.motivo_rejeicao;
        lead.problemas = review.problemas;
        rejected++;
        
        console.log(`\x1b[31m❌ REJEITADO\x1b[0m`);
        console.log(`Motivo: ${review.motivo_rejeicao}`);
        console.log(`Problemas: ${review.problemas.join(', ')}`);
      }
    } catch (error) {
      console.error(`\x1b[31m❌ Erro ao revisar @${lead.username}: ${error.message}\x1b[0m`);
      lead.status = 'erro_revisao';
      lead.erro = error.message;
    }
    
    console.log('');
  }

  saveCRM(crm);

  // Atualizar métricas no dashboard
  const avgQuality = leadsParaRevisar.length > 0 
    ? Math.round(totalQualityScore / leadsParaRevisar.length)
    : 0;

  const rejectionRate = leadsParaRevisar.length > 0
    ? Math.round((rejected / leadsParaRevisar.length) * 100)
    : 0;

  updateDashboard({
    messagesReviewed: leadsParaRevisar.length,
    rejectionRate: rejectionRate
  });

  console.log('\x1b[36m══════════════════════════════════════════\x1b[0m');
  console.log(`\x1b[32m✅ Aprovadas: ${approved}\x1b[0m`);
  console.log(`\x1b[31m❌ Rejeitadas: ${rejected}\x1b[0m`);
  console.log(`\x1b[33m📊 Taxa de Rejeição: ${rejectionRate}%\x1b[0m`);
  console.log(`\x1b[36m⭐ Qualidade Média: ${avgQuality}/100\x1b[0m`);
  console.log('\x1b[36m══════════════════════════════════════════\x1b[0m\n');

  console.log('\x1b[32m✅ Revisão completa! Mensagens aprovadas prontas para envio.\x1b[0m\n');
}

if (require.main === module) {
  const username = process.argv[2];
  const usernames = username ? [username] : null;
  reviewBatch(usernames).catch(console.error);
}

module.exports = { reviewBatch, reviewMessage };
