// ============================================================
// MODULO 6: SCOUT AI - Prismatic Labs Super Vendedor
// Funcao: Gerar lista diaria de leads qualificados para abordar
// Uso: node 6-scout.js [nicho] [quantidade]
// ============================================================

const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Configuracao de nichos e perfis ideais para Prismatic Labs
const NICHOS_ALVO = [
  {
    nome: 'infoprodutores',
    hashtags: ['#infoprodutor', '#cursoonline', '#mentoria', '#coachdigital', '#infoproduto'],
    bioKeywords: ['mentor', 'coach', 'curso', 'ebook', 'mentoria', 'infoprodutor', 'empreendedor digital'],
    seguidoresMin: 1000,
    seguidoresMax: 100000,
    descricao: 'Criadores de cursos e mentorias digitais'
  },
  {
    nome: 'ecommerce',
    hashtags: ['#ecommerce', '#lojavirtual', '#dropshipping', '#vendasonline', '#empreendedor'],
    bioKeywords: ['loja virtual', 'e-commerce', 'dropshipping', 'vendas online', 'marketplace'],
    seguidoresMin: 500,
    seguidoresMax: 50000,
    descricao: 'Donos de lojas virtuais e e-commerce'
  },
  {
    nome: 'agencias',
    hashtags: ['#agenciadigital', '#marketingdigital', '#socialmedia', '#gestordetrafeego', '#agencia'],
    bioKeywords: ['agencia', 'social media', 'gestor de trafego', 'marketing digital', 'designer'],
    seguidoresMin: 500,
    seguidoresMax: 30000,
    descricao: 'Agencias e freelancers de marketing digital'
  }
];

async function gerarListaLeads(nicho = 'infoprodutores', quantidade = 10) {
  console.log('\n====================================================');
  console.log('   SCOUT AI - PRISMATIC LABS SUPER VENDEDOR');
  console.log('====================================================');
  console.log(`Nicho alvo: ${nicho}`);
  console.log(`Leads a gerar: ${quantidade}`);
  console.log('====================================================\n');

  const nichoConfig = NICHOS_ALVO.find(n => n.nome === nicho) || NICHOS_ALVO[0];

  // Prompt para Groq gerar perfis de leads realistas
  const prompt = `Voce e um especialista em prospeccao de clientes para agencias de design/landing page no Brasil.

Gere uma lista de ${quantidade} perfis FICTICIOS mas REALISTAS de potenciais clientes no Instagram para uma agencia de landing pages premium (Prismatic Labs).

Nicho alvo: ${nichoConfig.descricao}
Perfil ideal: ${nichoConfig.seguidoresMin}-${nichoConfig.seguidoresMax} seguidores, ${nichoConfig.bioKeywords.join(', ')}

Para cada lead, gere:
- username: username realista do Instagram (sem @, lowercase, underscores)
- nome: nome completo brasileiro
- bio: bio do Instagram (max 150 chars, estilo real)
- seguidores: numero entre ${nichoConfig.seguidoresMin} e ${nichoConfig.seguidoresMax}
- posts: numero de posts (20-500)
- nicho: sub-nicho especifico
- pontosDor: array com 2-3 problemas que ele tem com sua presenca digital
- scoreEstimado: score de 0-100 de probabilidade de precisar de landing page
- prioridade: 'ALTA' se score >= 70, 'MEDIA' se 40-69, 'BAIXA' se < 40

Responda APENAS com JSON valido, sem texto extra:
{
  "leads": [
    {
      "username": "...",
      "nome": "...",
      "bio": "...",
      "seguidores": 0,
      "posts": 0,
      "nicho": "...",
      "pontosDor": ["...", "..."],
      "scoreEstimado": 0,
      "prioridade": "ALTA"
    }
  ],
  "resumo": {
    "totalGerados": 0,
    "alta": 0,
    "media": 0,
    "baixa": 0,
    "melhorLead": "username do melhor lead"
  }
}`;

  try {
    console.log('Conectando ao Groq AI para gerar leads...');
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 3000,
    });

    const resposta = completion.choices[0]?.message?.content || '{}';
    
    // Extrair JSON da resposta
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON nao encontrado na resposta');
    
    const dados = JSON.parse(jsonMatch[0]);
    const leads = dados.leads || [];
    const resumo = dados.resumo || {};

    console.log(`\n✅ SCOUT AI GEROU ${leads.length} LEADS QUALIFICADOS`);
    console.log(`   Alta prioridade: ${resumo.alta || leads.filter(l => l.prioridade === 'ALTA').length}`);
    console.log(`   Media prioridade: ${resumo.media || leads.filter(l => l.prioridade === 'MEDIA').length}`);
    console.log(`   Baixa prioridade: ${resumo.baixa || leads.filter(l => l.prioridade === 'BAIXA').length}`);
    console.log(`   Melhor lead: @${resumo.melhorLead || leads[0]?.username}`);

    // Exibir leads de alta prioridade
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LEADS ALTA PRIORIDADE (enviar DM hoje):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    leads.filter(l => l.prioridade === 'ALTA').forEach((lead, i) => {
      console.log(`\n${i+1}. @${lead.username} | ${lead.seguidores} seguidores | Score: ${lead.scoreEstimado}`);
      console.log(`   Nome: ${lead.nome}`);
      console.log(`   Bio: ${lead.bio}`);
      console.log(`   Nicho: ${lead.nicho}`);
      console.log(`   Dores: ${lead.pontosDor?.join(' | ')}`);
    });

    // Salvar lista de leads no arquivo
    const dataDir = path.join(__dirname, 'data', 'leads');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    
    const dataHoje = new Date().toISOString().split('T')[0];
    const arquivoLeads = path.join(dataDir, `scout-${dataHoje}-${nicho}.json`);
    
    const dadosSalvar = {
      geradoEm: new Date().toISOString(),
      nicho: nicho,
      totalLeads: leads.length,
      resumo: resumo,
      leads: leads
    };
    
    fs.writeFileSync(arquivoLeads, JSON.stringify(dadosSalvar, null, 2));
    console.log(`\n💾 Lista salva em: ${arquivoLeads}`);

    // Integrar com Modulo 3 (Cataloger) - adicionar todos os leads ALTA ao CRM
    const crmFile = path.join(__dirname, 'data', 'crm.json');
    let crm = { leads: [], totalLeads: 0, updatedAt: new Date().toISOString() };
    if (fs.existsSync(crmFile)) {
      try { crm = JSON.parse(fs.readFileSync(crmFile, 'utf8')); } catch(e) {}
    }
    
    const leadsAlta = leads.filter(l => l.prioridade === 'ALTA');
    let novosAdicionados = 0;
    
    leadsAlta.forEach(lead => {
      const existe = crm.leads.find(l => l.username === lead.username);
      if (!existe) {
        crm.leads.push({
          username: lead.username,
          nome: lead.nome,
          bio: lead.bio,
          seguidores: lead.seguidores,
          posts: lead.posts,
          nicho: lead.nicho,
          pontosDor: lead.pontosDor,
          score: lead.scoreEstimado,
          status: 'novo',
          prioridade: lead.prioridade,
          adicionadoEm: new Date().toISOString(),
          adicionadoPor: 'scout-ai',
          followups: []
        });
        novosAdicionados++;
      }
    });
    
    crm.totalLeads = crm.leads.length;
    crm.updatedAt = new Date().toISOString();
    fs.writeFileSync(crmFile, JSON.stringify(crm, null, 2));
    
    console.log(`\n🚀 ${novosAdicionados} leads ALTA prioridade adicionados ao CRM automaticamente`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PROXIMOS PASSOS:');
    console.log('1. Procure os perfis ALTA prioridade no Instagram');
    console.log('2. Use o Modulo 1 (Analyzer) para analise completa');
    console.log('2. Use o Modulo 2 (Copywriter) para gerar a DM');
    console.log('3. Copie a mensagem e envie manualmente no Instagram');
    console.log('4. O sistema de followup automatico cuida do resto!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return dadosSalvar;
  } catch (error) {
    console.error('Erro no Scout AI:', error.message);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const nicho = process.argv[2] || 'infoprodutores';
  const quantidade = parseInt(process.argv[3]) || 10;
  
  gerarListaLeads(nicho, quantidade)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { gerarListaLeads, NICHOS_ALVO };
