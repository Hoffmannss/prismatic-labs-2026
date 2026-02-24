// =============================================================
// MODULO 1: ANALYZER AI - PRISMATIC LABS VENDEDOR AUTOMATICO
// Analisa perfil Instagram do lead e gera relatorio completo
// Stack: Groq API (Llama 3.3 70B) - GRATIS
// =============================================================

const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ---- DADOS DO LEAD (passados por argumento ou variavel de ambiente) ----
const username = process.argv[2] || process.env.LEAD_USERNAME || 'exemplo_lead';
const bioText = process.argv[3] || process.env.LEAD_BIO || '';
const followersCount = process.argv[4] || process.env.LEAD_FOLLOWERS || '0';
const postsCount = process.argv[5] || process.env.LEAD_POSTS || '0';
const recentPostsDesc = process.argv[6] || process.env.LEAD_POSTS_DESC || '';

async function analyzeProfile() {
  console.log(`\n[ANALYZER] Iniciando analise do perfil: @${username}`);
  console.log(`[ANALYZER] Seguidores: ${followersCount} | Posts: ${postsCount}`);

  const prompt = `Voce e o SUPER VENDEDOR da Prismatic Labs, uma agencia premium de landing pages e marketing digital.

ANALISE ESTE PERFIL INSTAGRAM:
- Username: @${username}
- Bio: ${bioText || 'Nao disponivel'}
- Seguidores: ${followersCount}
- Posts: ${postsCount}
- Descricao dos ultimos posts: ${recentPostsDesc || 'Nao disponivel'}

Gere um RELATORIO COMPLETO em JSON com:
{
  "score_potencial": (0-100, chance de virar cliente),
  "nicho": "qual nicho este lead atua",
  "tipo_negocio": "infoprodutor/ecommerce/agencia/servicos/outro",
  "problema_principal": "qual o maior problema que ele tem que a Prismatic Labs resolve",
  "nivel_consciencia": "nao_sabe/sabe_problema/sabe_solucao/produto_aware/mais_consciente",
  "tamanho_negocio": "micro/pequeno/medio/grande",
  "urgencia_estimada": "baixa/media/alta",
  "angulo_abordagem": "qual angulo emocional usar para abordar",
  "prova_social_relevante": "que tipo de caso de sucesso mostrar para ele",
  "objecoes_previstas": ["lista", "de", "objecoes", "que", "ele", "vai", "ter"],
  "servico_ideal": "qual servico da Prismatic Labs e mais relevante para ele",
  "preco_estimado_aceito": "faixa de preco que ele provavelmente aceita",
  "melhor_horario_contato": "manha/tarde/noite",
  "plataforma_adicional": "tem LinkedIn/YouTube/outro?",
  "insights_extras": "observacoes estrategicas adicionais",
  "prioridade": "hot/warm/cold"
}

RESPONDA APENAS O JSON, SEM TEXTO ADICIONAL.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1024,
    });

    const rawResponse = completion.choices[0].message.content.trim();
    
    // Extrair JSON da resposta
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta nao contem JSON valido');
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // Adicionar metadados
    const result = {
      timestamp: new Date().toISOString(),
      username: username,
      dados_perfil: {
        bio: bioText,
        seguidores: followersCount,
        posts: postsCount
      },
      analise: analysis
    };

    // Salvar resultado
    const outputDir = path.join(__dirname, '..', 'data', 'leads');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const outputFile = path.join(outputDir, `${username}_analysis.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    
    console.log(`\n[ANALYZER] Analise concluida!`);
    console.log(`[ANALYZER] Score de potencial: ${analysis.score_potencial}/100`);
    console.log(`[ANALYZER] Prioridade: ${analysis.prioridade?.toUpperCase()}`);
    console.log(`[ANALYZER] Problema principal: ${analysis.problema_principal}`);
    console.log(`[ANALYZER] Servico ideal: ${analysis.servico_ideal}`);
    console.log(`[ANALYZER] Arquivo salvo: ${outputFile}`);
    
    // Output para o proximo modulo
    process.env.ANALYSIS_RESULT = JSON.stringify(result);
    console.log(`\nANALYSIS_OUTPUT=${JSON.stringify(result)}`);
    
    return result;
    
  } catch (error) {
    console.error('[ANALYZER] Erro:', error.message);
    process.exit(1);
  }
}

analyzeProfile();
