import axios from 'axios';
import { config } from './config.js';

let currentKeyIndex = 0;

function getApiKey() {
    const keys = config.serpApiKeys;
    if (!keys || keys.length === 0) return '';
    const key = keys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return key;
}
const BASE_URL = 'https://serpapi.com/search';

async function fetchSerpApi(params) {
    const keys = config.serpApiKeys;
    if (!keys || keys.length === 0) throw new Error("Nenhuma chave SerpApi configurada.");
    
    let attempts = 0;
    while (attempts < keys.length) {
        try {
            params.api_key = getApiKey();
            const response = await axios.get(BASE_URL, { params });
            return response;
        } catch (error) {
            const isRateLimit = error.response && (error.response.status === 429 || error.response.status === 403 || (error.response.data && error.response.data.error && error.response.data.error.includes('run out of searches')));
            if (isRateLimit) {
                attempts++;
                if (attempts >= keys.length) {
                    throw new Error("Todas as chaves da SerpApi esgotaram ou estão com Rate Limit (429).");
                }
                console.warn(`[SerpApi] Chave esgotada (429). Tentando próxima chave...`);
            } else {
                throw error;
            }
        }
    }
}


/**
 * Busca detalhes de uma empresa específica no Google Maps via SerpApi.
 */
export async function buscarEmpresaNoMaps(q, location = '') {
    try {
        const queryFinal = location ? `${q} ${location}` : q;
        const response = await fetchSerpApi({
            engine: 'google_maps',
            q: queryFinal,
            hl: 'pt-br'
        });

        // Se for uma busca direta, a SerpApi retorna place_results com detalhes completos e fotos
        if (response.data.place_results) {
            return [response.data.place_results];
        }

        // Retorna a lista de resultados locais caso place_results não esteja disponível
        return response.data.local_results || [];
    } catch (error) {
        console.error("Erro ao buscar empresa na SerpApi:", error.message);
        return [];
    }
}

/**
 * Busca concorrentes de uma categoria em uma localização específica.
 */
export async function buscarConcorrentes(categoria, localizacao, ll = null) {
    try {
        const queryFinal = localizacao ? `${categoria} em ${localizacao}` : categoria;
        const params = {
            engine: 'google_maps',
            q: queryFinal,
            hl: 'pt-br'
        };

        if (ll) {
            params.ll = `@${ll.latitude},${ll.longitude},14z`; // 14z é um zoom aproximado de 5km
        }

        const response = await fetchSerpApi(params);
        return response.data.local_results || [];
    } catch (error) {
        console.error("Erro ao buscar concorrentes na SerpApi:", error.message);
        return [];
    }
}

/**
 * Realiza uma busca orgânica para ver o "Share of Voice" da marca.
 */
export async function buscarOrganicSOV(q, location = '') {
    try {
        const queryFinal = location ? `${q} ${location}` : q;
        const response = await fetchSerpApi({
            engine: 'google',
            q: queryFinal,
            hl: 'pt-br'
        });

        return {
            organic: response.data.organic_results || [],
            knowledge_graph: response.data.knowledge_graph || null,
            local_results: response.data.local_results || []
        };
    } catch (error) {
        console.error("Erro ao buscar resultados orgânicos na SerpApi:", error.message);
        return null;
    }
}

/**
 * Gera uma malha (grid) de coordenadas ao redor de um ponto central.
 * @param {number} lat Latitude central
 * @param {number} lng Longitude central
 * @param {number} raioKm Raio total da malha (ex: 1.41 para cobrir ~8km2 com 3x3)
 * @param {number} tamanho Grid size (ex: 3 para malha 3x3)
 */
export function gerarGridCoordenadas(lat, lng, raioKm = 1.41, tamanho = 3) {
    const coords = [];
    const offsetCount = Math.floor(tamanho / 2); 
    const step = offsetCount === 0 ? 0 : raioKm / offsetCount; // Distância entre os pontos
    
    // 1 grau de latitude é aprox 111.32 km
    const latStep = step / 111.32;
    // 1 grau de longitude varia com a latitude
    const lngStep = step / (111.32 * Math.cos(lat * (Math.PI / 180)));

    for (let i = offsetCount; i >= -offsetCount; i--) { // N to S
        for (let j = -offsetCount; j <= offsetCount; j++) { // W to E
            coords.push({
                lat: lat + (i * latStep),
                lng: lng + (j * lngStep),
                row: offsetCount - i,
                col: j + offsetCount
            });
        }
    }
    return coords;
}

/**
 * Realiza buscas em malha (Geogrid) para identificar o ranking de uma empresa.
 */
export async function buscarRankingGeogrid(palavraChave, nomeEmpresaAlvo, lat, lng, raioKm = 1.41, tamanho = 3) {
    const grid = gerarGridCoordenadas(lat, lng, raioKm, tamanho);
    const resultadosGrid = [];

    console.log(`[Geogrid] Iniciando rastreamento de ${tamanho}x${tamanho} (${grid.length} pontos) para "${palavraChave}"...`);

    // Usando requisições sequenciais com delay para evitar Rate Limiting
    for (const ponto of grid) {
        try {
            const params = {
                engine: 'google_maps',
                q: palavraChave,
                ll: `@${ponto.lat},${ponto.lng},15z`,
                hl: 'pt-br'
            };
            
            const response = await fetchSerpApi(params);
            const locais = response.data.local_results || [];
            
            // Procura a empresa alvo nos resultados
            const posicao = locais.findIndex(l => l.title.toLowerCase().includes(nomeEmpresaAlvo.toLowerCase()));
            
            resultadosGrid.push({
                ...ponto,
                rank: posicao !== -1 ? posicao + 1 : '20+' // Se não encontrou nos 20 primeiros
            });
            
            // Delay de 1 segundo para evitar limite de concorrência na SerpApi
            await new Promise(res => setTimeout(res, 1000));
        } catch (error) {
            console.error(`Erro ao buscar ponto lat:${ponto.lat} lng:${ponto.lng}:`, error.message);
            resultadosGrid.push({ ...ponto, rank: 'Erro' });
        }
    }

    return resultadosGrid;
}

/**
 * Busca as fotos de um lugar no Google Maps usando o data_id via SerpApi.
 * @param {string} dataId O data_id extraído da URL do Google Maps (ex: 0x935a...:0xb41...)
 * @returns {Promise<string[]>} Array de URLs de imagens
 */
export async function buscarFotosPorDataId(dataId) {
    try {
        const response = await fetchSerpApi({
            engine: 'google_maps_photos',
            data_id: dataId,
            hl: 'pt-br'
        });

        const photos = response.data.photos || [];
        return photos.map(p => p.image || p.thumbnail).filter(Boolean);
    } catch (error) {
        console.error("Erro ao buscar fotos via data_id:", error.message);
        return [];
    }
}

/**
 * Busca o data_id de um local usando o Knowledge Graph ID (kgmid).
 * Isso resolve a limitação dos links share.google que não expõem o data_id diretamente.
 */
export async function buscarDataIdPorKgmid(nomeEmpresa, kgmid) {
    try {
        const response = await fetchSerpApi({
            engine: 'google',
            q: nomeEmpresa,
            kgmid: kgmid,
            hl: 'pt-br'
        });
        
        const link = response.data.knowledge_graph?.local_map?.link;
        if (link) {
            const matchId = link.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i);
            return matchId ? matchId[1] : null;
        }
        return null;
    } catch (error) {
        console.error("Erro ao resolver kgmid para data_id:", error.message);
        return null;
    }
}
