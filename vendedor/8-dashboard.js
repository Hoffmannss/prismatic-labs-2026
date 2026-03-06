// =============================================================
// MODULO 8: DASHBOARD - PRISMATIC LABS VENDEDOR AI
// Uso: node 8-dashboard.js [porta]
// Acesso: http://localhost:3131
// =============================================================

require('dotenv').config();
const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT     = parseInt(process.argv[2]) || 3131;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE  = path.join(DATA_DIR, 'crm', 'leads-database.json');
const HTML_FILE = path.join(__dirname, 'public', 'dashboard.html');

function loadData() {
  const db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : { leads: [] };
  return { leads: db.leads || [], updated_at: db.updated_at };
}

function getLeadMessages(username) {
  const f = path.join(DATA_DIR, 'mensagens', `${username}_mensagens.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}

function updateLeadStatus(username, status, nota) {
  if (!fs.existsSync(DB_FILE)) return false;
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const lead = db.leads.find(l => l.username === username);
  if (!lead) return false;
  const old = lead.status;
  lead.status = status;
  lead.atualizado_em = new Date().toISOString();
  lead.data_ultima_interacao = new Date().toISOString();
  if (nota) {
    if (!lead.notas) lead.notas = [];
    lead.notas.push({ timestamp: new Date().toISOString(), texto: nota });
  }
  if (!lead.historico) lead.historico = [];
  lead.historico.push({ evento: 'status_alterado', timestamp: new Date().toISOString(), dados: `${old} -> ${status}${nota ? ': ' + nota : ''}` });
  db.updated_at = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  return true;
}

const server = http.createServer((req, res) => {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // Servir dashboard HTML
  if (req.method === 'GET' && pathname === '/') {
    const html = fs.readFileSync(HTML_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  // API: dados do CRM
  if (req.method === 'GET' && pathname === '/api/data') {
    const data  = loadData();
    const now   = Date.now();
    const leads = data.leads.map(l => {
      const msgs = getLeadMessages(l.username);
      const dias = l.data_ultima_interacao
        ? Math.floor((now - new Date(l.data_ultima_interacao).getTime()) / 86400000)
        : null;
      const followupHoje = l.proximo_followup
        && new Date(l.proximo_followup) <= new Date()
        && !['fechado','perdido'].includes(l.status)
        && l.primeira_mensagem_enviada;
      return {
        ...l,
        msgs_resumo: msgs ? {
          score:   msgs.revisao?.score,
          nivel:   msgs.revisao?.nivel,
          produto: msgs.produto_detectado,
          msg_final: msgs.revisao?.mensagem_final || null
        } : null,
        dias_ultima_interacao: dias,
        followup_pendente: !!followupHoje
      };
    });
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify({ leads, updated_at: data.updated_at }));
  }

  // API: atualizar status
  if (req.method === 'POST' && pathname === '/api/status') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { username, status, nota } = JSON.parse(body);
        const ok = updateLeadStatus(username, status, nota);
        res.writeHead(ok ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok, message: ok ? 'Atualizado' : 'Lead nao encontrado' }));
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('\n\x1b[35m' + '='.repeat(52) + '\x1b[0m');
  console.log('\x1b[1m  VENDEDOR AI DASHBOARD\x1b[0m');
  console.log('\x1b[35m' + '='.repeat(52) + '\x1b[0m');
  console.log('  \x1b[32m-> http://localhost:' + PORT + '\x1b[0m');
  console.log('  Auto-refresh: 30s | Ctrl+C para parar');
  console.log('\x1b[35m' + '='.repeat(52) + '\x1b[0m\n');
});
