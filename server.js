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
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');

            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

            body {
                font-family: 'Inter', sans-serif;
                background-color: #0a0f1e;
                color: #cbd5e1;
                display: flex;
                height: 100vh;
                overflow: hidden;
            }

            /* ===== SIDEBAR ===== */
            .sidebar {
                width: 260px;
                min-width: 260px;
                background: linear-gradient(180deg, #111827 0%, #0d1526 100%);
                border-right: 1px solid #1e2d45;
                display: flex;
                flex-direction: column;
                padding: 0;
            }

            .user-profile {
                padding: 28px 20px 24px 20px;
                border-bottom: 1px solid #1e2d45;
                display: flex;
                align-items: center;
                gap: 14px;
            }
            .avatar {
                width: 46px;
                height: 46px;
                background: linear-gradient(135deg, #3b82f6, #6366f1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                font-weight: 700;
                color: white;
                flex-shrink: 0;
            }
            .user-profile h2 { font-size: 15px; font-weight: 700; color: #f1f5f9; }
            .user-profile p { font-size: 12px; color: #64748b; margin-top: 2px; }

            .nav-menu { padding: 16px 12px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
            .nav-item {
                padding: 12px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                color: #94a3b8;
                font-size: 14px;
                font-weight: 500;
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            .nav-item:hover { background-color: #1e2d45; color: #e2e8f0; }
            .nav-item.active { background: linear-gradient(135deg, #1d4ed8, #4338ca); color: white; font-weight: 600; }
            .nav-item span { font-size: 18px; width: 22px; text-align: center; }

            /* ===== MAIN CONTENT ===== */
            .main-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                background-color: #0a0f1e;
                overflow: hidden;
            }

            .header {
                background: #111827;
                padding: 20px 32px;
                border-bottom: 1px solid #1e2d45;
                flex-shrink: 0;
            }
            .header h1 { font-size: 20px; font-weight: 700; color: #f1f5f9; margin: 0; }
            .header p { font-size: 13px; color: #64748b; margin: 4px 0 0 0; }

            /* ===== TABS ===== */
            .tab-content { flex: 1; display: none; flex-direction: column; overflow: hidden; }
            .tab-content.active { display: flex; }

            /* ===== CHAT ===== */
            .chat-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
            .chat-messages {
                flex: 1;
                padding: 24px 32px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 18px;
            }
            .chat-messages::-webkit-scrollbar { width: 6px; }
            .chat-messages::-webkit-scrollbar-track { background: transparent; }
            .chat-messages::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 3px; }

            .message {
                max-width: 78%;
                padding: 16px 20px;
                border-radius: 14px;
                line-height: 1.65;
                font-size: 14px;
            }
            .msg-debora {
                background: #111827;
                border: 1px solid #1e2d45;
                align-self: flex-start;
                border-top-left-radius: 3px;
                color: #cbd5e1;
            }
            .msg-debora strong { color: #60a5fa; display: block; margin-bottom: 8px; }
            .msg-gabi {
                background: linear-gradient(135deg, #2563eb, #4f46e5);
                color: white;
                align-self: flex-end;
                border-top-right-radius: 3px;
            }
            .msg-debora h1, .msg-debora h2, .msg-debora h3 { color: #e2e8f0; font-size: 15px; margin: 12px 0 6px; }
            .msg-debora p { margin-bottom: 8px; }
            .msg-debora p:last-child { margin-bottom: 0; }
            .msg-debora ul, .msg-debora ol { margin-left: 20px; margin-bottom: 8px; }
            .msg-debora li { margin-bottom: 4px; }
            .msg-debora pre { background: #0a0f1e; padding: 12px; border-radius: 6px; overflow-x: auto; border: 1px solid #1e2d45; margin: 8px 0; }
            .msg-debora code { font-family: 'Courier New', monospace; font-size: 13px; color: #38bdf8; }
            .msg-debora a { color: #60a5fa; }

            .typing-indicator { display: none; color: #64748b; font-size: 13px; padding: 8px 32px; }

            .chat-input-area {
                padding: 16px 24px;
                border-top: 1px solid #1e2d45;
                background: #111827;
                display: flex;
                gap: 12px;
                align-items: flex-end;
            }
            textarea.chat-input {
                flex: 1;
                border: 1px solid #1e2d45;
                background: #0a0f1e;
                color: #e2e8f0;
                border-radius: 10px;
                padding: 14px 16px;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                resize: none;
                height: 56px;
                transition: border-color 0.2s;
            }
            textarea.chat-input::placeholder { color: #475569; }
            textarea.chat-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }

            button.btn-primary {
                background: linear-gradient(135deg, #2563eb, #4f46e5);
                color: white;
                border: none;
                border-radius: 10px;
                padding: 14px 24px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: opacity 0.2s, transform 0.1s;
                white-space: nowrap;
            }
            button.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
            button.btn-primary:active { transform: translateY(0); }
            button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

            /* ===== OTIMIZADOR ===== */
            .otimizador-panel {
                flex: 1;
                padding: 28px 32px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .otimizador-area {
                width: 100%;
                height: 200px;
                border: 1px solid #1e2d45;
                background: #111827;
                color: #e2e8f0;
                border-radius: 10px;
                padding: 16px;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                resize: vertical;
                transition: border-color 0.2s;
            }
            .otimizador-area::placeholder { color: #475569; }
            .otimizador-area:focus { outline: none; border-color: #3b82f6; }
            #otimizadorResult {
                margin-top: 8px;
                display: none;
                background: #111827;
                padding: 24px;
                border-radius: 10px;
                border: 1px solid #1e3a5f;
                color: #cbd5e1;
                line-height: 1.7;
            }

            /* ===== VARREDURA ===== */
            .varredura-panel {
                flex: 1;
                padding: 28px 32px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .varredura-box {
                background: #111827;
                padding: 40px;
                border-radius: 16px;
                text-align: center;
                border: 1px solid #1e2d45;
                width: 100%;
                max-width: 600px;
            }
            .varredura-box h2 { color: #f1f5f9; margin-bottom: 10px; }
            .varredura-box p { color: #64748b; margin-bottom: 28px; font-size: 14px; }
            input[type="password"] {
                padding: 14px 20px;
                border-radius: 10px;
                border: 1px solid #1e2d45;
                background: #0a0f1e;
                color: #f1f5f9;
                font-size: 15px;
                width: 260px;
                margin-bottom: 16px;
                text-align: center;
                display: block;
                margin-left: auto;
                margin-right: auto;
            }
            input[type="password"]::placeholder { color: #475569; }
            .progress-log {
                margin-top: 24px;
                background: #0a0f1e;
                padding: 16px;
                border-radius: 10px;
                height: 280px;
                overflow-y: auto;
                text-align: left;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                border: 1px solid #1e2d45;
                color: #94a3b8;
                display: none;
            }
            .log-line { margin-bottom: 6px; color: #64748b; }
            .log-line.error { color: #f87171; }
            .log-line.success { color: #34d399; font-weight: bold; }

            /* ===== TASK MANAGER ===== */
            .tasks-panel {
                flex: 1;
                padding: 28px 32px;
                overflow-y: auto;
            }
            .tasks-panel h2 { color: #f1f5f9; margin-bottom: 8px; }
            .tasks-panel > p { color: #64748b; font-size: 14px; margin-bottom: 24px; }
            .task-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
            .task-item {
                background: #111827;
                border: 1px solid #1e2d45;
                border-radius: 10px;
                padding: 18px 20px;
                display: flex;
                align-items: flex-start;
                gap: 14px;
                transition: border-color 0.2s;
            }
            .task-item:hover { border-color: #334155; }
            .task-checkbox { width: 20px; height: 20px; cursor: pointer; margin-top: 3px; flex-shrink: 0; accent-color: #3b82f6; }
            .task-content { flex: 1; }
            .task-title { font-weight: 600; color: #f1f5f9; margin: 0 0 5px 0; font-size: 15px; }
            .task-desc { color: #64748b; margin: 0; font-size: 13px; line-height: 1.5; }
            .task-delete { color: #475569; background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; transition: color 0.2s; flex-shrink: 0; }
            .task-delete:hover { color: #ef4444; }
            .task-item.completed .task-title, .task-item.completed .task-desc { text-decoration: line-through; opacity: 0.45; }
        </style>
        
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    </head>
    <body>

        <div class="sidebar">
            <div class="user-profile">
                <div class="avatar">G</div>
                <div>
                    <h2>Gabriela</h2>
                    <p>Head Operacional</p>
                </div>
            </div>
            <div class="nav-menu">
                <div class="nav-item active" onclick="switchTab('chat')">
                    <span>💬</span> Falar com a Débora
                </div>
                <div class="nav-item" onclick="switchTab('otimizador')">
                    <span>🪄</span> Otimizador de Fichas
                </div>
                <div class="nav-item" onclick="switchTab('varredura')">
                    <span>🛡️</span> Varredura Automática
                </div>
                <div class="nav-item" onclick="switchTab('tarefas')">
                    <span>✅</span> Minhas Tarefas
                </div>
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
                <div class="otimizador-panel">
                    <h2 style="color:#f1f5f9; margin-bottom:8px;">Otimizador de Fichas GMB</h2>
                    <p style="color:#64748b; font-size:14px; margin-bottom:16px;">Cole aqui as informações da ficha do cliente. A Débora vai analisar e te dar o passo a passo.</p>
                    <textarea id="otimizadorInput" class="otimizador-area" placeholder="Cole os dados do Google Meu Negócio do cliente aqui..."></textarea>
                    <div>
                        <button id="btnSendOtimizador" class="btn-primary">Analisar Ficha com a Débora</button>
                    </div>
                    <div id="otimizadorResult">
                        <!-- Markdown renderizado entra aqui -->
                    </div>
                </div>
            </div>

            <!-- TAB 3: Varredura -->
            <div id="tab-varredura" class="tab-content">
                <div class="varredura-panel">
                    <div class="varredura-box">
                        <h2>Auditoria Automática de Portfólio</h2>
                        <p>Inicie a varredura mensal dos clientes para gerar o dossiê da diretoria.</p>
                        <input type="password" id="password" placeholder="Senha de Operação" />
                        <button id="btnStartScan" class="btn-primary">Iniciar Varredura Segura</button>
                        <div id="terminal" class="progress-log"></div>
                    </div>
                </div>
            </div>

            <!-- TAB 4: Tarefas -->
            <div id="tab-tarefas" class="tab-content">
                <div class="tasks-panel">
                    <h2>Lista de Tarefas da Gabi</h2>
                    <p>A Débora insere automaticamente as tarefas sugeridas aqui. Marque para concluir ou exclua.</p>
                    <ul class="task-list" id="taskListContainer">
                        <!-- Tarefas renderizadas aqui -->
                    </ul>
                </div>
            </div>
        </div>

        <script>
            // Troca de Abas
            function switchTab(tabId) {
                document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                
                const tabEl = document.getElementById('tab-' + tabId);
                if (tabEl) tabEl.classList.add('active');

                // Marca o nav-item correto sem depender do event global
                const navItems = document.querySelectorAll('.nav-item');
                const tabLabels = ['chat', 'otimizador', 'varredura', 'tarefas'];
                const idx = tabLabels.indexOf(tabId);
                if (idx !== -1 && navItems[idx]) navItems[idx].classList.add('active');

                const headerTitle = document.querySelector('.header h1');
                const headerDesc = document.querySelector('.header p');

                if(tabId === 'chat') {
                    headerTitle.innerText = "Falar com a Débora";
                    headerDesc.innerText = "Sua assistente exclusiva para organizar o dia a dia e encantar os clientes.";
                } else if(tabId === 'otimizador') {
                    headerTitle.innerText = "Otimizador de Fichas";
                    headerDesc.innerText = "Cole os dados do cliente e receba um passo a passo organizado.";
                } else if(tabId === 'varredura') {
                    headerTitle.innerText = "Varredura Automática";
                    headerDesc.innerText = "Blindagem mensal do portfólio de clientes.";
                } else {
                    headerTitle.innerText = "Minhas Tarefas";
                    headerDesc.innerText = "Acompanhe e gerencie as ações recomendadas pela Débora.";
                    renderTasks();
                }
            }

            // Limpa dados corrompidos do LocalStorage automaticamente
            function safeGetStorage(key) {
                try { return JSON.parse(localStorage.getItem(key)) || []; }
                catch(e) { localStorage.removeItem(key); return []; }
            }

            // Chat Functionality
            const chatMessages = document.getElementById('chatMessages');
            const chatInput = document.getElementById('chatInput');
            const btnSendChat = document.getElementById('btnSendChat');
            const chatTyping = document.getElementById('chatTyping');
            
            let chatHistory = safeGetStorage('deboraChatHistory');

            // Renderiza histórico inicial
            function renderInitialHistory() {
                try {
                    if (chatHistory.length > 0) {
                        chatHistory.forEach(msg => {
                            if (!msg || !msg.parts || !msg.parts[0] || !msg.parts[0].text) return; // Segurança
                            const div = document.createElement('div');
                            if (msg.role === 'user') {
                                div.className = 'message msg-gabi';
                                div.innerText = msg.parts[0].text;
                            } else {
                                div.className = 'message msg-debora';
                                div.innerHTML = '<strong>Débora:</strong><br><br>' + marked.parse(msg.parts[0].text);
                            }
                            chatMessages.appendChild(div);
                        });
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                } catch(e) {
                    console.error("Erro ao renderizar histórico", e);
                }
            }
            // Chama no boot
            renderInitialHistory();

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
                        localStorage.setItem('deboraChatHistory', JSON.stringify(chatHistory));
                        // Envia apenas as últimas 40 mensagens para poupar tokens
                        currentHistory = chatHistory.slice(-40);
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
                        let finalReply = data.reply;
                        
                        // Extração de Tarefas ocultas (<ADD_TASK>Título|Descrição</ADD_TASK>)
                        const taskRegex = /<ADD_TASK>(.*?)<\/ADD_TASK>/gs;
                        let match;
                        while ((match = taskRegex.exec(finalReply)) !== null) {
                            const taskData = match[1].split('|');
                            if (taskData.length >= 2) {
                                addTaskToManager(taskData[0].trim(), taskData[1].trim());
                            }
                        }
                        
                        // Limpa a tag do texto visível
                        finalReply = finalReply.replace(taskRegex, '').trim();

                        chatHistory.push({ role: 'model', parts: [{ text: finalReply }] });
                        localStorage.setItem('deboraChatHistory', JSON.stringify(chatHistory));
                        
                        const replyDiv = document.createElement('div');
                        replyDiv.className = 'message msg-debora';
                        replyDiv.innerHTML = '<strong>Débora:</strong><br><br>' + marked.parse(finalReply);
                        chatMessages.appendChild(replyDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                    
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

            // Task Manager Functionality
            let tasksArray = safeGetStorage('deboraTasks');
            const taskListContainer = document.getElementById('taskListContainer');

            function saveTasks() {
                localStorage.setItem('deboraTasks', JSON.stringify(tasksArray));
            }

            function addTaskToManager(title, desc) {
                tasksArray.push({ id: Date.now(), title, desc, completed: false });
                saveTasks();
                if (document.getElementById('tab-tarefas').classList.contains('active')) {
                    renderTasks();
                }
            }

            function toggleTask(id) {
                const task = tasksArray.find(t => t.id === id);
                if (task) {
                    task.completed = !task.completed;
                    saveTasks();
                    renderTasks();
                }
            }

            function deleteTask(id) {
                tasksArray = tasksArray.filter(t => t.id !== id);
                saveTasks();
                renderTasks();
            }

            function renderTasks() {
                taskListContainer.innerHTML = '';
                if (tasksArray.length === 0) {
                    taskListContainer.innerHTML = '<li style="color: #94a3b8; text-align: center; padding: 20px;">Nenhuma tarefa pendente. Você está em dia!</li>';
                    return;
                }
                tasksArray.forEach(task => {
                    const li = document.createElement('li');
                    li.className = 'task-item' + (task.completed ? ' completed' : '');
                    li.innerHTML = 
                        '<input type="checkbox" class="task-checkbox" ' + (task.completed ? "checked" : "") + ' onclick="toggleTask(' + task.id + ')">' +
                        '<div class="task-content">' +
                            '<h4 class="task-title">' + task.title + '</h4>' +
                            '<p class="task-desc">' + task.desc + '</p>' +
                        '</div>' +
                        '<button class="task-delete" onclick="deleteTask(' + task.id + ')">🗑️</button>';
                    taskListContainer.appendChild(li);
                });
            }

            // Varredura Functionality
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
                    // Interceptação do Dossiê Final
                    if (event.data.startsWith('[[REPORT_DATA]]')) {
                        const rawJson = event.data.replace('[[REPORT_DATA]]', '');
                        try {
                            const parsedDossie = JSON.parse(rawJson);
                            eventSource.close();
                            
                            // Automatiza a abertura no Otimizador
                            switchTab('otimizador');
                            document.getElementById('otimizadorInput').value = parsedDossie;
                            document.getElementById('btnSendOtimizador').click();
                            
                            btnStartScan.disabled = false;
                            btnStartScan.innerText = 'Iniciar Nova Varredura';
                            passwordInput.disabled = false;
                            return;
                        } catch (e) {
                            appendLog('❌ Erro ao ler Dossiê.', 'error');
                        }
                    }

                    let type = '';
                    if (event.data.includes('❌')) type = 'error';
                    if (event.data.includes('✅') || event.data.includes('🎉')) type = 'success';
                    
                    appendLog(event.data, type);
                    
                    if (event.data.includes('🎉 Auditoria de Lote Finalizada!')) {
                        // Se por algum motivo o REPORT_DATA falhar
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
