import { analisarPerfilGMB, gerarRespostaParaReview, sugerirPostagem, processarAuditoriaCSV, gerarRelatorioAuditoria, analisarCompeticao, gerarAuditoria360, auditarFotos, analisarGapPalavrasChave, inferirDadosDaEmpresa, gerarAuditoriaPortfolio } from './agent.js';
import { listarContas, listarLocais } from './api_gmb.js';
import { buscarEmpresaNoMaps, buscarConcorrentes, buscarRankingGeogrid, buscarFotosPorDataId, buscarDataIdPorKgmid } from './api_serp.js';
import { salvarAuditoriaNoNotion } from './api_notion.js';
import { expandShortLink, downloadImages } from './utils_media.js';
import * as readline from 'readline';
import fs from 'fs';
import path from 'path';
import os from 'os';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const menu = `
--- GMB Claw - Agente de Reestruturação ---
Escolha uma opção:
1. Analisar Perfil GMB (Simulado)
2. Responder a uma Avaliação (Simulado)
3. Sugerir Postagem
4. Listar Contas do Google (API Oficial)
5. Auditoria Master 360 (CSV + Geogrid + Gap + Visual)
6. Auditoria Master 360 LOTE (Portfólio Completo)
7. Sair
-------------------------------------------
Opção: `;

async function executarAuditoria360Completa(businessName, dataId = null) {
    try {
        console.log(`\n✅ Empresa alvo: ${businessName}`);
        if (dataId) console.log(`🎯 data_id: ${dataId}`);
        console.log("\n📡 Puxando dados completos da SerpApi...");
        
        const resultadosEmpresa = await buscarEmpresaNoMaps(businessName, '');
        const empresaSerp = resultadosEmpresa[0];
        
        if (!empresaSerp) {
            console.log("❌ Falha ao encontrar os dados completos da empresa na SerpApi.");
            return null;
        }

        console.log("✅ Dados capturados com sucesso!");
        
        // Download de Fotos via data_id ou fallback
        let laudoVisual = "";
        let totalFotos = 0;
        let photosUrls = [];

        if (dataId) {
            console.log(`\n📸 Buscando galeria completa via data_id...`);
            photosUrls = await buscarFotosPorDataId(dataId);
        } else if (empresaSerp.photos && empresaSerp.photos.length > 0) {
            console.log(`\n📸 data_id ausente. Usando fotos da vitrine geral...`);
            photosUrls = empresaSerp.photos.map(p => p.image || p.link).filter(Boolean);
        }

        if (photosUrls.length > 0) {
            totalFotos = photosUrls.length;
            console.log(`📥 ${totalFotos} fotos encontradas. Iniciando download...`);
            const savedFolder = await downloadImages(photosUrls, businessName);
            
            if (savedFolder) {
                const arquivos = fs.readdirSync(savedFolder)
                    .filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png'))
                    .map(f => path.join(savedFolder, f));
                
                if (arquivos.length > 0) {
                    console.log(`🤖 Auditoria Visual: Analisando com Gemini Vision...`);
                    laudoVisual = await auditarFotos(arquivos.slice(0, 5));
                }
            }
        } else {
            console.log("⚠️ Nenhuma foto encontrada na vitrine da API.");
        }

        // Inferência com IA
        console.log("\n🧠 Agente realizando inferência de Nicho e Palavras-Chave...");
        const configIA = await inferirDadosDaEmpresa(empresaSerp);
        const categoria = configIA.nicho || empresaSerp.type || "Negócio Local";
        const local = configIA.regiao || "Região";
        const palavraChaveGrid = configIA.palavraChaveGrid || businessName;
        
        console.log(`🎯 Nicho deduzido: ${categoria}`);
        console.log(`📍 Região deduzida: ${local}`);
        console.log(`🔑 Palavra-chave Estratégica: ${palavraChaveGrid}`);

        // Busca Concorrentes
        const ll = empresaSerp.gps_coordinates || null;
        if (ll) {
            console.log(`🛰️ Radar de Proximidade ativado: Centralizando em ${ll.latitude}, ${ll.longitude}`);
        }

        const todosConcorrentes = await buscarConcorrentes(categoria, local, ll);
        const concorrentes = todosConcorrentes.filter(c => c.title !== empresaSerp.title).slice(0, 3);
        console.log(`✅ Dados de ${concorrentes.length} concorrentes capturados.`);

        // Dados simulados do antigo CSV
        const dadosSimuladosCSV = {
            "Business name": empresaSerp.title || businessName,
            "Google star rating": empresaSerp.rating || 0,
            "Review count": empresaSerp.reviews || 0,
            "Review photos count": totalFotos,
            "Category": categoria
        };

        // Relatório Master
        console.log("\n🧠 Agente 360 está gerando o plano de dominação total...");
        const relatorio360 = await gerarAuditoria360(dadosSimuladosCSV, empresaSerp, concorrentes);

        // Geogrid e Gap
        let geogridData = null;
        let laudoGap = "";
        
        if (ll && palavraChaveGrid) {
            console.log(`\n🛰️ Iniciando simulação Geogrid (Raio 1.4km) para "${palavraChaveGrid}"...`);
            geogridData = await buscarRankingGeogrid(palavraChaveGrid, businessName, ll.latitude, ll.longitude, 1.41, 3);
            
            console.log("\n🧠 Agente Vendedor: Gerando Laudo de Gap de Palavras-Chave...");
            const dadosFicha = {
                nome: empresaSerp.title,
                categoria: categoria,
                servicos_visiveis_no_maps: empresaSerp.type || "Não especificado",
                descricao: empresaSerp.description || "Sem descrição",
            };
            laudoGap = await analisarGapPalavrasChave(categoria, dadosFicha);
        }

        // Dashboard
        console.log("\n🎨 Gerando Dashboard Visual Premium 360...");
        const { gerarDashboardHTML } = await import('./renderer.js');
        const dashboardPath = gerarDashboardHTML(dadosSimuladosCSV, relatorio360, laudoGap, geogridData, laudoVisual);
        
        console.log(`✅ Dashboard gerado com sucesso!`);
        console.log(`📍 Local: ${dashboardPath}`);
        
        try {
            const { exec } = await import('child_process');
            if (process.platform === 'win32') {
                const winPath = dashboardPath.replace(/\//g, '\\');
                exec(`start "" "${winPath}"`);
            } else if (process.platform === 'darwin') {
                exec(`open "${dashboardPath}"`);
            } else {
                exec(`xdg-open "${dashboardPath}"`);
            }
        } catch (e) { console.log('Aviso: não foi possível abrir o navegador automaticamente.'); }

        // Notion
        console.log("\n🚀 Enviando dados para o Notion...");
        const notionId = await salvarAuditoriaNoNotion(dadosSimuladosCSV, relatorio360);
        if (notionId) {
            console.log(`✅ Lead criado no Notion: https://notion.so/${notionId.replace(/-/g, '')}`);
        }
        
        return { dadosSimuladosCSV, relatorio360, dashboardPath };
    } catch (err) {
        console.error(`\n❌ Erro crítico na Auditoria Autónoma para ${businessName}:`, err.message);
        return null;
    }
}

async function main() {
    console.log("Inicializando GMB Claw... 🦀");
    
    const showMenu = () => {
        rl.question(menu, async (opcao) => {
            try {
                if (opcao === '1') {
                    console.log("\n[!] Como ainda não conectamos a API do Google, vamos coletar os dados manualmente.");
                    rl.question("Nome da Empresa: ", (nome) => {
                        rl.question("Categoria Principal (ex: Conserto de Eletrodomésticos): ", (categoria) => {
                            rl.question("Nota média atual (ex: 4.8): ", async (nota) => {
                                const dadosTeste = {
                                    nome: nome,
                                    categoria: categoria,
                                    descricao: "Sem descrição ou descrição padrão.",
                                    nota_media: parseFloat(nota) || 5.0,
                                    total_avaliacoes: 10
                                };
                                console.log("\nAuditoria iniciada. O agente está pensando (isso pode levar alguns segundos)...");
                                const resultado = await analisarPerfilGMB(dadosTeste);
                                console.log("\n--- LAUDO GERADO ---");
                                console.log(resultado);
                                console.log("----------------------------\n");
                                showMenu();
                            });
                        });
                    });
                    return;
                } 
                else if (opcao === '2') {
                    rl.question("Digite a nota (1 a 5): ", (nota) => {
                        rl.question("Digite o texto da avaliação: ", async (texto) => {
                            console.log("Gerando resposta...");
                            const resultado = await gerarRespostaParaReview(texto, nota);
                            console.log("\n--- SUGESTÃO DE RESPOSTA ---");
                            console.log(resultado);
                            console.log("----------------------------\n");
                            showMenu();
                        });
                    });
                    return; // Retorna para não chamar showMenu() imediatamente
                }
                else if (opcao === '3') {
                    rl.question("Digite o nicho da empresa (ex: Clínica Odontológica): ", async (nicho) => {
                        console.log("Gerando sugestão de postagem...");
                        const resultado = await sugerirPostagem(nicho);
                        console.log("\n--- SUGESTÃO DE POSTAGEM ---");
                        console.log(resultado);
                        console.log("----------------------------\n");
                        showMenu();
                    });
                    return;
                }
                else if (opcao === '4') {
                    console.log("Conectando à API do Google...");
                    const contas = await listarContas();
                    if (contas.length === 0) {
                        console.log("Nenhuma conta encontrada ou tokens não configurados.");
                        console.log("⚠️ Lembre-se de rodar 'node auth.js' primeiro!");
                    } else {
                        console.log("\n--- CONTAS DO GOOGLE ENCONTRADAS ---");
                        for (let i = 0; i < contas.length; i++) {
                            console.log(`${i+1}. ${contas[i].accountName} (ID: ${contas[i].name})`);
                            console.log(`Buscando locais para a conta ${contas[i].name}...`);
                            const locais = await listarLocais(contas[i].name);
                            if (locais.length > 0) {
                                locais.forEach(l => console.log(`   - 📍 Local: ${l.title} (ID: ${l.name})`));
                            } else {
                                console.log(`   - Nenhum local encontrado para esta conta.`);
                            }
                        }
                        console.log("------------------------------------\n");
                    }
                    showMenu();
                    return;
                }
                else if (opcao === '5') {
                    console.log("\n--- Iniciando Auditoria 360 Autónoma (Link do Maps) ---");
                    
                    rl.question("🔗 Cole o Link de Compartilhamento do Google Maps (ex: https://maps.app.goo.gl/...): ", async (shortUrl) => {
                        try {
                            console.log("\n🔍 Expandindo URL e rastreando ficha no Google...");
                            const { nomeEmpresa: businessName, dataId: parsedDataId, kgmid } = await expandShortLink(shortUrl);
                            
                            let dataId = parsedDataId;
                            if (!dataId && kgmid) {
                                console.log("🔍 Link share.google detectado. Resolvendo galeria oculta via Knowledge Graph...");
                                dataId = await buscarDataIdPorKgmid(businessName, kgmid);
                            }
                            
                            if (!businessName) {
                                console.log("❌ Não foi possível extrair o nome da empresa a partir deste link.");
                                showMenu();
                                return;
                            }
                            
                            await executarAuditoria360Completa(businessName, dataId);

                        } catch (err) {
                            console.error("\n❌ Erro crítico na extração do link:", err.message);
                        }
                        
                        showMenu();
                    });
                    
                    return;
                }
                else if (opcao === '6') {
                    console.log("\n--- Master Audit: Auditoria de Portfólio (Opção 6) ---");
                    console.log("⚠️ AVISO: Isso pode demorar alguns minutos dependendo da quantidade de fichas.");
                    
                    try {
                        const { listarContas, listarLocais, obterDetalhesLocal } = await import('./api_gmb.js');
                        
                        console.log("Buscando contas GMB...");
                        const contas = await listarContas();
                        if (contas.length === 0) {
                            console.log("Nenhuma conta encontrada. Verifique sua autenticação.");
                            showMenu();
                            return;
                        }
                        
                        let portfolioCompleto = [];
                        
                        for (const conta of contas) {
                            console.log(`\n📂 Analisando conta: ${conta.accountName}`);
                            const locais = await listarLocais(conta.name);
                            
                            if (locais.length === 0) {
                                console.log("   └ Nenhum local encontrado nesta conta.");
                                continue;
                            }
                            
                            console.log(`   └ ${locais.length} locais encontrados. Extraindo detalhes...`);
                            
                            for (const local of locais) {
                                const detalhes = await obterDetalhesLocal(local.name);
                                if (detalhes && detalhes.title) {
                                    console.log(`\n======================================================`);
                                    console.log(`🚀 INICIANDO AUDITORIA 360 PARA: ${detalhes.title}`);
                                    console.log(`======================================================`);
                                    
                                    await executarAuditoria360Completa(detalhes.title, null);
                                    
                                    if (detalhes.profile) {
                                        portfolioCompleto.push({
                                            conta: conta.accountName,
                                            nome: detalhes.title,
                                            rating: detalhes.profile.profileMetrics ? detalhes.profile.profileMetrics.reviewRating : "N/A",
                                            reviewsCount: detalhes.profile.profileMetrics ? detalhes.profile.profileMetrics.reviewCount : 0,
                                            categorias: detalhes.categories ? (detalhes.categories.primaryCategory ? detalhes.categories.primaryCategory.displayName : "N/A") : "N/A",
                                            website: detalhes.profile.websiteUri ? "Sim" : "Não",
                                            telefone: detalhes.profile.primaryPhone ? "Sim" : "Não"
                                        });
                                    }
                                }
                            }
                        }
                        
                        if (portfolioCompleto.length === 0) {
                            console.log("\n❌ Nenhum local com dados de perfil foi encontrado.");
                            showMenu();
                            return;
                        }
                        
                        console.log(`\n✅ Extração concluída. Total de ${portfolioCompleto.length} fichas mapeadas.`);
                        console.log("🧠 Agente Estrategista da Kelevra gerando o Dossiê Executivo de Portfólio...");
                        
                        const dossie = await gerarAuditoriaPortfolio(portfolioCompleto);
                        
                        const relatorioPath = path.join(process.cwd(), `Auditoria_Portfolio_${Date.now()}.md`);
                        fs.writeFileSync(relatorioPath, dossie);
                        console.log(`\n✅ Laudo de Portfólio gerado com sucesso!`);
                        console.log(`📍 Salvo em: ${relatorioPath}`);
                        
                        // Tentar abrir o arquivo Markdown no editor padrão
                        try {
                            const { exec } = await import('child_process');
                            if (process.platform === 'win32') {
                                exec(`start "" "${relatorioPath}"`);
                            } else if (process.platform === 'darwin') {
                                exec(`open "${relatorioPath}"`);
                            } else {
                                exec(`xdg-open "${relatorioPath}"`);
                            }
                        } catch (e) {
                            console.log("Não foi possível abrir o arquivo automaticamente.");
                        }

                    } catch (err) {
                        console.error("\n❌ Erro durante a Auditoria de Portfólio:", err.message);
                    }
                    
                    showMenu();
                    return;
                }
                else if (opcao === '7') {
                    console.log("Saindo do GMB Claw. Até mais!");
                    rl.close();
                    process.exit(0);
                } else {
                    console.log("Opção inválida.");
                }
            } catch (error) {
                console.error("Erro na execução da opção:", error.message);
                if (error.message.includes('API_KEY')) {
                    console.log("⚠️ Lembre-se de configurar a GEMINI_API_KEY no arquivo .env!");
                }
            }
            
            showMenu();
        });
    };

    showMenu();
}

main();
