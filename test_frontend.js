
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
        
