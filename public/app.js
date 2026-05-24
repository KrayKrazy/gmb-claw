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
