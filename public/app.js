// Proteção Global contra Erros
window.onerror = function(msg, url, lineNo, col, err) {
    console.error('ERRO SINCRONO:', msg, 'linha', lineNo);
};
window.addEventListener('unhandledrejection', function(event) {
    console.error('ERRO ASYNC nao tratado:', event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
    // === Utilitários Seguros ===
    function safeGetStorage(key) {
        try { 
            const data = localStorage.getItem(key);
            if (!data) return [];
            return JSON.parse(data) || []; 
        } catch(e) { 
            console.error("Storage error:", e);
            try { localStorage.removeItem(key); } catch(err) {} 
            return []; 
        }
    }
    
    function safeSetStorage(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } 
        catch(e) { console.error("Falha ao salvar no storage:", e); }
    }

    function parseMarkdown(text) {
        try {
            return (typeof marked !== 'undefined') ? marked.parse(text) : text;
        } catch (e) {
            return text;
        }
    }

    // === Navegação (Tabs) ===
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const headerTitle = document.getElementById('headerTitle');
    const headerDesc = document.getElementById('headerDesc');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            
            // Remove active classes
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class
            item.classList.add('active');
            const targetTab = document.getElementById('tab-' + tabId);
            if (targetTab) targetTab.classList.add('active');

            // Update Header
            if (tabId === 'chat') {
                headerTitle.innerText = "Falar com a Débora";
                headerDesc.innerText = "Sua assistente exclusiva para organizar o dia a dia e encantar os clientes.";
            } else if (tabId === 'otimizador') {
                headerTitle.innerText = "Otimizador de Fichas";
                headerDesc.innerText = "Cole os dados do cliente e receba um passo a passo organizado.";
            } else if (tabId === 'invisibilidade') {
                headerTitle.innerText = "Diagnóstico de Invisibilidade";
                headerDesc.innerText = "Gere um laudo rápido e persuasivo para usar de gancho em ligações de vendas.";
            } else if (tabId === 'varredura') {
                headerTitle.innerText = "Varredura Automática";
                headerDesc.innerText = "Blindagem mensal do portfólio de clientes.";
            } else if (tabId === 'tarefas') {
                headerTitle.innerText = "Minhas Tarefas";
                headerDesc.innerText = "Acompanhe e gerencie as ações recomendadas pela Débora.";
                renderTasks();
            }
        });
    });

    // === Chat Functionality ===
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const btnSendChat = document.getElementById('btnSendChat');
    const chatTyping = document.getElementById('chatTyping');
    
    let chatHistory = safeGetStorage('deboraChatHistory');

    function renderInitialHistory() {
        if (!chatHistory.length) return;
        chatHistory.forEach(msg => {
            if (!msg || !msg.parts || !msg.parts[0] || !msg.parts[0].text) return;
            const div = document.createElement('div');
            
            if (msg.role === 'user') {
                div.className = 'message msg-gabi';
                div.innerHTML = `<div class="msg-bubble">${msg.parts[0].text}</div>`;
            } else {
                div.className = 'message msg-debora';
                div.innerHTML = `<div class="msg-author">Débora</div><div class="msg-bubble">${parseMarkdown(msg.parts[0].text)}</div>`;
            }
            chatMessages.appendChild(div);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    renderInitialHistory();

    async function sendMessage(text, isOtimizador = false) {
        if (!isOtimizador) {
            const div = document.createElement('div');
            div.className = 'message msg-gabi';
            div.innerHTML = `<div class="msg-bubble">${text}</div>`;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            chatInput.value = '';
            chatTyping.style.display = 'block';
            btnSendChat.disabled = true;
        }

        try {
            let currentHistory = [];
            if (!isOtimizador) {
                chatHistory.push({ role: 'user', parts: [{ text: text }] });
                safeSetStorage('deboraChatHistory', chatHistory);
                currentHistory = chatHistory.slice(-20); // Otimização de Tokens
            }

            const payload = isOtimizador 
                ? { message: text, type: 'otimizador' }
                : { history: currentHistory, type: 'chat' };

            const response = await fetch('/api/debora', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            const rawReply = (data && data.reply) ? data.reply : '';

            if (isOtimizador) {
                return rawReply;
            } else {
                let finalReply = rawReply;
                
                // Extrair Tarefas
                const taskRegex = /<ADD_TASK>(.*?)<\/ADD_TASK>/gs;
                let match;
                while ((match = taskRegex.exec(finalReply)) !== null) {
                    const taskData = match[1].split('|');
                    if (taskData.length >= 2) {
                        addTaskToManager(taskData[0].trim(), taskData[1].trim());
                    }
                }
                finalReply = finalReply.replace(taskRegex, '').trim();

                chatHistory.push({ role: 'model', parts: [{ text: finalReply }] });
                safeSetStorage('deboraChatHistory', chatHistory);
                
                const replyDiv = document.createElement('div');
                replyDiv.className = 'message msg-debora';
                replyDiv.innerHTML = `<div class="msg-author">Débora</div><div class="msg-bubble">${parseMarkdown(finalReply)}</div>`;
                chatMessages.appendChild(replyDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (error) {
            console.error('Erro sendMessage:', error);
            if (!isOtimizador) alert('Erro de conexão com a Débora: ' + error.message);
        } finally {
            if (!isOtimizador) {
                chatTyping.style.display = 'none';
                btnSendChat.disabled = false;
            }
        }
    }

    btnSendChat.addEventListener('click', () => {
        if (chatInput.value.trim() !== '') sendMessage(chatInput.value);
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            btnSendChat.click(); 
        }
    });

    // === Otimizador Functionality ===
    const btnSendOtimizador = document.getElementById('btnSendOtimizador');
    const otimizadorInput = document.getElementById('otimizadorInput');
    const otimizadorResult = document.getElementById('otimizadorResult');

    btnSendOtimizador.addEventListener('click', async () => {
        const text = otimizadorInput.value.trim();
        if (!text) return alert('Cole os dados da ficha primeiro!');
        
        btnSendOtimizador.disabled = true;
        btnSendOtimizador.innerText = 'A Débora está analisando...';
        otimizadorResult.style.display = 'none';

        const promptOtimizador = 'Gabi falando: Débora, analise essa ficha do GMB e me dê o passo a passo exato do que eu devo alterar e onde clicar.\n\nDADOS DA FICHA:\n' + text;
        const reply = await sendMessage(promptOtimizador, true);
        
        if (reply) {
            otimizadorResult.innerHTML = parseMarkdown(reply);
            otimizadorResult.style.display = 'block';
        }
        
        btnSendOtimizador.disabled = false;
        btnSendOtimizador.innerText = 'Analisar Novamente';
    });

    // === Diagnóstico de Invisibilidade Functionality ===
    const btnInvisibilidade = document.getElementById('btnInvisibilidade');
    const invisibilidadeTerm = document.getElementById('invisibilidadeTerm');
    const invisibilidadeLoc = document.getElementById('invisibilidadeLoc');
    const invisibilidadeResult = document.getElementById('invisibilidadeResult');
    const btnDownloadInvisibilidadeHtml = document.getElementById('btnDownloadInvisibilidadeHtml');
    const invisibilidadeDownloadArea = document.getElementById('invisibilidadeDownloadArea');

    let lastInvisibilidadeMarkdown = '';
    let lastInvisibilidadeCompany = '';

    btnInvisibilidade.addEventListener('click', async () => {
        const term = invisibilidadeTerm.value.trim();
        const loc = invisibilidadeLoc.value.trim();
        if (!term) return alert('Digite o nome da empresa ou palavra-chave!');

        btnInvisibilidade.disabled = true;
        btnInvisibilidade.innerText = 'Buscando e Gerando Laudo...';
        invisibilidadeResult.style.display = 'none';
        invisibilidadeDownloadArea.style.display = 'none';
        lastInvisibilidadeMarkdown = '';
        lastInvisibilidadeCompany = '';

        try {
            const response = await fetch('/api/invisibilidade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term: term, location: loc })
            });
            const data = await response.json();
            const reply = (data && data.reply) ? data.reply : '';

            if (reply) {
                lastInvisibilidadeMarkdown = reply;
                lastInvisibilidadeCompany = term;
                invisibilidadeResult.innerHTML = parseMarkdown(reply);
                invisibilidadeResult.style.display = 'block';
                invisibilidadeDownloadArea.style.display = 'block';
            } else {
                alert('Erro ao gerar laudo de invisibilidade.');
            }
        } catch (error) {
            console.error('Erro invisibilidade:', error);
            alert('Falha ao conectar ao servidor: ' + error.message);
        } finally {
            btnInvisibilidade.disabled = false;
            btnInvisibilidade.innerText = 'Gerar Novo Diagnóstico';
        }
    });

    btnDownloadInvisibilidadeHtml.addEventListener('click', () => {
        if (!lastInvisibilidadeMarkdown) return alert('Gere um diagnóstico primeiro!');

        const renderedContent = parseMarkdown(lastInvisibilidadeMarkdown);
        
        // Premium standalone HTML template with Kelevra Corp theme
        const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico de Invisibilidade Local - ${lastInvisibilidadeCompany}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
        
        :root {
            --color-bg: #050507;
            --color-bg-card: #0b0c10;
            --color-bg-surface: #12121a;
            --color-gold: #c9a84c;
            --color-gold-light: #e8c96b;
            --color-text: #e8e8f0;
            --color-text-muted: #8888aa;
            --color-border: rgba(201,168,76,0.18);
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--color-bg);
            color: var(--color-text);
            line-height: 1.6;
            padding: 60px 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: 30px;
        }
        
        .logo {
            font-family: 'Playfair Display', serif;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(135deg, var(--color-gold), var(--color-gold-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
            letter-spacing: -0.02em;
        }
        
        .subtitle {
            color: var(--color-text-muted);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-weight: 600;
        }
        
        .card {
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: 16px;
            padding: 50px 40px;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
            margin-bottom: 40px;
            backdrop-filter: blur(12px);
        }
        
        /* Markdown Renderer Styling */
        h1, h2, h3 {
            font-family: 'Playfair Display', serif;
            color: var(--color-gold);
            margin-top: 40px;
            margin-bottom: 20px;
            line-height: 1.2;
        }
        
        h1 { font-size: 2.2rem; border-bottom: 1px solid var(--color-border); padding-bottom: 12px; }
        h2 { font-size: 1.8rem; }
        h3 { font-size: 1.4rem; }
        
        p {
            margin-bottom: 24px;
            color: var(--color-text);
            font-size: 1.05rem;
            font-weight: 300;
        }
        
        ul, ol {
            margin-bottom: 24px;
            padding-left: 24px;
            color: var(--color-text);
        }
        
        li {
            margin-bottom: 12px;
            font-size: 1rem;
            font-weight: 300;
        }
        
        strong {
            color: var(--color-gold-light);
            font-weight: 600;
        }
        
        blockquote {
            border-left: 4px solid var(--color-gold);
            padding: 16px 24px;
            background: rgba(201, 168, 76, 0.05);
            margin-bottom: 24px;
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }
        
        .footer {
            text-align: center;
            color: var(--color-text-muted);
            font-size: 0.85rem;
            margin-top: 80px;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: 40px;
        }
        
        .footer a {
            color: var(--color-gold);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s;
        }
        
        .footer a:hover {
            color: var(--color-gold-light);
        }
        
        .text-gold-gradient {
            background: linear-gradient(135deg, var(--color-gold), var(--color-gold-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">|Kelevra corp.</div>
            <div class="subtitle">Laudo de Engenharia de Reputação</div>
        </header>
        
        <div class="card">
            ${renderedContent}
        </div>
        
        <footer class="footer">
            <p>Diagnóstico de Invisibilidade Local elaborado com exclusividade por <a href="https://wa.me/5561981849873" target="_blank">|Kelevra corp.</a></p>
            <p style="margin-top: 8px; font-size: 0.8rem; color: #555566;">&copy; 2026. Todos os direitos reservados.</p>
        </footer>
    </div>
</body>
</html>`;

        // Trigger browser file download
        const blob = new Blob([htmlTemplate], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filenameSafe = lastInvisibilidadeCompany.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.href = url;
        a.download = `Laudo_Invisibilidade_${filenameSafe}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // === Varredura Functionality ===
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
            if (event.data.startsWith('[[REPORT_DATA]]')) {
                const rawJson = event.data.replace('[[REPORT_DATA]]', '');
                try {
                    const dossieObj = JSON.parse(rawJson);
                    appendLog('\n✅ Dossiê Extraído com Sucesso!', 'success');
                    appendLog('Baixando automaticamente...', 'info');
                    
                    const blob = new Blob([dossieObj], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'Dossie_Portfolio.md';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch(e) {
                    appendLog('❌ Falha ao decodificar o laudo.', 'error');
                }
                eventSource.close();
                btnStartScan.disabled = false;
                btnStartScan.innerText = 'Varredura Concluída. Reiniciar?';
                passwordInput.disabled = false;
                return;
            }

            appendLog(event.data);
        };

        eventSource.onerror = function() {
            appendLog('❌ Conexão encerrada ou senha incorreta.', 'error');
            eventSource.close();
            btnStartScan.disabled = false;
            btnStartScan.innerText = 'Tentar Novamente';
            passwordInput.disabled = false;
        };
    });

    // === Task Manager ===
    let tasksArray = safeGetStorage('deboraTasks');
    const taskListContainer = document.getElementById('taskListContainer');

    function saveTasks() { safeSetStorage('deboraTasks', tasksArray); }

    function addTaskToManager(title, desc) {
        tasksArray.push({ id: Date.now(), title, desc, completed: false });
        saveTasks();
        if (document.getElementById('tab-tarefas').classList.contains('active')) renderTasks();
    }

    window.toggleTask = function(id) {
        const task = tasksArray.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        }
    };

    window.deleteTask = function(id) {
        tasksArray = tasksArray.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
    };

    function renderTasks() {
        taskListContainer.innerHTML = '';
        if (tasksArray.length === 0) {
            taskListContainer.innerHTML = '<li style="text-align:center; padding:30px; color:var(--text-secondary);">Nenhuma tarefa pendente. Você está em dia! 🎉</li>';
            return;
        }
        tasksArray.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item' + (task.completed ? ' completed' : '');
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""} onclick="toggleTask(${task.id})">
                <div class="task-content">
                    <h4 class="task-title">${task.title}</h4>
                    <p class="task-desc">${task.desc}</p>
                </div>
                <button class="task-delete" onclick="deleteTask(${task.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                </button>
            `;
            taskListContainer.appendChild(li);
        });
    }
});
