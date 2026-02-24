// =============================================================
// MODULO 4: FOLLOW-UP AI - PRISMATIC LABS VENDEDOR AUTOMATICO
// Gera followups inteligentes baseados no historico do lead
// Roda diariamente via GitHub Actions para verificar quem precisa
// de followup e gera a mensagem certa para cada situacao
// =============================================================

const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const DB_FILE = path.join(__dirname, '..', 'data', 'crm', 'leads-database.json');
const FOLLOWUP_REPORT_FILE = path.join(__dirname, '..', 'data', 'relatorios', `followup_${new Date().toISOString().split('T')[0]}.json`);

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return { leads: [] };
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDB(db) {
  db.updated_at = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Verificar quais leads precisam de followup hoje
function getLeadsForFollowup(db) {
  const today = new Date();
  return db.leads.filter(lead => {
    // Ignorar fechados e perdidos
    if (['fechado', 'perdido'].includes(lead.status)) return false;
    // Ignorar leads que nao foram contatados ainda
    if (!lead.primeira_mensagem_enviada) return false;
    // Verificar se tem followup agendado para hoje ou antes
    if (!lead.proximo_followup) return false;
    const followupDate = new Date(lead.proximo_followup);
    return followupDate <= today;
  });
}

// Determinar qual tipo de followup enviar
function getFollowupType(lead) {
  const followupsEnviados = lead.followups_enviados || 0;
  if (followupsEnviados === 0) return 'dia3';    // Primeiro followup (3 dias sem resposta)
  if (followupsEnviados === 1) return 'dia7';    // Segundo followup (7 dias)
  if (followupsEnviados === 2) return 'dia14';   // Ultimo followup com oferta
  return 'encerrar';                              // Encerrar sequencia
}

// Gerar followup personalizado com IA
async function generateFollowup(lead) {
  const followupType = getFollowupType(lead);
  
  if (followupType === 'encerrar') {
    return {
      tipo: 'encerrar',
      mensagem: null,
      acao: 'mover_para_perdido'
    };
  }

  // Verificar se ja tem followup pre-gerado no Modulo 2
  const mensagensFile = path.join(__dirname, '..', 'data', 'mensagens', `${lead.username}_mensagens.json`);
  if (fs.existsSync(mensagensFile)) {
    const mensagensData = JSON.parse(fs.readFileSync(mensagensFile, 'utf8'));
    const followupKey = `followup_${followupType}`;
    if (mensagensData.mensagens?.[followupKey]) {
      return {
        tipo: followupType,
        mensagem: mensagensData.mensagens[followupKey],
        fonte: 'pre_gerado'
      };
    }
  }

  // Se nao tem pre-gerado, gerar com IA agora
  const a = lead.analise || {};
  const dayMap = { dia3: 3, dia7: 7, dia14: 14 };
  const dias = dayMap[followupType];
  
  const prompt = `Voce e o SUPER VENDEDOR da Prismatic Labs.

Um lead nao respondeu sua mensagem inicial. Gere um followup para o DIA ${dias}.

DADOS DO LEAD:
- Username: @${lead.username}
- Nicho: ${a.nicho || 'desconhecido'}
- Problema: ${a.problema_principal || 'desconhecido'}
- Prioridade: ${lead.prioridade}
- Followup numero: ${(lead.followups_enviados || 0) + 1} de 3

REGRAS DO FOLLOWUP DIA ${dias}:
${followupType === 'dia3' ? '- Leve e curioso, nao desesperado\n- Reforcar o beneficio principal\n- Pergunta diferente da primeira mensagem' : ''}
${followupType === 'dia7' ? '- Mostrar resultado concreto (case/numero)\n- Criar senso de urgencia sutil\n- Oferecer algo de valor gratuito (dica/analise)' : ''}
${followupType === 'dia14' ? '- ULTIMO followup - oferta especial com prazo\n- Desconto ou bonus exclusivo por 48h\n- Tom mais direto mas ainda amigavel' : ''}

Maximo 4 linhas. Retorne APENAS o texto da mensagem, sem JSON, sem aspas externas.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 256,
    });
    
    return {
      tipo: followupType,
      mensagem: completion.choices[0].message.content.trim(),
      fonte: 'gerado_agora'
    };
  } catch (e) {
    console.error(`[FOLLOWUP] Erro ao gerar para @${lead.username}:`, e.message);
    return null;
  }
}

// Calcular proximo followup
function calcNextFollowup(followupsEnviados) {
  const now = new Date();
  const daysMap = [7, 7, null]; // Apos 3 dias: proximo em 7; apos 7: proximo em 7; apos 14: null
  const days = daysMap[followupsEnviados] || null;
  if (!days) return null;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

// Executar followup para um lead
async function processLeadFollowup(lead, db) {
  console.log(`\n[FOLLOWUP] Processando @${lead.username} (followup #${(lead.followups_enviados || 0) + 1})`);
  
  const followupResult = await generateFollowup(lead);
  if (!followupResult) return null;
  
  if (followupResult.tipo === 'encerrar') {
    // Mover para perdido
    lead.status = 'perdido';
    lead.proximo_followup = null;
    lead.historico.push({
      evento: 'sequencia_encerrada',
      timestamp: new Date().toISOString(),
      dados: 'Sequencia de followup encerrada sem resposta'
    });
    console.log(`[FOLLOWUP] @${lead.username} -> PERDIDO (sem resposta apos 3 tentativas)`);
    return { username: lead.username, acao: 'encerrado' };
  }
  
  // Incrementar contador
  lead.followups_enviados = (lead.followups_enviados || 0) + 1;
  lead.proximo_followup = calcNextFollowup(lead.followups_enviados);
  lead.data_ultima_interacao = new Date().toISOString();
  lead.historico.push({
    evento: 'followup_gerado',
    timestamp: new Date().toISOString(),
    dados: `Followup ${followupResult.tipo} gerado - aguardando usuario enviar`
  });
  
  console.log(`[FOLLOWUP] @${lead.username} - Followup ${followupResult.tipo} pronto!`);
  console.log(`\n========== COPIE E COLE (Followup ${followupResult.tipo.toUpperCase()}) ==========`);
  console.log(followupResult.mensagem);
  console.log(`=================================================================\n`);
  
  return {
    username: lead.username,
    prioridade: lead.prioridade,
    tipo: followupResult.tipo,
    mensagem: followupResult.mensagem,
    followup_numero: lead.followups_enviados
  };
}

// EXECUCAO PRINCIPAL
async function run() {
  console.log('\n[FOLLOWUP] Iniciando verificacao diaria de followups...');
  
  const db = loadDB();
  const leadsParaFollowup = getLeadsForFollowup(db);
  
  console.log(`[FOLLOWUP] ${leadsParaFollowup.length} lead(s) precisam de followup hoje.`);
  
  if (leadsParaFollowup.length === 0) {
    console.log('[FOLLOWUP] Nenhum followup necessario. Ate amanha!');
    return;
  }

  const results = [];
  
  // Ordenar por prioridade: hot primeiro
  const sorted = leadsParaFollowup.sort((a, b) => {
    const order = { hot: 0, warm: 1, cold: 2 };
    return (order[a.prioridade] || 2) - (order[b.prioridade] || 2);
  });

  for (const lead of sorted) {
    const result = await processLeadFollowup(lead, db);
    if (result) results.push(result);
    // Pausa entre chamadas API
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Salvar DB atualizado
  saveDB(db);
  
  // Salvar relatorio
  const reportDir = path.join(__dirname, '..', 'data', 'relatorios');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  
  const report = {
    data: new Date().toISOString(),
    total_processados: results.length,
    followups: results
  };
  fs.writeFileSync(FOLLOWUP_REPORT_FILE, JSON.stringify(report, null, 2));
  
  console.log(`\n[FOLLOWUP] Relatorio salvo: ${FOLLOWUP_REPORT_FILE}`);
  console.log(`[FOLLOWUP] Total de followups gerados: ${results.filter(r => r.acao !== 'encerrado').length}`);
  console.log('[FOLLOWUP] Concluido!');
  
  // Output para GitHub Actions
  console.log(`\nFOLLOWUP_REPORT=${JSON.stringify(report)}`);
}

run().catch(e => { console.error('[FOLLOWUP] Erro fatal:', e.message); process.exit(1); });
