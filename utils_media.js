import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Expande um link curto do Google Maps e extrai o nome do lugar e o data_id.
 * Suporta tanto o formato antigo (maps.app.goo.gl) quanto o novo (share.google).
 * @param {string} shortUrl Link curto
 * @returns {Promise<{nomeEmpresa: string|null, dataId: string|null}>}
 */
export async function expandShortLink(shortUrl) {
    try {
        const res = await axios.get(shortUrl, { maxRedirects: 10 });
        const finalUrl = res.request.res.responseUrl;

        let nomeEmpresa = null;
        let dataId = null;
        let kgmid = null;

        // === FORMATO NOVO: share.google → google.com/search?q=...&kgmid=... ===
        if (finalUrl.includes('google.com/search')) {
            const urlObj = new URL(finalUrl);

            // Extrai o nome do parâmetro q=
            const q = urlObj.searchParams.get('q');
            if (q) {
                // Não usamos split(',') aqui porque o parâmetro q= normalmente contém APENAS 
                // o nome exato da empresa, e algumas empresas têm vírgula no nome oficial.
                nomeEmpresa = q.trim();
            }

            // Extrai kgmid como identificador alternativo (não é data_id do Maps, mas é único)
            kgmid = urlObj.searchParams.get('kgmid');
            // Para o kgmid, precisamos fazer uma busca na SerpApi com o nome,
            // então apenas retornamos o dataId como null e deixamos a busca por nome funcionar.
            dataId = null;

        // === FORMATO ANTIGO: google.com/maps/place/... ===
        } else if (finalUrl.includes('/maps/place/')) {
            const matchNome = finalUrl.match(/\/place\/([^\/]+)\//);
            if (matchNome) {
                nomeEmpresa = decodeURIComponent(matchNome[1].replace(/\+/g, ' '));
                // Limpa o nome: pega somente antes da primeira vírgula (endereço)
                if (nomeEmpresa.includes(',')) {
                    nomeEmpresa = nomeEmpresa.split(',')[0].trim();
                }
            }

            // Extrai data_id do bloco de dados da URL: !1s0x...:0x...
            const matchId = finalUrl.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
            dataId = matchId ? matchId[1] : null;
        }

        return { nomeEmpresa, dataId, kgmid };

    } catch (error) {
        console.error("Erro ao expandir link curto:", error.message);
        return { nomeEmpresa: null, dataId: null, kgmid: null };
    }
}

/**
 * Faz o download das imagens contidas na lista retornada pela SerpApi
 * @param {string[]} imageUrls Array de links de imagens
 * @param {string} businessName Nome da empresa para criar a pasta
 * @returns {Promise<string>} Caminho da pasta onde as fotos foram salvas
 */
export async function downloadImages(imageUrls, businessName) {
    if (!imageUrls || imageUrls.length === 0) return null;

    // Criar diretório Documents/Auditorias GMB/[Empresa]
    const docsPath = path.join(os.homedir(), 'Documents');
    const auditoriasPath = path.join(docsPath, 'Auditorias GMB');
    
    // Sanitiza o nome da empresa para ser um nome de pasta válido
    const safeName = businessName.replace(/[<>:"/\\|?*]+/g, '').trim();
    const targetFolder = path.join(auditoriasPath, safeName);

    if (!fs.existsSync(auditoriasPath)) {
        fs.mkdirSync(auditoriasPath, { recursive: true });
    }
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }

    console.log(`\n📥 Baixando ${imageUrls.length} imagens para: ${targetFolder}`);

    let count = 0;
    for (let i = 0; i < imageUrls.length; i++) {
        try {
            const url = imageUrls[i];
            // Se for url do google sem extensão, salvamos como .jpg
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream'
            });

            const filePath = path.join(targetFolder, `foto_${i + 1}.jpg`);
            const writer = fs.createWriteStream(filePath);

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            count++;
        } catch (error) {
            console.error(`Erro ao baixar a imagem ${i + 1}:`, error.message);
        }
    }

    console.log(`✅ Download concluído. ${count} fotos salvas com sucesso.`);
    return targetFolder;
}
