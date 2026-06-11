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
                
                if (!finalReply) {
                    throw new Error("Resposta vazia da Débora (Erro no servidor ou limite de requisições)");
                }

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
            
            // Remove a mensagem do usuário do histórico se a IA falhou, para que ele possa tentar novamente
            if (!isOtimizador && chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
                chatHistory.pop();
                safeSetStorage('deboraChatHistory', chatHistory);
            }
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
    const invisibilidadeDownloadArea = document.getElementById('invisibilidadeDownloadArea');
    const btnDownloadInvisibilidadeHtml = document.getElementById('btnDownloadInvisibilidadeHtml');

    let lastInvisibilidadeMarkdown = '';
    let lastInvisibilidadeCompany = '';

    btnInvisibilidade.addEventListener('click', async () => {
        const term = invisibilidadeTerm.value.trim();
        const loc = invisibilidadeLoc.value.trim();
        if (!term) return alert('Digite o nome da empresa ou palavra-chave!');

        btnInvisibilidade.disabled = true;
        btnInvisibilidade.innerText = 'Buscando e Gerando Laudo...';
        invisibilidadeResult.style.display = 'none';
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

    // === Download do Laudo Kelevra em HTML Premium ===
    btnDownloadInvisibilidadeHtml.addEventListener('click', () => {
        if (!lastInvisibilidadeMarkdown) return alert('Gere um diagnóstico primeiro!');

        const safeTitle = lastInvisibilidadeCompany.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const renderedContent = parseMarkdown(lastInvisibilidadeMarkdown);
        const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Diagnóstico de Invisibilidade Local – ${lastInvisibilidadeCompany} | Kelevra Corp</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #060608;
    --bg-card: #0d0d14;
    --bg-surface: #13131e;
    --gold: #c9a84c;
    --gold-light: #e8c96b;
    --gold-dim: rgba(201,168,76,0.15);
    --text: #e8e8f0;
    --text-muted: #888899;
    --border: rgba(201,168,76,0.2);
    --red: #ef4444;
    --yellow: #f59e0b;
    --green: #10b981;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    padding: 0;
    min-height: 100vh;
  }
  .watermark-bg {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg);
    font-family: 'Playfair Display', serif;
    font-size: 10rem; font-weight: 900; color: rgba(201,168,76,0.03);
    pointer-events: none; user-select: none; white-space: nowrap; z-index: 0;
  }
  .page { max-width: 820px; margin: 0 auto; padding: 60px 40px; position: relative; z-index: 1; }
  /* Header */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--border); padding-bottom: 32px; margin-bottom: 40px;
  }
  .logo {
    font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900;
    background: linear-gradient(135deg, var(--gold), var(--gold-light));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.02em;
  }
  .header-right { text-align: right; }
  .report-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-muted); margin-bottom: 4px; }
  .report-date { font-size: 0.85rem; color: var(--gold); font-weight: 600; }
  /* Hero Banner */
  .hero-banner {
    background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%);
    border: 1px solid var(--border); border-radius: 20px;
    padding: 40px; margin-bottom: 32px;
    position: relative; overflow: hidden;
  }
  .hero-banner::before {
    content: ''; position: absolute; top: -60px; right: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%);
    border-radius: 50%;
  }
  .hero-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--gold); font-weight: 700; margin-bottom: 12px; }
  .hero-company { font-size: 2rem; font-weight: 900; color: var(--text); margin-bottom: 8px; line-height: 1.2; }
  .hero-sub { color: var(--text-muted); font-size: 0.95rem; }
  /* Content card */
  .content-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 16px; padding: 40px; margin-bottom: 24px;
  }
  /* Markdown styles */
  h1,h2,h3,h4 { font-family: 'Inter', sans-serif; color: var(--text); margin: 24px 0 12px; line-height: 1.3; }
  h1 { font-size: 1.6rem; font-weight: 800; }
  h2 { font-size: 1.3rem; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  h3 { font-size: 1.1rem; font-weight: 600; color: var(--gold); }
  p { margin: 12px 0; color: var(--text); }
  ul, ol { margin: 12px 0 12px 24px; }
  li { margin: 6px 0; color: var(--text); }
  strong { color: var(--gold-light); font-weight: 700; }
  em { color: var(--text-muted); font-style: italic; }
  hr { border: none; border-top: 1px solid var(--border); margin: 28px 0; }
  code { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 4px; padding: 2px 6px; font-size: 0.85em; color: var(--gold); }
  blockquote {
    border-left: 3px solid var(--gold); padding-left: 16px;
    margin: 16px 0; color: var(--text-muted); font-style: italic;
  }
  /* Footer */
  .footer {
    border-top: 1px solid var(--border); padding-top: 32px; margin-top: 48px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .footer-logo { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--gold); }
  .footer-text { font-size: 0.75rem; color: var(--text-muted); text-align: right; line-height: 1.5; }
  .confidential {
    display: inline-block; margin-top: 16px;
    background: var(--gold-dim); border: 1px solid var(--border);
    border-radius: 6px; padding: 6px 14px;
    font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--gold); font-weight: 700;
  }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .watermark-bg { display: none; }
  }
</style>
</head>
<body>
<div class="watermark-bg">KELEVRA</div>
<div class="page">
  <div class="header">
    <div class="logo">KELEVRA CORP.</div>
    <div class="header-right">
      <div class="report-label">Diagnóstico Emitido em</div>
      <div class="report-date">${dataAtual}</div>
    </div>
  </div>

  <div class="hero-banner">
    <div class="hero-label">🔍 Diagnóstico de Invisibilidade Local</div>
    <div class="hero-company">${lastInvisibilidadeCompany}</div>
    <div class="hero-sub">Análise estratégica de presença digital no Google Maps e SEO Local</div>
    <div class="confidential">🔒 Documento Confidencial</div>
  </div>

  <div class="content-card">
    ${renderedContent}
  </div>

  <div class="footer">
    <div class="footer-logo">KELEVRA CORP.</div>
    <div class="footer-text">
      Engenharia de Reputação no Google<br>
      © ${new Date().getFullYear()} Kelevra Corp. Todos os direitos reservados.
    </div>
  </div>
</div>
</body>
</html>`;

        const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Kelevra_Diagnostico_${safeTitle}.html`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
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
