import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SENHA_ACESSO = process.env.DASHBOARD_PASSWORD || 'kelevra2026';

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// PASSO 5: Capturar qualquer erro async nao tratado para evitar crash do servidor
process.on('unhandledRejection', (reason, promise) => {
    console.error('[AVISO] Promessa nao tratada em:', promise, 'Motivo:', reason);
    // NAO derruba o servidor — apenas loga
});
process.on('uncaughtException', (err) => {
    console.error('[AVISO] Erro nao capturado:', err.message);
    // NAO derruba o servidor — apenas loga
});

// PASSO 2: Importar modulos externos de forma segura (nunca derrubam o servidor)
let executarAuditoriaLote = async () => { throw new Error('Modulo batch_audit nao carregado'); };
let gerarResposta = async () => { throw new Error('Modulo llm nao carregado'); };
let buscarEmpresaNoMaps = async () => [];
let listarContas = async () => [];
let listarLocais = async () => [];

try {
    const batchMod = await import('./batch_audit.js');
    executarAuditoriaLote = batchMod.executarAuditoriaLote;
    console.log('[OK] batch_audit.js carregado.');
} catch(e) {
    console.error('[AVISO] batch_audit.js falhou ao carregar:', e.message);
}

try {
    const llmMod = await import('./llm.js');
    gerarResposta = llmMod.gerarResposta;
    console.log('[OK] llm.js carregado.');
} catch(e) {
    console.error('[AVISO] llm.js falhou ao carregar:', e.message);
}

try {
    const serpMod = await import('./api_serp.js');
    buscarEmpresaNoMaps = serpMod.buscarEmpresaNoMaps;
    console.log('[OK] api_serp.js carregado.');
} catch(e) {
    console.error('[AVISO] api_serp.js falhou ao carregar:', e.message);
}

try {
    const gmbMod = await import('./api_gmb.js');
    listarContas = gmbMod.listarContas;
    listarLocais = gmbMod.listarLocais;
    console.log('[OK] api_gmb.js carregado.');
} catch(e) {
    console.error('[AVISO] api_gmb.js falhou ao carregar (tokens ausentes?):', e.message);
}

// PASSO 4: Rota de healthcheck para o Easypanel
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota Principal - Landing Page Institucional Kelevra Corp
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kelevra Corp | Engenharia de Reputação no Google</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');
            
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                font-family: 'Inter', sans-serif;
                background-color: #0f172a;
                color: #f8fafc;
                line-height: 1.6;
                overflow-x: hidden;
            }
            header {
                padding: 30px 50px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(10px);
                position: fixed;
                width: 100%;
                top: 0;
                z-index: 100;
                border-bottom: 1px solid #1e293b;
            }
            .logo {
                font-weight: 900;
                font-size: 24px;
                letter-spacing: -1px;
                background: linear-gradient(90deg, #38bdf8, #818cf8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .nav-link {
                color: #cbd5e1;
                text-decoration: none;
                font-weight: 600;
                transition: color 0.3s;
            }
            .nav-link:hover { color: #38bdf8; }
            
            .hero {
                height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                padding: 0 20px;
                background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
            }
            .hero h1 {
                font-size: 4rem;
                font-weight: 900;
                line-height: 1.1;
                margin-bottom: 20px;
                max-width: 800px;
            }
            .hero h1 span {
                color: #38bdf8;
            }
            .hero p {
                font-size: 1.25rem;
                color: #94a3b8;
                max-width: 600px;
                margin-bottom: 40px;
            }
            .cta-button {
                background: linear-gradient(135deg, #0284c7, #2563eb);
                color: white;
                padding: 16px 40px;
                border-radius: 50px;
                font-size: 1.1rem;
                font-weight: bold;
                text-decoration: none;
                transition: transform 0.3s, box-shadow 0.3s;
                box-shadow: 0 10px 25px rgba(2, 132, 199, 0.4);
            }
            .cta-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 15px 35px rgba(2, 132, 199, 0.6);
            }

            .features {
                padding: 100px 20px;
                max-width: 1200px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 40px;
            }
            .card {
                background: #1e293b;
                padding: 40px;
                border-radius: 16px;
                border: 1px solid #334155;
                transition: transform 0.3s;
            }
            .card:hover { transform: translateY(-10px); }
            .card h3 { color: #f8fafc; font-size: 1.5rem; margin-bottom: 15px; }
            .card p { color: #94a3b8; font-size: 1rem; }
            .icon { font-size: 40px; margin-bottom: 20px; }

            footer {
                text-align: center;
                padding: 40px;
                border-top: 1px solid #1e293b;
                color: #64748b;
                margin-top: 50px;
            }

            /* Ocultar a rota secreta sem botão exposto na interface */
            .secret-area { position: absolute; bottom: 10px; right: 10px; width: 20px; height: 20px; cursor: default; }
        </style>
    </head>
    <body>
        <header>
            <div class="logo">KELEVRA CORP.</div>
            <a href="mailto:solanoviolao@gmail.com" class="nav-link">Contato Comercial</a>
        </header>

        <section class="hero">
            <h1>Domine o Topo do <span>Google Maps</span> na sua Região.</h1>
            <p>Nossa inteligência artificial audita, otimiza e escala a sua ficha do Google Meu Negócio, gerando clientes em piloto automático através de Engenharia de Reputação.</p>
            <a href="mailto:solanoviolao@gmail.com" class="cta-button">Fale com um Estrategista</a>
        </section>

        <section class="features">
            <div class="card">
                <div class="icon">🛰️</div>
                <h3>Radar Geogrid 360</h3>
                <p>Mapeamos a sua concorrência num raio de 5km quarteirão por quarteirão para saber exatamente onde você perde e onde você ganha clientes.</p>
            </div>
            <div class="card">
                <div class="icon">🧠</div>
                <h3>Inteligência Visual</h3>
                <p>Avaliamos as suas fotos com algoritmos de IA do Google para garantir que elas gerem o maior impacto no algoritmo de ranqueamento local.</p>
            </div>
            <div class="card">
                <div class="icon">⚡</div>
                <h3>Auditoria em Lote</h3>
                <p>Nossa infraestrutura tecnológica (GMB Claw) monitora o seu crescimento mês a mês, blindando o seu faturamento de forma invisível.</p>
            </div>
        </section>

        <footer>
            <p>&copy; 2026 Kelevra Corp. Todos os direitos reservados. | VitaleBrasil</p>
        </footer>
        
        <!-- Clique duplo discreto no rodapé para acessar a área operacional -->
        <div class="secret-area" ondblclick="window.location.href='/app'"></div>
    </body>
    </html>
    `);
});


// Rota Secundária - Painel de Operação CS (Focado no perfil Estável)
app.get('/app', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Prompt da Persona Débora
const DEBORA_PROMPT = `[IDENTIDADE E PROPÓSITO]
Você é a Débora, a Assistente Executiva e Estrategista Operacional de Marketing da Kelevra Corp. 
Seu propósito exclusivo é auxiliar a Head Operacional, Gabriela, na gestão diária da agência focada em Google Meu Negócio (Google Business Profile) e Otimização para Inteligências Artificiais (LLMs).
Sua missão é ser o braço direito da Gabriela, garantindo que os clientes da agência alcancem o topo das pesquisas, enquanto organiza a rotina dela de forma impecável.

[PERFIL DA USUÁRIA (GABRIELA) E SEU TOM DE VOZ]
A Gabriela possui um perfil comportamental Estável/Conforme (DISC). Isso significa que ela valoriza segurança, planejamento, detalhes, métodos e harmonia. Ela está iniciando no mundo empresarial e tecnológico agora.
Portanto, a sua comunicação (Débora) deve ser ESTRITAMENTE:
1. Paciente, acolhedora e encorajadora. Nunca use um tom de cobrança, urgência excessiva ou pressão.
2. Extremamente minuciosa e estruturada. Nunca dê instruções genéricas. Tudo deve ser em formato de "Passo a Passo" enumerado (1, 2, 3...).
3. Didática. Sempre que usar um termo técnico (SEO, LLM, Prompt, Ranking, CTA), você DEVE explicar o que significa de forma simples, usando analogias do dia a dia.

[ESCOPO DE ATUAÇÃO E TAREFAS]
Você deve ajudar a Gabriela nas seguintes frentes:
1. OTIMIZAÇÃO DE GOOGLE MEU NEGÓCIO E SEO LOCAL: Indicar quais palavras-chave usar e como/onde inserir no GMB.
2. OTIMIZAÇÃO PARA LLMs: Orientar formatação para IA.
3. TRADUÇÃO DE PLANOS DE AÇÃO: Fatiar PDFs/textos da diretoria em tarefas lógicas.
4. GESTÃO DE TEMPO (Google Agenda): Criar títulos, datas e descrições exatas para copiar e colar.
5. CRIAÇÃO DE METAS S.M.A.R.T.: Explicar o acrônimo e desenhar as metas.

[GERENCIADOR DE TAREFAS INTEGRADO - EXTREMAMENTE IMPORTANTE]
O sistema possui um aplicativo de "Lista de Tarefas" (To-Do List) da Gabriela. 
SEMPRE que você der um passo a passo para a Gabi e quiser registrar uma ação para ela não esquecer, você DEVE emitir a seguinte tag secreta no meio do seu texto:
<ADD_TASK>Título Curto|Descrição detalhada da ação</ADD_TASK>
Exemplo: Se você disser para ela ligar para o cliente para pedir fotos, adicione no seu texto: <ADD_TASK>Ligar para Cliente XYZ|Pedir pelo menos 5 fotos da fachada bem iluminada e sem texto por cima.</ADD_TASK>.
Pode enviar múltiplas tags <ADD_TASK> na mesma mensagem, se houver várias tarefas!
[REGRAS DE INTERAÇÃO - OBRIGATÓRIO]
- Toda vez que a Gabriela pedir ajuda com um novo cliente ou tarefa, inicie a resposta validando a importância do trabalho dela. Ex: "Excelente iniciativa, Gabi. Vamos organizar isso passo a passo..."
- Se a instrução envolver clicar em botões no Google Meu Negócio, descreva onde o botão fica.
- Se a mensagem da Gabi contiver "Dados do Google Meu Negócio", faça a análise completa e não se esqueça de emitir as tags <ADD_TASK> para as ações necessárias!
- Pergunte sempre ao final: "Ficou claro este passo, Gabi, ou gostaria que eu explicasse algum detalhe tecnológico de outra forma?"
- Use formatação Markdown (negrito, listas) para facilitar a leitura.
`;

// api_gmb ja importado no topo de forma segura

// Endpoint da Débora (Chat e Otimizador)
app.post('/api/debora', async (req, res) => {
    try {
        const { message, history, type } = req.body;
        
        if (!message && (!history || history.length === 0)) {
            return res.status(400).json({ error: "Mensagem vazia." });
        }

        // Puxar dinamicamente os clientes da agência via API GMB
        let contextClientes = "";
        try {
            const contas = await listarContas();
            let lista = [];
            for (const conta of contas) {
                const locais = await listarLocais(conta.name);
                for (const local of locais) {
                    if (local.title) lista.push(local.title);
                }
            }
            if (lista.length > 0) {
                contextClientes = `\n[CONTEXTO ATUAL DA AGÊNCIA]\nNossos clientes ativos atualmente no Google Meu Negócio são: ${lista.join(', ')}.\nSe a Gabriela perguntar sobre nossos clientes, use esta lista.`;
            }
        } catch (err) {
            console.error("Não foi possível puxar os clientes no momento:", err.message);
        }

        const fullPrompt = DEBORA_PROMPT + contextClientes;
        
        // Se for history (chat com memória), envia o array. Se for message (otimizador), envia a string.
        const inputToLLM = type === 'chat' && history ? history : message;
        
        const reply = await gerarResposta(inputToLLM, fullPrompt);
        res.json({ reply });
    } catch (error) {
        console.error("Erro no endpoint da Débora:", error);
        res.status(500).json({ error: "A Débora teve um probleminha técnico para responder." });
    }
});

// Endpoint do Diagnóstico de Invisibilidade (Isca Digital de Vendas)
app.post('/api/invisibilidade', async (req, res) => {
    try {
        const { term, location } = req.body;
        if (!term) {
            return res.status(400).json({ error: "Por favor, digite o nome da empresa ou palavra-chave." });
        }

        console.log(`[Invisibilidade] Executando diagnóstico para: "${term}" em "${location || 'Distrito Federal'}"`);

        // 1. Buscar a empresa no Google Maps via SerpApi
        const resultados = await buscarEmpresaNoMaps(term, location);
        if (!resultados || resultados.length === 0) {
            return res.json({ 
                reply: `### ❌ Empresa Não Encontrada\nNão conseguimos localizar a empresa **"${term}"** na região de **"${location || 'Brasília'}"** no Google Maps.\n\n**Como resolver?**\n- Verifique se a grafia do nome está correta.\n- Tente adicionar palavras-chave (ex: em vez de apenas "BSB", busque por "BSB Redes de Proteção").\n- Especifique a cidade ou bairro no campo de localização.` 
            });
        }

        // Pega o resultado mais provável (o primeiro da lista)
        const empresa = resultados[0];
        
        // 2. Montar o relatório de análise para o LLM
        const contextAnalysis = `
Nome da Empresa: ${empresa.title || 'Não informado'}
Nota (Rating): ${empresa.rating || 'Sem avaliações'}
Número de Avaliações: ${empresa.reviews || 0}
Possui Website? ${empresa.website ? 'Sim (' + empresa.website + ')' : 'Não'}
Telefone: ${empresa.phone || 'Não informado'}
Endereço: ${empresa.address || 'Não informado'}
Categoria GMB: ${empresa.type || 'Não informada'}
ID do Google Maps: ${empresa.place_id || 'Não informado'}
        `;

        // 3. Prompt especializado para a Débora gerar o Diagnóstico
        const INVISIBILIDADE_PROMPT = `
Você é a Débora, a Estrategista Sênior de Reputação e SEO Local da Kelevra Corp.
Analise os dados estruturados do Google Meu Negócio de uma empresa fornecidos abaixo e elabore um **"Diagnóstico de Invisibilidade"** comercial, rápido e altamente persuasivo.

DADOS DA EMPRESA AUDITADA:
${contextAnalysis}

INSTRUÇÕES DO DIAGNÓSTICO:
1. Tom de Voz: Profissional, assertivo, comercialmente persuasivo, mas ético. O objetivo é despertar no dono da empresa o desejo imediato de corrigir os problemas de visibilidade.
2. Formato: Curto, visualmente escaneável, excelente para ser enviado pelo WhatsApp ou apresentado em uma ligação rápida de vendas.
3. Seções Obrigatórias:
   - **🎯 Veredito de Invisibilidade**: Uma nota de 0 a 100 de Saúde Digital e um status claro (ex: 🔴 Crítico, 🟡 Risco de Perda, 🟢 Potencial Oculto). Explique de forma muito simples a nota.
   - **🚨 Os Gargalos Graves (O que está afastando clientes)**: Liste de 2 a 3 falhas que a IA ou os dados revelaram (ex: falta de site próprio, poucas avaliações, falta de resposta às críticas, etc.). Explique o impacto prático disso no dia a dia.
   - **💸 O Impacto Financeiro (O Custo da Invisibilidade)**: Mostre o que a empresa está perdendo por não estar no Top 3 do Google Maps (quantos clientes estão preferindo concorrentes diretos que estão mais visíveis).
   - **🔥 Chamada para Ação (CTA Irrecusável)**: Ofereça uma sessão de consultoria estratégica 360 ou o agendamento de uma varredura completa da concorrência gratuitamente pelo WhatsApp da agência.
4. Linguagem: Didática e simples. Se usar termos técnicos de SEO Local ou algoritmo, faça analogias com vitrines de lojas ou localizações físicas.

Elabore em formato Markdown refinado e profissional.
`;

        const reply = await gerarResposta(INVISIBILIDADE_PROMPT, "Você é a Débora, a Estrategista Sênior de Reputação e SEO Local da Kelevra Corp.");
        res.json({ reply });
    } catch (error) {
        console.error("Erro no Diagnóstico de Invisibilidade:", error);
        res.status(500).json({ error: "A Débora teve um probleminha técnico para gerar o diagnóstico." });
    }
});

// Endpoint SSE para rodar a auditoria em Lote
app.get('/stream', async (req, res) => {
    const pwd = req.query.pwd;
    if (pwd !== SENHA_ACESSO) {
        res.status(401).send('Acesso Negado');
        return;
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    const sendLog = (message) => {
        const cleanMsg = message.replace(/\n/g, ' '); 
        res.write(`data: ${cleanMsg}\n\n`);
    };

    sendLog('✅ Conexão estabelecida e segura. Iniciando motores...');

    try {
        const dossie = await executarAuditoriaLote(sendLog);
        if (dossie) {
            res.write(`data: [[REPORT_DATA]]${JSON.stringify(dossie)}\n\n`);
        }
    } catch (e) {
        sendLog(`❌ Erro Fatal: ${e.message}`);
    }

    res.end();
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`🦀 Kelevra Web Server LIGADO!`);
    console.log(`🌍 Escutando em 0.0.0.0 na porta ${PORT}`);
    console.log(`========================================\n`);
});
