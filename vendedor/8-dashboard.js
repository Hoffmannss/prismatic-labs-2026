// =============================================================
// MODULO 8: DASHBOARD - PRISMATIC LABS VENDEDOR AI
// Dashboard web interativo para acompanhar o pipeline de vendas
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
const PL_FILE  = path.join(DATA_DIR, 'crm', 'pipeline.json');

function loadData() {
  const db  = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : { leads: [] };
  const pl  = fs.existsSync(PL_FILE) ? JSON.parse(fs.readFileSync(PL_FILE, 'utf8')) : {};
  return { leads: db.leads || [], pipeline: pl, updated_at: db.updated_at };
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
  if (nota) lead.notas.push({ timestamp: new Date().toISOString(), texto: nota });
  lead.historico.push({ evento: 'status_alterado', timestamp: new Date().toISOString(), dados: `${old} -> ${status}${nota ? ': ' + nota : ''}` });
  db.updated_at = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  return true;
}

function getLeadMessages(username) {
  const f = path.join(DATA_DIR, 'mensagens', `${username}_mensagens.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}

function serveHTML(res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(getDashboardHTML());
}

function serveAPI(res) {
  const data = loadData();
  // Enriquecer leads com mensagens e dias desde ultima interacao
  const now = Date.now();
  const enriched = data.leads.map(l => {
    const msgs = getLeadMessages(l.username);
    const dias = l.data_ultima_interacao
      ? Math.floor((now - new Date(l.data_ultima_interacao).getTime()) / 86400000) : null;
    const followupHoje = l.proximo_followup && new Date(l.proximo_followup) <= new Date() &&
      !['fechado','perdido'].includes(l.status) && l.primeira_mensagem_enviada;
    return { ...l, msgs_resumo: msgs ? { score: msgs.revisao?.score, nivel: msgs.revisao?.nivel, produto: msgs.produto_detectado } : null, dias_ultima_interacao: dias, followup_pendente: followupHoje };
  });
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ leads: enriched, pipeline: data.pipeline, updated_at: data.updated_at }));
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'GET' && pathname === '/') return serveHTML(res);
  if (req.method === 'GET' && pathname === '/api/data') return serveAPI(res);

  if (req.method === 'POST' && pathname === '/api/status') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { username, status, nota } = JSON.parse(body);
        const ok = updateLeadStatus(username, status, nota);
        res.writeHead(ok ? 200 : 404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok, message: ok ? 'Status atualizado' : 'Lead nao encontrado' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n\x1b[35m${'='.repeat(52)}\x1b[0m`);
  console.log(`\x1b[1m  VENDEDOR AI DASHBOARD\x1b[0m`);
  console.log(`\x1b[35m${'='.repeat(52)}\x1b[0m`);
  console.log(`  \x1b[32m-> http://localhost:${PORT}\x1b[0m`);
  console.log(`  Atualizacao automatica: 30s`);
  console.log(`  Ctrl+C para parar`);
  console.log(`\x1b[35m${'='.repeat(52)}\x1b[0m\n`);
});

function getDashboardHTML() {
return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vendedor AI — Prismatic Labs</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  * { box-sizing: border-box; }
  body { background: #08080f; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #12121f; }
  ::-webkit-scrollbar-thumb { background: #2e2e50; border-radius: 3px; }
  .card { background: #10101e; border: 1px solid #1e1e38; border-radius: 12px; }
  .kpi-card { background: linear-gradient(135deg, #10101e 0%, #14142a 100%); border: 1px solid #1e1e38; border-radius: 14px; transition: transform .15s, border-color .15s; }
  .kpi-card:hover { transform: translateY(-2px); border-color: #4f4f8f; }
  .lead-card { background: #0e0e1c; border: 1px solid #1a1a32; border-radius: 10px; cursor: pointer; transition: all .15s; }
  .lead-card:hover { border-color: #6366f1; background: #12122a; transform: translateY(-1px); }
  .badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px; text-transform: uppercase; letter-spacing: .5px; }
  .badge-hot   { background: rgba(239,68,68,.15);  color: #f87171; border: 1px solid rgba(239,68,68,.3); }
  .badge-warm  { background: rgba(245,158,11,.15); color: #fbbf24; border: 1px solid rgba(245,158,11,.3); }
  .badge-cold  { background: rgba(59,130,246,.15); color: #60a5fa; border: 1px solid rgba(59,130,246,.3); }
  .badge-novo  { background: rgba(99,102,241,.1);  color: #818cf8; }
  .badge-contatado { background: rgba(16,185,129,.1); color: #34d399; }
  .badge-negociacao { background: rgba(245,158,11,.1); color: #fbbf24; }
  .badge-fechado { background: rgba(16,185,129,.2); color: #10b981; }
  .badge-perdido { background: rgba(239,68,68,.1); color: #f87171; }
  .badge-api { background: rgba(99,102,241,.12); color: #818cf8; }
  .badge-lp  { background: rgba(168,85,247,.12); color: #c084fc; }
  .pulse { animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.8); z-index:50; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
  .modal-box { background:#10101e; border:1px solid #2e2e50; border-radius:16px; width:90%; max-width:640px; max-height:85vh; overflow-y:auto; }
  .kanban-col { min-height:100px; }
  .followup-dot { width:8px; height:8px; background:#ef4444; border-radius:50%; display:inline-block; animation:pulse 1.5s infinite; }
  .score-ring { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; border: 2px solid; }
  .score-high { border-color:#10b981; color:#10b981; background:rgba(16,185,129,.08); }
  .score-mid  { border-color:#f59e0b; color:#f59e0b; background:rgba(245,158,11,.08); }
  .score-low  { border-color:#6b7280; color:#9ca3af; background:rgba(107,114,128,.08); }
  .tab-btn { padding:6px 14px; border-radius:8px; font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; color:#64748b; }
  .tab-btn.active { background:#1e1e38; color:#e2e8f0; }
  .tab-btn:hover:not(.active) { color:#94a3b8; }
  .header-glow { text-shadow: 0 0 20px rgba(99,102,241,.5); }
</style>
</head>
<body class="min-h-screen">

<!-- HEADER -->
<header class="border-b border-[#1e1e38] bg-[#08080f]/80 sticky top-0 z-40 backdrop-blur">
  <div class="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg">🔷</div>
      <div>
        <h1 class="text-sm font-bold text-indigo-400 header-glow tracking-wide">PRISMATIC LABS</h1>
        <p class="text-xs text-slate-500">Vendedor AI Dashboard</p>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 text-xs text-slate-500" id="last-update">Carregando...</div>
      <div class="flex items-center gap-1.5 text-xs">
        <span class="w-2 h-2 rounded-full bg-emerald-500 pulse"></span>
        <span class="text-emerald-400">Live</span>
      </div>
    </div>
  </div>
</header>

<!-- MAIN -->
<main class="max-w-[1400px] mx-auto px-6 py-6">

  <!-- KPI CARDS -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="kpi-row"></div>

  <!-- FILTER TABS -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex gap-1 bg-[#10101e] border border-[#1e1e38] rounded-10 p-1" id="filter-tabs">
      <button class="tab-btn active" data-filter="all">Todos</button>
      <button class="tab-btn" data-filter="hot">🔴 Hot</button>
      <button class="tab-btn" data-filter="warm">🟡 Warm</button>
      <button class="tab-btn" data-filter="cold">🔵 Cold</button>
      <button class="tab-btn" data-filter="followup">⏰ Followup</button>
    </div>
    <div class="text-xs text-slate-500">Atualiza em <span id="countdown">30</span>s</div>
  </div>

  <!-- KANBAN -->
  <div class="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-6">
    <div id="col-novo"         class="kanban-col"></div>
    <div id="col-contatado"    class="kanban-col"></div>
    <div id="col-em_negociacao" class="kanban-col"></div>
    <div id="col-fechado"      class="kanban-col"></div>
    <div id="col-perdido"      class="kanban-col"></div>
  </div>

  <!-- BOTTOM ROW: CHART + FOLLOWUPS -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="card p-4 md:col-span-2">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Score de Potencial por Lead</p>
      <canvas id="scoreChart" height="120"></canvas>
    </div>
    <div class="card p-4" id="followup-panel">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">⏰ Followups Hoje</p>
      <div id="followup-list" class="space-y-2"></div>
    </div>
  </div>

</main>

<!-- MODAL -->
<div class="modal-overlay hidden" id="modal">
  <div class="modal-box">
    <div class="flex items-center justify-between p-5 border-b border-[#1e1e38]">
      <div>
        <h2 class="font-bold text-lg" id="modal-title">@username</h2>
        <p class="text-xs text-slate-500" id="modal-sub"></p>
      </div>
      <div class="flex items-center gap-2">
        <select id="modal-status" class="bg-[#1a1a30] border border-[#2e2e50] text-sm rounded-lg px-3 py-1.5 text-slate-200">
          <option value="novo">Novo</option>
          <option value="contatado">Contatado</option>
          <option value="respondeu">Respondeu</option>
          <option value="em_negociacao">Em Negociacao</option>
          <option value="fechado">Fechado</option>
          <option value="perdido">Perdido</option>
        </select>
        <button id="modal-save" class="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-lg">Salvar</button>
        <button onclick="closeModal()" class="text-slate-500 hover:text-slate-200 text-xl w-8 h-8 flex items-center justify-center">×</button>
      </div>
    </div>
    <div class="p-5 space-y-4" id="modal-body"></div>
  </div>
</div>

<script>
let allLeads = [];
let pipeline = {};
let activeFilter = 'all';
let chartInstance = null;
let countdownVal = 30;
let currentModal = null;

async function fetchData() {
  const res  = await fetch('/api/data');
  const data = await res.json();
  allLeads = data.leads || [];
  pipeline = data.pipeline || {};
  document.getElementById('last-update').textContent = 'Atualizado: ' + new Date().toLocaleTimeString('pt-BR');
  render();
}

function render() {
  renderKPIs();
  renderKanban();
  renderChart();
  renderFollowups();
}

function filtered() {
  if (activeFilter === 'all')      return allLeads;
  if (activeFilter === 'followup') return allLeads.filter(l => l.followup_pendente);
  return allLeads.filter(l => l.prioridade === activeFilter);
}

// --- KPIs ---
function renderKPIs() {
  const leads = allLeads;
  const hot  = leads.filter(l => l.prioridade === 'hot').length;
  const warm = leads.filter(l => l.prioridade === 'warm').length;
  const contatados = leads.filter(l => l.primeira_mensagem_enviada).length;
  const fechados   = leads.filter(l => l.status === 'fechado').length;
  const negoc = leads.filter(l => l.status === 'em_negociacao').length;
  const taxa = leads.length ? Math.round((contatados / leads.length) * 100) : 0;
  const followupsHoje = leads.filter(l => l.followup_pendente).length;

  const kpis = [
    { label: 'Total Leads',     value: leads.length, sub: `${hot} hot · ${warm} warm`, icon: '\ud83d\udc65', color: 'indigo' },
    { label: 'Taxa de Contato', value: taxa + '%',    sub: `${contatados} de ${leads.length} contatados`, icon: '\ud83d\udce8', color: 'emerald' },
    { label: 'Em Negociacao',   value: negoc,         sub: `${fechados} fechados`, icon: '\ud83d\udcac', color: 'amber' },
    { label: 'Followups Hoje',  value: followupsHoje, sub: followupsHoje > 0 ? 'Pendentes agora' : 'Tudo em dia', icon: '\u23f0', color: followupsHoje > 0 ? 'red' : 'slate' },
  ];
  const colors = { indigo: '#6366f1', emerald: '#10b981', amber: '#f59e0b', red: '#ef4444', slate: '#64748b' };
  document.getElementById('kpi-row').innerHTML = kpis.map(k => `
    <div class="kpi-card p-4">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs text-slate-500 font-medium mb-1">${k.label}</p>
          <p class="text-3xl font-bold" style="color:${colors[k.color]}">${k.value}</p>
          <p class="text-xs text-slate-600 mt-1">${k.sub}</p>
        </div>
        <span class="text-2xl opacity-60">${k.icon}</span>
      </div>
    </div>
  `).join('');
}

// --- KANBAN ---
const COLS = [
  { id: 'novo',          label: 'Novo',          cls: 'badge-novo' },
  { id: 'contatado',     label: 'Contatado',     cls: 'badge-contatado' },
  { id: 'em_negociacao', label: 'Em Negociacao', cls: 'badge-negociacao' },
  { id: 'fechado',       label: 'Fechado',       cls: 'badge-fechado' },
  { id: 'perdido',       label: 'Perdido',       cls: 'badge-perdido' },
];

function scoreClass(s) {
  if (s >= 70) return 'score-high';
  if (s >= 40) return 'score-mid';
  return 'score-low';
}

function prodBadge(p) {
  if (!p) return '';
  return p === 'lead_normalizer_api'
    ? '<span class="badge badge-api">API</span>'
    : '<span class="badge badge-lp">LP</span>';
}

function renderKanban() {
  const leads = filtered();
  COLS.forEach(col => {
    const colLeads = leads.filter(l => (l.status || 'novo') === col.id);
    document.getElementById('col-' + col.id).innerHTML = `
      <div class="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center justify-between mb-2 px-1">
        <span>${col.label}</span>
        <span class="badge ${col.cls}">${colLeads.length}</span>
      </div>
      <div class="space-y-2 kanban-col">
        ${colLeads.length === 0 ? '<div class="text-center text-slate-700 text-xs py-6">vazio</div>' : colLeads.map(l => renderLeadCard(l)).join('')}
      </div>
    `;
  });
  document.querySelectorAll('.lead-card').forEach(el => {
    el.addEventListener('click', () => openModal(el.dataset.username));
  });
}

function renderLeadCard(l) {
  const pBadge = l.prioridade === 'hot' ? 'badge-hot' : l.prioridade === 'warm' ? 'badge-warm' : 'badge-cold';
  const sc = l.score || 0;
  const dias = l.dias_ultima_interacao !== null ? `${l.dias_ultima_interacao}d` : '-';
  const fp = l.followup_pendente ? '<span class="followup-dot" title="Followup pendente"></span>' : '';
  const produto = l.msgs_resumo ? prodBadge(l.msgs_resumo.produto) : '';
  const reviewScore = l.msgs_resumo?.score ? `<span class="text-xs ${l.msgs_resumo.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}">\u2605${l.msgs_resumo.score}</span>` : '';
  return `
    <div class="lead-card p-3" data-username="${l.username}">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-semibold text-sm text-slate-200">@${l.username}</span>
            ${fp}
          </div>
          <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span class="badge ${pBadge}">${l.prioridade}</span>
            ${produto}
            ${reviewScore}
          </div>
        </div>
        <div class="score-ring ${scoreClass(sc)} flex-shrink-0">${sc}</div>
      </div>
      <div class="flex items-center justify-between mt-2 text-xs text-slate-600">
        <span>${l.nicho || '-'}</span>
        <span>\ud83d\udd52 ${dias}</span>
      </div>
    </div>
  `;
}

// --- CHART ---
function renderChart() {
  const sorted = [...allLeads].sort((a,b) => (b.score||0) - (a.score||0)).slice(0, 15);
  const labels = sorted.map(l => '@' + l.username);
  const scores = sorted.map(l => l.score || 0);
  const colors = sorted.map(l => l.prioridade === 'hot' ? 'rgba(239,68,68,.7)' : l.prioridade === 'warm' ? 'rgba(245,158,11,.7)' : 'rgba(99,102,241,.7)');
  const ctx = document.getElementById('scoreChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: scores, backgroundColor: colors, borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` Score: ${c.raw}/100` } } },
      scales: {
        x: { ticks: { color: '#4b5563', font: { size: 10 } }, grid: { color: '#1e1e38' } },
        y: { max: 100, ticks: { color: '#4b5563', font: { size: 10 } }, grid: { color: '#1e1e38' } }
      }
    }
  });
}

// --- FOLLOWUPS ---
function renderFollowups() {
  const pending = allLeads.filter(l => l.followup_pendente);
  const el = document.getElementById('followup-list');
  if (pending.length === 0) {
    el.innerHTML = '<p class="text-xs text-slate-600 py-4 text-center">\u2705 Nenhum followup pendente</p>';
    return;
  }
  el.innerHTML = pending.map(l => `
    <div class="lead-card p-3 cursor-pointer" data-username="${l.username}" onclick="openModal('${l.username}')">
      <div class="flex items-center justify-between">
        <span class="font-semibold text-sm">@${l.username}</span>
        <span class="badge ${l.prioridade === 'hot' ? 'badge-hot' : 'badge-warm'}">${l.prioridade}</span>
      </div>
      <p class="text-xs text-slate-600 mt-1">${l.followups_enviados || 0} followups enviados</p>
    </div>
  `).join('');
}

// --- MODAL ---
function openModal(username) {
  currentModal = username;
  const l = allLeads.find(x => x.username === username);
  if (!l) return;
  document.getElementById('modal-title').textContent = '@' + l.username;
  document.getElementById('modal-sub').textContent = `${l.nicho || '-'} · ${l.tipo_negocio || '-'} · Score ${l.score || 0}/100`;
  document.getElementById('modal-status').value = l.status || 'novo';

  const a = l.analise || {};
  const ap = a.analise_posts || {};
  const msgs = l.msgs_resumo;
  const rev = l.mensagens?.revisao;

  const sections = [
    `<div class="grid grid-cols-2 gap-3">
      <div class="bg-[#0a0a18] rounded-10 p-3 border border-[#1a1a30]">
        <p class="text-xs text-slate-500 mb-1">Problema Principal</p>
        <p class="text-sm">${a.problema_principal || '-'}</p>
      </div>
      <div class="bg-[#0a0a18] rounded-10 p-3 border border-[#1a1a30]">
        <p class="text-xs text-slate-500 mb-1">Motivo do Produto</p>
        <p class="text-sm">${a.motivo_produto || '-'}</p>
      </div>
    </div>`,

    ap.tem_posts_analisados ? `<div class="bg-[#0a0a18] rounded-10 p-3 border border-indigo-500/20">
      <p class="text-xs text-indigo-400 font-semibold mb-2">📊 Posts Analisados</p>
      ${ap.gancho_ideal ? `<p class="text-xs text-slate-400 mb-1"><span class="text-amber-400">✨ Gancho:</span> ${ap.gancho_ideal}</p>` : ''}
      ${ap.dores_identificadas?.length ? `<p class="text-xs text-slate-500">Dores: ${ap.dores_identificadas.join(' · ')}</p>` : ''}
      ${ap.ferramentas_mencionadas?.length ? `<p class="text-xs text-slate-500">Ferramentas: ${ap.ferramentas_mencionadas.join(', ')}</p>` : ''}
    </div>` : '',

    `<div>
      <p class="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Historico</p>
      <div class="space-y-1 max-h-32 overflow-y-auto">
        ${(l.historico || []).slice(-5).reverse().map(h => `
          <div class="flex items-start gap-2 text-xs">
            <span class="text-slate-600 shrink-0">${new Date(h.timestamp).toLocaleDateString('pt-BR')}</span>
            <span class="text-slate-400">${h.dados || h.evento}</span>
          </div>`).join('') || '<p class="text-xs text-slate-700">Sem historico</p>'}
      </div>
    </div>`,

    l.notas?.length ? `<div>
      <p class="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Notas</p>
      <div class="space-y-1">${l.notas.map(n => `<p class="text-xs text-slate-400 bg-[#0a0a18] p-2 rounded">${n.texto}</p>`).join('')}</div>
    </div>` : '',

    `<div>
      <p class="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">Adicionar Nota</p>
      <div class="flex gap-2">
        <input id="modal-nota" type="text" placeholder="Ex: Respondeu positivamente..." class="flex-1 bg-[#0a0a18] border border-[#1a1a30] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-700">
      </div>
    </div>`
  ].filter(Boolean).join('');

  document.getElementById('modal-body').innerHTML = sections;
  document.getElementById('modal').classList.remove('hidden');

  document.getElementById('modal-save').onclick = async () => {
    const status = document.getElementById('modal-status').value;
    const nota   = document.getElementById('modal-nota')?.value?.trim() || '';
    await fetch('/api/status', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username, status, nota: nota || undefined }) });
    closeModal();
    await fetchData();
  };
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  currentModal = null;
}

document.getElementById('modal').addEventListener('click', e => { if (e.target === document.getElementById('modal')) closeModal(); });

// --- FILTER TABS ---
document.getElementById('filter-tabs').addEventListener('click', e => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = btn.dataset.filter;
  renderKanban();
  renderFollowups();
});

// --- COUNTDOWN ---
setInterval(() => {
  countdownVal--;
  if (countdownVal <= 0) { countdownVal = 30; fetchData(); }
  document.getElementById('countdown').textContent = countdownVal;
}, 1000);

// INIT
fetchData();
</script>
</body></html>`;
}
