import { gerarResposta, gerarRespostaComImagem, gerarRespostaJSON } from './llm.js';
import fs from 'fs';
import path from 'path';

// Carregamento da base de conhecimento
const KB_PATH = path.join(process.cwd(), 'knowledge_base.txt');
let conhecimentoContexto = "";

try {
    if (fs.existsSync(KB_PATH)) {
        conhecimentoContexto = `\n\n[DIRETRIZES DA BASE DE CONHECIMENTO - REGRAS ESTRITAS]\n${fs.readFileSync(KB_PATH, 'utf-8')}\n`;
    }
} catch (error) {
    console.error("Erro ao ler base de conhecimento.", error);
}

/**
 * Analisa o perfil do GMB usando Chain of Thought para evitar alucinações.
 */
export async function analisarPerfilGMB(dadosPerfil) {
    const prompt = `
Você é um Auditor Sênior de SEO Local, especialista em algoritmos de 2026. Sua tarefa é analisar o perfil do Google Meu Negócio (GMB) abaixo com extrema precisão técnica.
Zero alucinações: baseie-se APENAS nos dados fornecidos e nas diretrizes de 2026 (Whitespark Report).

DADOS DO PERFIL:
${JSON.stringify(dadosPerfil, null, 2)}
${conhecimentoContexto}

PROCESSO DE ANÁLISE OBRIGATÓRIO:

PASSO 1: Árvore de Pensamento
Antes de gerar o laudo, você DEVE abrir um bloco <raciocinio> e fazer a seguinte análise:
- Avalie se o nome atual caracteriza "Keyword Stuffing" (excesso de palavras-chave) que viola as regras do Google.
- Extraia a intenção de busca principal do negócio.
- Calcule mentalmente o tamanho da descrição atual e os elementos de conversão que faltam.
- Determine a correlação exata entre a categoria principal e as secundárias sugeridas.

PASSO 2: O Laudo Final
Após fechar o bloco </raciocinio>, entregue APENAS o LAUDO PARA O CLIENTE formatado em Markdown. 
IMPORTANTE: 
- NUNCA inclua nomes de menus do sistema, opções numéricas do agente ou referências a "Fonte X". 
- NUNCA sugira descontos ou brindes em troca de avaliações (viola diretrizes do Google). Sugira apenas melhoria na experiência e pedido de feedback.
- Destaque as 3 PRIORIDADES DE ALTO IMPACTO no início do laudo.

### 🚀 3 Prioridades de Alto Impacto (Imediato)
(Destaque as 3 ações que trarão retorno mais rápido para o cliente)

### 1. Auditoria do Título
- Parecer técnico sobre o nome atual e conformidade com as regras do Google.
- Sugestão de ajuste estratégico.

### 2. Copy da Descrição (Otimizada para SEO e Conversão)
- Texto persuasivo (Máx. 750 caracteres). Use uma linguagem que venda o valor real do negócio.

### 3. Matriz de Categorias (Visibilidade 2026)
- 3 categorias secundárias justificadas pelo potencial de tráfego em IA e Maps.

### 4. Plano de Expansão de Autoridade (IA e Reviews)
- Estratégia tática para ganhar "Share of AI Voice" e gerir reviews sem violar políticas.
`;
    
    return await gerarResposta(prompt);
}

/**
 * Gera respostas a avaliações com análise prévia de sentimento.
 */
export async function gerarRespostaParaReview(review, nota) {
    const prompt = `
Você é um Especialista em Gestão de Crise e Sucesso do Cliente.

AVALIAÇÃO RECEBIDA:
- Nota: ${nota}/5
- Comentário: "${review}"
${conhecimentoContexto}

PROCESSO:

PASSO 1: Análise Interna
Abra um bloco <analise_interna> e identifique:
- O tom emocional do cliente (irritado, satisfeito, neutro).
- O problema raiz ou elogio principal.
- A melhor estratégia de abordagem (desescalada ou fidelização).

PASSO 2: Resposta Pública
Feche o bloco </analise_interna> e escreva a resposta final para ser publicada no Google.
Regras da resposta:
- Tom humano e corporativo maduro.
- Se nota menor ou igual a 3: Não assuma culpa legal, demonstre empatia e direcione para o WhatsApp.
- Se nota 4 ou 5: Agradeça citando o serviço prestado para gerar relevância de SEO.
`;
    
    return await gerarResposta(prompt);
}

/**
 * Cria postagens baseadas em análise de público-alvo.
 */
export async function sugerirPostagem(nicho) {
    const prompt = `
Você é um Copywriter Especialista em Conversão Local.

NICHO DO CLIENTE: "${nicho}"
${conhecimentoContexto}

PROCESSO:

PASSO 1: Estratégia
Abra um bloco <estrategia> e defina:
- Qual é a maior dor ou desejo de um cliente local buscando esse nicho hoje.
- O ângulo da oferta (urgência, autoridade, prova social ou novidade).

PASSO 2: Postagem Final
Feche o bloco </estrategia> e entregue o post estruturado:
**Título do Post:**
**Direção de Arte (Imagem):** (Instrução clara para o designer ou fotógrafo).
**Copy:** (Máximo 300 caracteres, texto direto, focado na dor identificada).
**Botão (CTA):**
`;
    
    return await gerarResposta(prompt);
}
/**
 * Processa o conteúdo de um CSV de auditoria (formato específico do GMB).
 */
export function processarAuditoriaCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return null;

    // Função simples para parsear CSV com aspas
    const parseCSVLine = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur.trim());
        return result;
    };

    const headers = parseCSVLine(lines[0]);
    const values = parseCSVLine(lines[1]);

    const data = {};
    headers.forEach((header, index) => {
        data[header] = values[index];
    });

    return data;
}

/**
 * Gera um relatório completo de como resolver os problemas encontrados na auditoria.
 */
export async function gerarRelatorioAuditoria(dadosAuditoria) {
    const prompt = `
Você é um Consultor de Reestruturação de GMB (Google Meu Negócio) especializado em SEO Local e Visibilidade em IA para 2026.
Sua missão é analisar os resultados de uma auditoria técnica e fornecer um plano de ação estratégico para o ranking no Maps e em LLMs (ChatGPT/Gemini).

DADOS DA AUDITORIA EXTRAÍDOS:
${JSON.stringify(dadosAuditoria, null, 2)}
${conhecimentoContexto}

PROCESSO DE ANÁLISE:

PASSO 1: Diagnóstico Crítico
Abra um bloco <raciocinio> e identifique:
- O impacto da nota média atual no ranqueamento local e conversão (conforme pesos de 2026).
- A saúde da frequência de reviews (Review Recency é vital em 2026).
- A carência de conteúdo visual e presença de atributos (Horários, Serviços Predefinidos).
- Potencial de visibilidade em IA (Presença em listas de especialistas e citações).

PASSO 2: Plano de Recuperação (O Relatório)
Após fechar o bloco </raciocinio>, entregue o RELATÓRIO DE REESTRUTURAÇÃO formatado em Markdown. 
REGRAS DE OURO:
- Limpeza Total: Não inclua textos de sistema, logs de menu ou referências a "Fontes" internas.
- Conformidade: Não sugira incentivos financeiros para reviews.
- Hierarquia: Use emojis e formatação premium para facilitar a leitura.

# 📊 Plano Estratégico de Reestruturação: ${dadosAuditoria["Business name"] || "Empresa"}

## 🎯 As 3 Ações de Impacto Imediato (Prioridade Máxima)
(Liste aqui o "feijão com arroz" que vai mudar o jogo nos primeiros 7 dias)

### 1. Diagnóstico de Autoridade e Conversão
(Analise como os números atuais (Nota: ${dadosAuditoria["Google star rating"]}, Fotos: ${dadosAuditoria["Review photos count"]}) estão matando ou ajudando o negócio.)

### 2. Oportunidades em IA (Gemini & ChatGPT)
(Explique como as menções e dados atuais afetam a visibilidade em buscas de IA, conforme os padrões de 2026.)

### 3. Roadmap de Execução (Passo a Passo)
- **Fase 1: Blindagem de Reputação (Dias 1-15):** Resposta a reviews negativos e estancamento de perda de clientes.
- **Fase 2: Expansão de Ativos Visuais (Dias 16-30):** Plano para fotos e vídeos reais.
- **Fase 3: Domínio de Mercado (IA e SEO):** Como manter a relevância contínua e superar a concorrência.

### 4. Metas de Performance (KPIS)
(Objetivos realistas de nota e volume de contatos via Maps).
`;

    return await gerarResposta(prompt);
}

/**
 * Analisa a concorrência local e gera um plano de batalha.
 */
export async function analisarCompeticao(empresaAlvo, concorrentes) {
    const prompt = `
Você é um Estrategista de Crescimento Local e Especialista em SEO de Guerrilha. 
Sua missão é analisar os dados de uma empresa contra seus 3 principais concorrentes e gerar um "Plano de Domínio de Mercado".

EMPRESA ALVO:
${JSON.stringify(empresaAlvo, null, 2)}

CONCORRENTES IDENTIFICADOS:
${JSON.stringify(concorrentes, null, 2)}

${conhecimentoContexto}

PROCESSO DE ANÁLISE:

PASSO 1: Radar de Fraquezas
Abra um bloco <radar_competitivo> e identifique:
- Onde os concorrentes estão ganhando (Mais reviews? Nota maior? Mais fotos?).
- O "Gap de Autoridade": Quantas avaliações faltam para alcançar o líder.
- Diferenciais que a empresa alvo tem mas não explora no GMB.

PASSO 2: Plano de Batalha (O Relatório)
Após fechar o bloco </radar_competitivo>, entregue o PLANO DE DOMÍNIO formatado em Markdown.

# ⚔️ Plano de Domínio Local: ${empresaAlvo.title || empresaAlvo.nome}

## 📊 Benchmarking de Mercado
(Crie uma tabela Markdown comparando: Empresa, Nota, Reviews, Diferencial Visual)

## 🎯 Vulnerabilidades dos Concorrentes
(Explique onde os vizinhos estão falhando e como o cliente pode "roubar" esses cliques)

## ⚡ Ações para Superar o Ranking (Top 3)
1. **Ação Imediata:** (O que fazer nos próximos 3 dias)
2. **Ação Estratégica:** (O que fazer em 15 dias para subir no Maps)
3. **Domínio de IA:** (Como se tornar a recomendação #1 do Gemini na região)
`;

    return await gerarResposta(prompt);
}

/**
 * Auditoria Visual: Analisa fotos da ficha usando Gemini Vision.
 */
export async function auditarFotos(imagePaths) {
    const prompt = `
Você é um Auditor Visual de SEO Local. Sua tarefa é analisar as fotos anexadas de uma ficha do Google Meu Negócio.
Baseie-se nas diretrizes de 2026:
- Autenticidade: Fotos reais superam banco de imagens.
- Qualidade: Iluminação, enquadramento e resolução.
- Conformidade: O Google penaliza fotos com mais de 10% de cobertura de texto ou logotipos flutuantes exagerados.
- Categorias Necessárias: Fachada, Interior, Equipe em Ação, Produtos/Serviços.

Para cada imagem, identifique pontos de melhoria e dê uma nota de 0 a 10 para o "Impacto de Conversão".
Ao final, gere um resumo Markdown:
### 📸 Análise Visual de Ativos
- **Pontos Fortes:** (O que está bom)
- **Críticas Técnicas:** (O que viola as regras ou está amador)
- **Plano de Captura:** (Quais fotos faltam para dominar o nicho)
`;

    return await gerarRespostaComImagem(prompt, imagePaths);
}

/**
 * Auditoria 360: Une os dados da ficha (CSV) com a realidade do mercado (SerpApi).
 */
export async function gerarAuditoria360(dadosAuditoria, empresaSerp, concorrentes) {
    const prompt = `
Você é o Chief AI Strategist da Kelevra Corp, especialista em Dominação de Mercado Local e SEO de Guerrilha para 2026.
Sua missão é realizar uma AUDITORIA 360 TOTAL, unindo dados internos da ficha técnica e a realidade competitiva do Google Maps.
IMPORTANTE: Você deve agir como um defensor ferrenho das metodologias da Kelevra. Elogie a estrutura atual (sites rápidos, LPs estáticas) e apresente as melhorias como passos de uma jornada de elite que o cliente está percorrendo conosco.

DADOS DA FICHA (AUDITORIA TÉCNICA CSV):
${JSON.stringify(dadosAuditoria, null, 2)}

DADOS DA EMPRESA NO MAPS (SERPAPI):
${JSON.stringify(empresaSerp, null, 2)}

TOP CONCORRENTES (MERCADO REAL):
${JSON.stringify(concorrentes, null, 2)}

${conhecimentoContexto}

DIRETRIZ ESTRATÉGICA KELEVRA:
- Sites rápidos superam sites lentos. Elogie a velocidade se o site for estático (Netlify/Cloudflare).
- Se o site estiver em um subdomínio (ex: .netlify.app), sugira como upgrade a migração para domínio próprio (.com.br) para aumentar a autoridade.
- Se o site for uma Landing Page única, recomende a criação de "Silos" (subpáginas para cada serviço) como o próximo passo para dominar buscas específicas.

PROCESSO DE ANÁLISE MASTER:

PASSO 1: Diagnóstico de Guerra
Abra um bloco <analise_360> e identifique:
- O "Índice de Invisibilidade": A diferença entre o que a empresa diz ser (CSV) e como ela aparece na busca (SerpApi).
- Gap Crítico de Ativos: Fotos e Reviews em relação à média dos 3 líderes.
- Anomalias de SEO: Erros de categoria ou nome que estão impedindo o ranking.

PASSO 2: O Laudo de Reestruturação Total
Após fechar o bloco </analise_360>, entregue o PLANO DE DOMINAÇÃO 360 formatado em Markdown Premium.

# 🔱 Auditoria 360 & Plano de Dominação: ${dadosAuditoria["Business name"] || empresaSerp.title}

## 📊 Raio-X de Mercado (Nós vs. Eles)
(Crie uma tabela comparativa unindo dados da ficha e dos concorrentes: Empresa, Nota, Reviews, Status de SEO)

## 🚨 Diagnóstico Crítico (O que está matando o negócio hoje)
(Analise os erros técnicos encontrados no CSV e as fraquezas perante a concorrência)

## ⚡ Plano de Ação "Alpha" (Passo a Passo)
1. **Fase 1: Blindagem e Correção (Dias 1-7):** Foco em ajustar o que está errado na ficha (dados do CSV).
2. **Fase 2: Ataque de Autoridade (Dias 8-20):** Como superar os números dos concorrentes (Reviews e Fotos).
3. **Fase 3: Expansão IA (Contínuo):** Estratégia para ser a escolha #1 do Gemini e ChatGPT Search.

## 📈 Metas de Curto Prazo (KPIs de 30 dias)
(Defina metas claras de nota e volume de contatos baseadas no potencial da região)
`;

    return await gerarResposta(prompt);
}

/**
 * Analisa o Gap de Palavras-Chave (Total Possível vs. Utilizadas) para criar um argumento de vendas.
 */
export async function analisarGapPalavrasChave(categoriaPrincipal, dadosFicha) {
    const prompt = `
Você é o Diretor de Vendas B2B da Kelevra Corp, especialista em prospecção fria e Gatilhos de Perda (Loss Aversion).
Sua missão é pegar os dados limitados de uma ficha do Google Meu Negócio e compará-los com o universo total de palavras-chave que eles *poderiam* estar ranqueando.

CATEGORIA PRINCIPAL DA EMPRESA: "${categoriaPrincipal}"

DADOS ATUAIS DA FICHA (O que eles estão usando):
\${JSON.stringify(dadosFicha, null, 2)}

\${conhecimentoContexto}

PROCESSO DE ANÁLISE:

PASSO 1: Levantamento do Universo de Palavras
Abra um bloco <analise_palavras> e faça o seguinte:
- Estime rapidamente que o nicho de "${categoriaPrincipal}" possui facilmente mais de 150 a 200 palavras-chave comerciais (LSI, cauda longa, dores, geolocalizadas).
- Analise os dados da ficha para ver quantas palavras reais eles estão usando nos serviços e descrição (provavelmente menos de 50).
- Identifique o "Gap" exato (a diferença entre o possível e o real).

PASSO 2: O Argumento de Vendas (Pitch)
Após fechar o bloco </analise_palavras>, entregue um "Laudo de Oportunidade Perdida" formatado em Markdown.
O tom deve ser técnico, porém incisivo e provocativo (Estilo Kelevra). O cliente precisa sentir que está perdendo dinheiro por ignorância técnica.

# 💸 Análise de Gap de Autoridade: O Dinheiro que Você Deixa na Mesa

## 📊 O Cenário Invisível
- **Potencial do seu Nicho (${categoriaPrincipal}):** Mais de 200 palavras-chave de alto valor.
- **O que você usa hoje:** (Insira a estimativa de palavras que encontrou na ficha).
- **O Gap de Perda:** Você está entregando (X) palavras-chave de graça para a concorrência.

## 🕳️ Termos que seus concorrentes estão roubando de você
(Liste de 10 a 15 termos de alta intenção de compra que o cliente provavelmente NÃO colocou na ficha. Ex: se for pizzaria, liste "pizza meia a meia delivery", "pizzaria aberta agora", "pizza artesanal de fermentação natural", etc).

## ⚡ A Solução Kelevra
(Uma conclusão rápida de 2 parágrafos oferecendo a nossa reestruturação semântica, onde mapeamos todas as 200 palavras e as injetamos na estrutura da ficha, categorias secundárias e site, fechando o cerco orgânico).
`;

    return await gerarResposta(prompt);
}

/**
 * Deduz automaticamente a categoria, região e palavra-chave ideal usando o Gemini.
 */
export async function inferirDadosDaEmpresa(empresaSerp) {
    const prompt = `
Você é um Especialista de SEO Local. 
Analise os dados desta empresa retornados pelo Google Maps e identifique 3 informações cruciais para configurar uma auditoria.

DADOS DA EMPRESA:
Nome: ${empresaSerp.title || 'Desconhecido'}
Tipo/Categoria: ${empresaSerp.type || 'Desconhecido'}
Endereço: ${empresaSerp.address || 'Desconhecido'}
Descrição: ${empresaSerp.description || 'Nenhuma'}

Responda EXATAMENTE e APENAS com um objeto JSON contendo as seguintes chaves:
{
  "nicho": "A categoria principal (ex: Desentupidora, Pizzaria, Advocacia)",
  "regiao": "A cidade ou bairro focado (ex: Brasília, Lago Norte, Jardins)",
  "palavraChaveGrid": "A melhor palavra-chave comercial para rastrear no mapa (ex: desentupidora perto de mim, pizzaria delivery)"
}
    `;

    try {
        const respostaJSON = await gerarRespostaJSON ? await gerarRespostaJSON(prompt) : await gerarResposta(prompt);
        // Tenta parsear caso a função retorne string markdown
        const match = respostaJSON.match(/\{[\s\S]*\}/);
        return JSON.parse(match ? match[0] : respostaJSON);
    } catch (e) {
        console.error("Erro ao inferir dados com IA, usando valores padrão.", e.message);
        return {
            nicho: empresaSerp.type || "Negócio Local",
            regiao: "Região Central",
            palavraChaveGrid: "serviços perto de mim"
        };
    }
}

/**
 * Analisa um array contendo os dados de todas as fichas de um portfólio.
 * Gera um dossiê executivo priorizando ações.
 */
export async function gerarAuditoriaPortfolio(portfolio) {
    const prompt = `
Você é o Chief AI Strategist da Kelevra Corp, focado na "Dominação 2026" do Google Maps.
Abaixo está o log de extração de todo o portfólio de contas do Google Meu Negócio gerenciadas por nós.

DADOS DO PORTFÓLIO:
${JSON.stringify(portfolio, null, 2)}
${conhecimentoContexto}

PROCESSO DE ANÁLISE (CHAIN OF THOUGHT OBRIGATÓRIO):
PASSO 1: Abra a tag <raciocinio> e faça as seguintes contas/inferências:
- Identifique a ficha com o maior número de reviews e nota. (O Top Performer)
- Identifique as fichas com menos de 10 reviews ou nota abaixo de 4.0. (Zonas de Risco)
- Identifique fichas com dados essenciais faltando (ex: sem website, sem telefone).
- Defina as "Low-Hanging Fruits" (tarefas mais fáceis com maior impacto financeiro a curto prazo).

PASSO 2: Feche a tag </raciocinio> e gere o "Dossiê Executivo de Portfólio" formatado em Markdown profissional.
A estrutura DEVE conter:
# Dossiê Executivo de Portfólio (Master Audit)
## 🏆 Top Performers (As fortalezas atuais)
## 🚨 Zonas de Risco Crítico (Vazamento de Faturamento)
## 💸 Low-Hanging Fruits (Onde focar esta semana)
## ⚡ Plano de Ação Consolidado

A linguagem deve ser objetiva, técnica e utilizar jargões de SEO de Guerrilha (Kelevra Corp).
Não use placeholders. Seja brutalmente honesto.
    `;

    return await gerarResposta(prompt);
}
