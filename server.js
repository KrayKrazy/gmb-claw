import express from 'express';
import { executarAuditoriaLote } from './batch_audit.js';
import { gerarResposta } from './llm.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SENHA_ACESSO = process.env.DASHBOARD_PASSWORD || 'kelevra2026';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kelevra Workspace | Gabi</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
            
            body {
                font-family: 'Inter', sans-serif;
                background-color: #f8fafc;
                color: #334155;
                margin: 0;
                display: flex;
                height: 100vh;
            }

            /* Sidebar */
            .sidebar {
                width: 280px;
                background-color: #ffffff;
                border-right: 1px solid #e2e8f0;
                display: flex;
                flex-direction: column;
                padding: 30px 20px;
            }
            .user-profile {
                text-align: center;
                margin-bottom: 40px;
            }
            .avatar {
                width: 80px;
                height: 80px;
                background-color: #e0f2fe;
                color: #0284c7;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                font-weight: 700;
                margin: 0 auto 15px auto;
            }
            .user-profile h2 { margin: 0; font-size: 18px; color: #0f172a; }
            .user-profile p { margin: 5px 0 0 0; font-size: 13px; color: #64748b; }

            .nav-item {
                padding: 15px 20px;
                margin-bottom: 10px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                color: #64748b;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .nav-item:hover { background-color: #f1f5f9; color: #0f172a; }
            .nav-item.active { background-color: #e0f2fe; color: #0284c7; }

            /* Main Content */
            .main-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                background-color: #f8fafc;
                overflow-y: auto;
            }
            
            .header {
                padding: 30px 50px;
                background-color: #ffffff;
                border-bottom: 1px solid #e2e8f0;
            }
            .header h1 { margin: 0; font-size: 24px; color: #0f172a; }
            .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }

            .tab-content {
                display: none;
                padding: 40px 50px;
                max-width: 900px;
                margin: 0 auto;
                width: 100%;
            }
            .tab-content.active { display: block; }

            /* Chat Section */
            .chat-container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                display: flex;
                flex-direction: column;
                height: 600px;
                border: 1px solid #e2e8f0;
            }
            .chat-messages {
                flex: 1;
                padding: 30px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .message { max-width: 80%; padding: 15px 20px; border-radius: 12px; font-size: 15px; line-height: 1.5; }
            .msg-debora { background-color: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; align-self: flex-start; border-bottom-left-radius: 2px; }
            .msg-gabi { background-color: #0284c7; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
            
            /* Markdown Styling for Chat */
            .msg-debora h1, .msg-debora h2, .msg-debora h3 { margin-top: 0; font-size: 16px; margin-bottom: 10px; }
            .msg-debora p { margin-bottom: 10px; }
            .msg-debora p:last-child { margin-bottom: 0; }
            .msg-debora ul, .msg-debora ol { margin-left: 20px; margin-bottom: 10px; }

            .chat-input-area {
                padding: 20px;
                border-top: 1px solid #e2e8f0;
                display: flex;
                gap: 15px;
            }
            textarea.chat-input {
                flex: 1;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 15px;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                resize: none;
                height: 60px;
            }
            textarea.chat-input:focus { outline: none; border-color: #0284c7; box-shadow: 0 0 0 3px #e0f2fe; }
            
            button.btn-primary {
                background-color: #0284c7;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0 25px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.3s;
            }
            button.btn-primary:hover { background-color: #0369a1; }
            button:disabled { opacity: 0.7; cursor: not-allowed; }

            /* Textarea for Otimizador */
            .otimizador-area {
                width: 100%;
                height: 200px;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                padding: 20px;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                resize: vertical;
                margin-bottom: 20px;
                box-sizing: border-box;
            }
            .otimizador-area:focus { outline: none; border-color: #0284c7; }

            /* Varredura Section */
            .varredura-box {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                text-align: center;
                border: 1px solid #e2e8f0;
            }
            input[type="password"] {
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #cbd5e1;
                font-size: 15px;
                width: 250px;
                margin-bottom: 20px;
                text-align: center;
            }
            .progress-log {
                margin-top: 30px;
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                height: 250px;
                overflow-y: auto;
                text-align: left;
                font-family: 'Courier New', Courier, monospace;
                font-size: 14px;
                border: 1px solid #e2e8f0;
                display: none;
            }
            .log-line { margin-bottom: 8px; color: #475569; }
            .log-line.error { color: #ef4444; }
            .log-line.success { color: #10b981; font-weight: bold; }

            /* Loading Spinner */
            .typing-indicator { display: none; color: #94a3b8; font-size: 14px; padding: 10px 20px; }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    </head>
    <body>

        <div class="sidebar">
            <div class="user-profile">
                <div class="avatar">G</div>
                <h2>Gabriela</h2>
                <p>Head Operacional</p>
            </div>
            
            <div class="nav-item active" onclick="switchTab('chat')">
                <span>💬</span> Falar com a Débora
            </div>
            <div class="nav-item" onclick="switchTab('otimizador')">
                <span>🪄</span> Otimizador de Fichas
            </div>
            <div class="nav-item" onclick="switchTab('varredura')">
                <span>🛡️</span> Varredura Automática
            </div>
        </div>

        <div class="main-content">
            <div class="header" id="mainHeader">
                <h1>Falar com a Débora</h1>
                <p>Sua assistente exclusiva para organizar o dia a dia e encantar os clientes.</p>
            </div>

            <!-- TAB 1: Chat -->
            <div id="tab-chat" class="tab-content active">
                <div class="chat-container">
                    <div class="chat-messages" id="chatMessages">
                        <div class="message msg-debora">
                            <strong>Débora:</strong><br><br>
                            Olá, Gabi! Como posso ajudar a organizar a sua rotina hoje? Se tiver recebido um Plano de Ação, é só colar aqui que eu transformo em tarefas para a sua agenda!
                        </div>
                    </div>
                    <div class="typing-indicator" id="chatTyping">A Débora está digitando...</div>
                    <div class="chat-input-area">
                        <textarea id="chatInput" class="chat-input" placeholder="Digite sua mensagem para a Débora..."></textarea>
                        <button id="btnSendChat" class="btn-primary">Enviar</button>
                    </div>
                </div>
            </div>

            <!-- TAB 2: Otimizador -->
            <div id="tab-otimizador" class="tab-content">
                <div class="chat-container" style="height: auto; padding: 30px;">
                    <h2 style="margin-top:0;">Otimizador de Fichas GMB</h2>
                    <p style="color: #64748b; margin-bottom: 20px;">Cole aqui as informações da ficha do cliente (Nome, Descrição atual, Categorias). A Débora vai analisar e te dar o passo a passo de como arrumar no Google.</p>
                    
                    <textarea id="otimizadorInput" class="otimizador-area" placeholder="Cole os dados do Google Meu Negócio do cliente aqui..."></textarea>
                    
                    <button id="btnSendOtimizador" class="btn-primary" style="padding: 15px;">Analisar Ficha com a Débora</button>
                    
                    <div id="otimizadorResult" style="margin-top: 30px; display: none; background: #f0f9ff; padding: 25px; border-radius: 8px; border: 1px solid #bae6fd;">
                        <!-- Markdown renderizado entra aqui -->
                    </div>
                </div>
            </div>

            <!-- TAB 3: Varredura -->
            <div id="tab-varredura" class="tab-content">
                <div class="varredura-box">
                    <h2>Auditoria Automática de Portfólio</h2>
                    <p style="color: #64748b; margin-bottom: 30px;">Inicie a varredura mensal dos clientes para gerar o dossiê da diretoria.</p>
                    
                    <input type="password" id="password" placeholder="Senha de Operação" /><br>
                    <button id="btnStartScan" class="btn-primary" style="padding: 15px 30px;">Iniciar Varredura Segura</button>
                    
                    <div id="terminal" class="progress-log"></div>
                </div>
            </div>
        </div>

        <script>
            // Troca de Abas
            function switchTab(tabId) {
                document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                
                document.getElementById('tab-' + tabId).classList.add('active');
                event.currentTarget.classList.add('active');

                const headerTitle = document.querySelector('.header h1');
                const headerDesc = document.querySelector('.header p');

                if(tabId === 'chat') {
                    headerTitle.innerText = "Falar com a Débora";
                    headerDesc.innerText = "Sua assistente exclusiva para organizar o dia a dia e encantar os clientes.";
                } else if(tabId === 'otimizador') {
                    headerTitle.innerText = "Otimizador de Fichas";
                    headerDesc.innerText = "Cole os dados do cliente e receba um passo a passo organizado.";
                } else {
                    headerTitle.innerText = "Varredura Automática";
                    headerDesc.innerText = "Blindagem mensal do portfólio de clientes.";
                }
            }

            // Chat Functionality
            const chatMessages = document.getElementById('chatMessages');
            const chatInput = document.getElementById('chatInput');
            const btnSendChat = document.getElementById('btnSendChat');
            const chatTyping = document.getElementById('chatTyping');
            let chatHistory = [];

            async function sendMessage(text, isContextOtimizador = false) {
                if(!isContextOtimizador) {
                    // Adiciona mensagem da Gabi na UI
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'message msg-gabi';
                    msgDiv.innerText = text;
                    chatMessages.appendChild(msgDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    chatInput.value = '';
                    chatTyping.style.display = 'block';
                    btnSendChat.disabled = true;
                }

                try {
                    // Atualiza histórico (apenas para chat normal)
                    let currentHistory = [];
                    if (!isContextOtimizador) {
                        chatHistory.push({ role: 'user', parts: [{ text: text }] });
                        currentHistory = chatHistory;
                    }

                    const payload = isContextOtimizador 
                        ? { message: text, type: 'otimizador' }
                        : { history: currentHistory, type: 'chat' };

                    const response = await fetch('/api/debora', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await response.json();
                    
                    if(!isContextOtimizador) {
                        chatHistory.push({ role: 'model', parts: [{ text: data.reply }] });
                    }
                    
                    if(isContextOtimizador) {
                        return data.reply;
                    }

                    chatTyping.style.display = 'none';
                    btnSendChat.disabled = false;

                    const replyDiv = document.createElement('div');
                    replyDiv.className = 'message msg-debora';
                    replyDiv.innerHTML = '<strong>Débora:</strong><br><br>' + marked.parse(data.reply);
                    chatMessages.appendChild(replyDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                } catch (error) {
                    chatTyping.style.display = 'none';
                    btnSendChat.disabled = false;
                    alert('Erro de conexão com a Débora.');
                }
            }

            btnSendChat.addEventListener('click', () => {
                if(chatInput.value.trim() !== '') sendMessage(chatInput.value);
            });
            chatInput.addEventListener('keypress', (e) => {
                if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btnSendChat.click(); }
            });

            // Otimizador Functionality
            const btnSendOtimizador = document.getElementById('btnSendOtimizador');
            const otimizadorInput = document.getElementById('otimizadorInput');
            const otimizadorResult = document.getElementById('otimizadorResult');

            btnSendOtimizador.addEventListener('click', async () => {
                const text = otimizadorInput.value.trim();
                if(!text) return alert('Cole os dados da ficha primeiro!');
                
                btnSendOtimizador.disabled = true;
                btnSendOtimizador.innerText = 'A Débora está analisando...';
                otimizadorResult.style.display = 'none';

                const promptOtimizador = "Gabi falando: Débora, analise essa ficha do GMB e me dê o passo a passo exato do que eu devo alterar e onde clicar.\\n\\nDADOS DA FICHA:\\n" + text;
                const reply = await sendMessage(promptOtimizador, true);
                
                otimizadorResult.innerHTML = marked.parse(reply);
                otimizadorResult.style.display = 'block';
                
                btnSendOtimizador.disabled = false;
                btnSendOtimizador.innerText = 'Analisar Novamente';
            });

            // Varredura Functionality (Mantida original)
            const btnStartScan = document.getElementById('btnStartScan');
            const terminal = document.getElementById('terminal');
            const passwordInput = document.getElementById('password');

            function appendLog(text, type = 'log-line') {
                const div = document.createElement('div');
                div.className = 'log-line ' + type;
                div.innerText = text;
                terminal.appendChild(div);
                terminal.scrollTop = terminal.scrollHeight;
            }

            btnStartScan.addEventListener('click', () => {
                const pass = passwordInput.value;
                if (!pass) return alert('Digite a senha de operação.');

                btnStartScan.disabled = true;
                btnStartScan.innerText = 'Varredura em andamento...';
                passwordInput.disabled = true;
                terminal.style.display = 'block';
                terminal.innerHTML = '';
                appendLog('🚀 Autenticando com segurança...', 'info');

                const eventSource = new EventSource('/stream?pwd=' + encodeURIComponent(pass));

                eventSource.onmessage = function(event) {
                    let type = '';
                    if (event.data.includes('❌')) type = 'error';
                    if (event.data.includes('✅') || event.data.includes('🎉')) type = 'success';
                    
                    appendLog(event.data, type);
                    
                    if (event.data.includes('🎉 Auditoria de Lote Finalizada!')) {
                        eventSource.close();
                        btnStartScan.disabled = false;
                        btnStartScan.innerText = 'Iniciar Nova Varredura';
                        passwordInput.disabled = false;
                    }
                };

                eventSource.onerror = function() {
                    appendLog('❌ Conexão encerrada ou senha incorreta.', 'error');
                    eventSource.close();
                    btnStartScan.disabled = false;
                    btnStartScan.innerText = 'Tentar Novamente';
                    passwordInput.disabled = false;
                };
            });
        </script>
    </body>
    </html>
    `);
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

[REGRAS DE INTERAÇÃO - OBRIGATÓRIO]
- Toda vez que a Gabriela pedir ajuda com um novo cliente ou tarefa, inicie a resposta validando a importância do trabalho dela. Ex: "Excelente iniciativa, Gabi. Vamos organizar isso passo a passo..."
- Se a instrução envolver clicar em botões no Google Meu Negócio, descreva onde o botão fica.
- Pergunte sempre ao final: "Ficou claro este passo, Gabi, ou gostaria que eu explicasse algum detalhe tecnológico de outra forma?"
- Use formatação Markdown (negrito, listas) para facilitar a leitura.
`;

import { listarContas, listarLocais } from './api_gmb.js';

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
        await executarAuditoriaLote(sendLog);
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
