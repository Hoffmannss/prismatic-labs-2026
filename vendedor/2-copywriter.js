// =============================================================
// MODULO 2: COPYWRITER AI - PRISMATIC LABS VENDEDOR AUTOMATICO
// Gera mensagem hiperpersonalizada baseada na analise do lead
// Stack: Groq API (Llama 3.3 70B) - GRATIS
// =============================================================

const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ---- CARREGAR ANALISE DO MODULO 1 ----
const username = process.argv[2] || process.env.LEAD_USERNAME;
const analysisFile = path.join(__dirname, '..', 'data', 'leads', `${username}_analysis.json`);

async function generateMessage() {
  console.log(`\n[COPYWRITER] Gerando mensagem para: @${username}`);

  // Carregar analise
  let analysisData;
  try {
    const raw = fs.readFileSync(analysisFile, 'utf8');
    analysisData = JSON.parse(raw);
  } catch (e) {
    // Usar dados do ambiente se arquivo nao existe
    const envData = process.env.ANALYSIS_OUTPUT;
    if (envData) {
      analysisData = JSON.parse(envData);
    } else {
      console.error('[COPYWRITER] Erro: Analise nao encontrada. Execute o Modulo 1 primeiro.');
      process.exit(1);
    }
  }

  const a = analysisData.analise;

  const prompt = `Voce e o MELHOR COPYWRITER do Brasil especializado em vender servicos de marketing digital.

Voce trabalha para a Prismatic Labs - agencia premium de landing pages e marketing digital para infoprodutores.

SERVICOS DA PRISMATIC LABS:
- Landing Pages Premium (dark mode + neon, alta conversao): R$997 a R$2.497
- Pacote Completo (Landing + Funil + Copy): R$1.997 a R$4.997
- Consultoria de Conversao: R$497
- Social Media + Conteudo: R$797/mes

DADOS DO LEAD:
- Username: @${username}
- Nicho: ${a.nicho}
- Tipo de Negocio: ${a.tipo_negocio}
- Problema Principal: ${a.problema_principal}
- Nivel de Consciencia: ${a.nivel_consciencia}
- Urgencia: ${a.urgencia_estimada}
- Angulo de Abordagem: ${a.angulo_abordagem}
- Servico Ideal: ${a.servico_ideal}
- Objecoes Previstas: ${JSON.stringify(a.objecoes_previstas)}
- Prioridade: ${a.prioridade}

GERE 3 VARIACOES de DM (mensagem direta Instagram) para o PRIMEIRO CONTATO:

Regras ABSOLUTAS:
1. Maximo 4 linhas por mensagem
2. NAO mencionar preco na primeira mensagem
3. NAO parecer automatizado ou generico
4. Comecar com algo ESPECIFICO do perfil dele (nao generico)
5. Terminar com UMA pergunta que gere resposta
6. Tom: amigo que quer ajudar, nao vendedor desesperado
7. Usar o problema principal como gancho
8. Mencionar resultado, nao servico

Retorne JSON:
{
  "mensagem_1": {
    "texto": "texto da mensagem",
    "angulo": "qual angulo esta usando",
    "temperatura": "direta/suave/curiosidade"
  },
  "mensagem_2": {
    "texto": "texto da mensagem",
    "angulo": "qual angulo esta usando",
    "temperatura": "direta/suave/curiosidade"
  },
  "mensagem_3": {
    "texto": "texto da mensagem",
    "angulo": "qual angulo esta usando",
    "temperatura": "direta/suave/curiosidade"
  },
  "mensagem_recomendada": "1, 2 ou 3",
  "motivo_recomendacao": "por que esta e a melhor",
  "followup_dia_3": "mensagem de followup caso nao responda em 3 dias",
  "followup_dia_7": "mensagem de followup caso nao responda em 7 dias",
  "followup_dia_14": "mensagem de followup final com oferta especial"
}

RESPONDA APENAS O JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
    });

    const rawResponse = completion.choices[0].message.content.trim();
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta nao contem JSON valido');
    
    const messages = JSON.parse(jsonMatch[0]);
    
    // Salvar resultado
    const outputDir = path.join(__dirname, '..', 'data', 'mensagens');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const result = {
      timestamp: new Date().toISOString(),
      username: username,
      analise_score: a.score_potencial,
      prioridade: a.prioridade,
      mensagens: messages
    };
    
    const outputFile = path.join(outputDir, `${username}_mensagens.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    
    // Mostrar mensagem recomendada
    const recKey = `mensagem_${messages.mensagem_recomendada}`;
    const recMsg = messages[recKey];
    
    console.log(`\n[COPYWRITER] Mensagens geradas com sucesso!`);
    console.log(`[COPYWRITER] Mensagem recomendada: #${messages.mensagem_recomendada}`);
    console.log(`[COPYWRITER] Motivo: ${messages.motivo_recomendacao}`);
    console.log(`\n========== COPIE E COLE ESTA MENSAGEM ==========`);
    console.log(recMsg?.texto);
    console.log(`================================================\n`);
    console.log(`[COPYWRITER] Arquivo salvo: ${outputFile}`);
    console.log(`\nMESSAGES_OUTPUT=${JSON.stringify(result)}`);
    
    return result;
    
  } catch (error) {
    console.error('[COPYWRITER] Erro:', error.message);
    process.exit(1);
  }
}

generateMessage();
