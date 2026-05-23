import express from 'express';
import { executarAuditoriaLote } from './batch_audit.js';
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
        <title>Painel de Operações | Kelevra Corp</title>
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background-color: #0f172a;
                color: #f8fafc;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 40px 20px;
                margin: 0;
            }
            .container {
                max-width: 800px;
                width: 100%;
                background: #1e293b;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                text-align: center;
            }
            h1 { color: #38bdf8; margin-bottom: 5px; }
            p.subtitle { color: #94a3b8; margin-bottom: 30px; }
            .auth-box {
                margin-bottom: 20px;
            }
            input[type="password"] {
                padding: 12px;
                border-radius: 6px;
                border: 1px solid #475569;
                background: #0f172a;
                color: white;
                width: 250px;
                margin-right: 10px;
            }
            button {
                background: #0284c7;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.3s;
            }
            button:hover { background: #0369a1; }
            button:disabled { background: #475569; cursor: not-allowed; }
            
            #terminal {
                margin-top: 30px;
                background: #020617;
                padding: 20px;
                border-radius: 8px;
                height: 400px;
                overflow-y: auto;
                text-align: left;
                font-family: 'Courier New', Courier, monospace;
                color: #10b981;
                border: 1px solid #334155;
                display: none;
                white-space: pre-wrap;
            }
            .log-line { margin-bottom: 5px; }
            .error { color: #ef4444; }
            .success { color: #34d399; }
            .info { color: #60a5fa; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Área Operacional</h1>
            <p class="subtitle">Auditoria Automática de Portfólio (Sucesso do Cliente)</p>
            
            <div id="authSection" class="auth-box">
                <input type="password" id="password" placeholder="Senha de Operação" />
            </div>
            
            <button id="btnStart">Iniciar Varredura Mensal</button>
            
            <div id="terminal"></div>
        </div>

        <script>
            const btn = document.getElementById('btnStart');
            const terminal = document.getElementById('terminal');
            const passwordInput = document.getElementById('password');

            function appendLog(text, type = 'info') {
                const div = document.createElement('div');
                div.className = 'log-line ' + type;
                div.innerText = text;
                terminal.appendChild(div);
                terminal.scrollTop = terminal.scrollHeight;
            }

            btn.addEventListener('click', () => {
                const pass = passwordInput.value;
                if (!pass) return alert('Digite a senha.');

                btn.disabled = true;
                btn.innerText = 'Varredura em andamento...';
                passwordInput.disabled = true;
                terminal.style.display = 'block';
                terminal.innerHTML = '';
                appendLog('🚀 Autenticando com segurança...', 'info');

                const eventSource = new EventSource('/stream?pwd=' + encodeURIComponent(pass));

                eventSource.onmessage = function(event) {
                    let type = 'info';
                    if (event.data.includes('❌')) type = 'error';
                    if (event.data.includes('✅') || event.data.includes('🎉')) type = 'success';
                    
                    appendLog(event.data, type);
                    
                    if (event.data.includes('🎉 Auditoria de Lote Finalizada!')) {
                        eventSource.close();
                        btn.disabled = false;
                        btn.innerText = 'Iniciar Nova Varredura';
                        passwordInput.disabled = false;
                    }
                };

                eventSource.onerror = function() {
                    appendLog('❌ Conexão encerrada ou senha incorreta.', 'error');
                    eventSource.close();
                    btn.disabled = false;
                    btn.innerText = 'Tentar Novamente';
                    passwordInput.disabled = false;
                };
            });
        </script>
    </body>
    </html>
    `);
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

app.listen(PORT, () => {
    console.log(`🦀 Kelevra Web Server rodando na porta ${PORT}`);
});
