import { listarContas, listarLocais, obterDetalhesLocal } from './api_gmb.js';
import { buscarEmpresaNoMaps, buscarConcorrentes, buscarRankingGeogrid, buscarFotosPorDataId } from './api_serp.js';
import { inferirDadosDaEmpresa, analisarGapPalavrasChave, gerarAuditoria360, auditarFotos, gerarAuditoriaPortfolio } from './agent.js';
import { salvarAuditoriaNoNotion } from './api_notion.js';
import { downloadImages } from './utils_media.js';
import { gerarDashboardHTML } from './renderer.js';
import fs from 'fs';
import path from 'path';

export async function executarAuditoria360Completa(businessName, dataId = null, log = console.log, locationQuery = '') {
    try {
        log(`\n✅ Empresa alvo: ${businessName}`);
        if (dataId) log(`🎯 data_id: ${dataId}`);
        if (locationQuery) log(`🗺️ Localização identificada: ${locationQuery}`);
        log("📡 Puxando dados completos da SerpApi...");
        
        const resultadosEmpresa = await buscarEmpresaNoMaps(businessName, locationQuery);
        const empresaSerp = resultadosEmpresa[0];
        
        if (!empresaSerp) {
            log("❌ Falha ao encontrar os dados completos da empresa na SerpApi.");
            return null;
        }

        log("✅ Dados capturados com sucesso!");
        
        let laudoVisual = "";
        let totalFotos = 0;
        let photosUrls = [];

        if (dataId) {
            log(`📸 Buscando galeria completa via data_id...`);
            photosUrls = await buscarFotosPorDataId(dataId);
        } else if (empresaSerp.photos && empresaSerp.photos.length > 0) {
            log(`📸 data_id ausente. Usando fotos da vitrine geral...`);
            photosUrls = empresaSerp.photos.map(p => p.image || p.link).filter(Boolean);
        }

        if (photosUrls.length > 0) {
            totalFotos = photosUrls.length;
            log(`📥 ${totalFotos} fotos encontradas. Iniciando download...`);
            const savedFolder = await downloadImages(photosUrls, businessName);
            
            if (savedFolder) {
                const arquivos = fs.readdirSync(savedFolder)
                    .filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.png'))
                    .map(f => path.join(savedFolder, f));
                
                if (arquivos.length > 0) {
                    log(`🤖 Auditoria Visual: Analisando com Gemini Vision...`);
                    laudoVisual = await auditarFotos(arquivos.slice(0, 5));
                }
            }
        } else {
            log("⚠️ Nenhuma foto encontrada na vitrine da API.");
        }

        log("🧠 Agente realizando inferência de Nicho e Palavras-Chave...");
        const configIA = await inferirDadosDaEmpresa(empresaSerp);
        const categoria = configIA.nicho || empresaSerp.type || "Negócio Local";
        const local = configIA.regiao || "Região";
        const palavraChaveGrid = configIA.palavraChaveGrid || businessName;
        
        log(`🎯 Nicho deduzido: ${categoria} | Região: ${local} | Estratégia: ${palavraChaveGrid}`);

        const ll = empresaSerp.gps_coordinates || null;
        if (ll) log(`🛰️ Radar ativado: Centralizando em ${ll.latitude}, ${ll.longitude}`);

        const todosConcorrentes = await buscarConcorrentes(categoria, local, ll);
        const concorrentes = todosConcorrentes.filter(c => c.title !== empresaSerp.title).slice(0, 3);
        log(`✅ Dados de ${concorrentes.length} concorrentes capturados.`);

        const dadosSimuladosCSV = {
            "Business name": empresaSerp.title || businessName,
            "Google star rating": empresaSerp.rating || 0,
            "Review count": empresaSerp.reviews || 0,
            "Review photos count": totalFotos,
            "Category": categoria
        };

        log("🧠 Agente 360 está gerando o plano de dominação total...");
        const relatorio360 = await gerarAuditoria360(dadosSimuladosCSV, empresaSerp, concorrentes);

        let geogridData = null;
        let laudoGap = "";
        
        if (ll && palavraChaveGrid) {
            log(`🛰️ Iniciando simulação Geogrid (Raio 1.4km) para "${palavraChaveGrid}"...`);
            geogridData = await buscarRankingGeogrid(palavraChaveGrid, businessName, ll.latitude, ll.longitude, 1.41, 3);
            
            log("🧠 Agente Vendedor: Gerando Laudo de Gap de Palavras-Chave...");
            laudoGap = await analisarGapPalavrasChave(categoria, {
                nome: empresaSerp.title,
                categoria: categoria,
                servicos_visiveis_no_maps: empresaSerp.type || "Não",
                descricao: empresaSerp.description || "Sem descrição"
            });
        }

        log("🎨 Gerando Dashboard Visual Premium 360...");
        const dashboardPath = gerarDashboardHTML(dadosSimuladosCSV, relatorio360, laudoGap, geogridData, laudoVisual);
        
        log(`✅ Dashboard gerado com sucesso em: ${dashboardPath}`);

        log("🚀 Enviando dados para o Notion...");
        const notionId = await salvarAuditoriaNoNotion(dadosSimuladosCSV, relatorio360);
        if (notionId) log(`✅ Lead criado no Notion: https://notion.so/${notionId.replace(/-/g, '')}`);
        
        return { dadosSimuladosCSV, relatorio360, dashboardPath };
    } catch (err) {
        log(`❌ Erro crítico para ${businessName}: ${err.message}`);
        return null;
    }
}

export async function executarAuditoriaLote(log = console.log) {
    try {
        log("🔄 Buscando contas GMB vinculadas...");
        const contas = await listarContas();
        if (contas.length === 0) {
            log("❌ Nenhuma conta encontrada. Verifique sua autenticação.");
            return;
        }
        
        let portfolioCompleto = [];
        
        for (const conta of contas) {
            log(`\n📂 Analisando conta: ${conta.accountName}`);
            const locais = await listarLocais(conta.name);
            
            if (locais.length === 0) {
                log("   └ Nenhum local encontrado nesta conta.");
                continue;
            }
            
            log(`   └ ${locais.length} locais encontrados. Extraindo detalhes...`);
            
            for (const local of locais) {
                const detalhes = await obterDetalhesLocal(local.name);
                if (detalhes && detalhes.title) {
                    log(`\n======================================================`);
                    log(`🚀 INICIANDO AUDITORIA 360 PARA: ${detalhes.title}`);
                    log(`======================================================`);
                    
                    let localQuery = '';
                    if (detalhes.storefrontAddress) {
                        const addr = detalhes.storefrontAddress;
                        localQuery = `${addr.locality || ''} ${addr.administrativeArea || ''}`.trim();
                    }
                    
                    await executarAuditoria360Completa(detalhes.title, null, log, localQuery);
                    
                    if (detalhes.profile) {
                        portfolioCompleto.push({
                            conta: conta.accountName,
                            nome: detalhes.title,
                            rating: detalhes.profile.profileMetrics ? detalhes.profile.profileMetrics.reviewRating : "N/A",
                            reviewsCount: detalhes.profile.profileMetrics ? detalhes.profile.profileMetrics.reviewCount : 0,
                            categorias: detalhes.categories && detalhes.categories.primaryCategory ? detalhes.categories.primaryCategory.displayName : "N/A",
                            website: detalhes.profile.websiteUri ? "Sim" : "Não",
                            telefone: detalhes.profile.primaryPhone ? "Sim" : "Não"
                        });
                    }
                }
            }
        }
        
        if (portfolioCompleto.length === 0) {
            log("\n❌ Nenhum local com dados de perfil foi encontrado.");
            return;
        }
        
        log(`\n✅ Extração concluída. Total de ${portfolioCompleto.length} fichas mapeadas.`);
        log("🧠 Agente Estrategista da Kelevra gerando o Dossiê Executivo de Portfólio...");
        
        const dossie = await gerarAuditoriaPortfolio(portfolioCompleto);
        const relatorioPath = path.join(process.cwd(), `Auditoria_Portfolio_${Date.now()}.md`);
        fs.writeFileSync(relatorioPath, dossie);
        
        log(`\n✅ Laudo de Portfólio gerado com sucesso!`);
        log(`📍 Salvo em: ${relatorioPath}`);
        log(`🎉 Auditoria de Lote Finalizada!`);
        return dossie;
    } catch (err) {
        log(`\n❌ Erro durante a Auditoria de Portfólio: ${err.message}`);
    }
}
