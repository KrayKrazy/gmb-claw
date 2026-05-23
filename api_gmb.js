import { google } from 'googleapis';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(process.cwd(), 'tokens.json');

// Inicializa o cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret
);

// Tenta carregar tokens salvos
try {
    if (fs.existsSync(TOKEN_PATH)) {
        const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        oauth2Client.setCredentials(tokens);
    }
} catch (error) {
    console.error("Aviso: Não foi possível carregar os tokens OAuth2. Rode o 'node auth.js' primeiro.");
}

// Event Listener para renovação automática de tokens (Refresh Token)
oauth2Client.on('tokens', (tokens) => {
    try {
        if (tokens.refresh_token) {
            // Se o Google enviou um novo refresh_token, salve-o (geralmente isso só ocorre na primeira vez ou se for forçado)
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
            console.log("\n[GMB API] Tokens renovados e salvos com sucesso.");
        } else {
            // Se enviou apenas um novo access_token, devemos mesclá-lo com o refresh_token antigo para não perdê-lo
            const currentTokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
            const updatedTokens = { ...currentTokens, ...tokens };
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedTokens, null, 2));
            console.log("\n[GMB API] Access Token renovado com sucesso.");
        }
    } catch (e) {
        console.error("Erro ao salvar novos tokens:", e);
    }
});

// Configuração base da API GMB (O Google My Business API usa a URL base específica e requer descoberta da API MyBusinessBusinessInformation)
const mybusinessaccountmanagement = google.mybusinessaccountmanagement({
    version: 'v1',
    auth: oauth2Client
});

const mybusinessbusinessinformation = google.mybusinessbusinessinformation({
    version: 'v1',
    auth: oauth2Client
});

const businessprofileperformance = google.businessprofileperformance({
    version: 'v1',
    auth: oauth2Client
});

/**
 * Utilitário: Executa uma função com retry automático em caso de rate limit.
 */
async function comRetry(fn, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
        try {
            return await fn();
        } catch (error) {
            const isRateLimit = error.message?.includes('Quota exceeded') || error.code === 429;
            if (isRateLimit && i < tentativas - 1) {
                const espera = (i + 1) * 30; // 30s, 60s, 90s
                console.log(`⏳ Limite de requisições atingido. Aguardando ${espera}s antes de tentar novamente... (${i + 1}/${tentativas})`);
                await new Promise(r => setTimeout(r, espera * 1000));
            } else {
                throw error;
            }
        }
    }
}

/**
 * Lista as contas gerenciadas pelo usuário
 */
export async function listarContas() {
    try {
        const res = await comRetry(() => mybusinessaccountmanagement.accounts.list());
        return res.data.accounts || [];
    } catch (error) {
        console.error("Erro ao listar contas do GMB:", error.message);
        return [];
    }
}

/**
 * Lista os locais (fichas) de uma conta específica
 */
export async function listarLocais(accountId) {
    try {
        const res = await mybusinessbusinessinformation.accounts.locations.list({
            parent: accountId,
            readMask: 'name,title,storeCode,latlng,languageCode,storefrontAddress'
        });
        return res.data.locations || [];
    } catch (error) {
        console.error("Erro ao listar locais:", error.message);
        return [];
    }
}

/**
 * Obtém detalhes de um local específico
 */
export async function obterDetalhesLocal(locationName) {
    try {
        const res = await mybusinessbusinessinformation.locations.get({
            name: locationName,
            readMask: 'name,title,storeCode,latlng,languageCode,storefrontAddress,categories,regularHours,profile'
        });
        return res.data;
    } catch (error) {
        console.error("Erro ao obter detalhes do local:", error.message);
        return null;
    }
}

/**
 * Obtém as métricas diárias (ex: BUSINESS_IMPRESSIONS_DESKTOP_MAPS, CALL_CLICKS, etc.)
 * param locationName: string no formato "locations/123456"
 */
export async function obterMetricasDiarias(locationName, metric, dailyRange) {
    try {
        const res = await comRetry(() => businessprofileperformance.locations.getDailyMetricsTimeSeries({
            name: locationName,
            dailyMetric: metric,
            'dailyRange.startDate.year': dailyRange.start.year,
            'dailyRange.startDate.month': dailyRange.start.month,
            'dailyRange.startDate.day': dailyRange.start.day,
            'dailyRange.endDate.year': dailyRange.end.year,
            'dailyRange.endDate.month': dailyRange.end.month,
            'dailyRange.endDate.day': dailyRange.end.day,
        }));
        return res.data;
    } catch (error) {
        console.error(`Erro ao obter métrica ${metric}:`, error.message);
        return null;
    }
}

/**
 * Obtém as palavras-chave mensais usadas para encontrar a ficha
 */
export async function obterPalavrasChaveMensais(locationName) {
    try {
        // Datas: últimos 6 meses até hoje
        const hoje = new Date();
        const seisMesesAtras = new Date();
        seisMesesAtras.setMonth(hoje.getMonth() - 5);
        
        const res = await comRetry(() => businessprofileperformance.locations.searchkeywords.impressions.monthly.list({
            parent: locationName,
            'monthlyRange.startMonth.year': seisMesesAtras.getFullYear(),
            'monthlyRange.startMonth.month': seisMesesAtras.getMonth() + 1,
            'monthlyRange.endMonth.year': hoje.getFullYear(),
            'monthlyRange.endMonth.month': hoje.getMonth() + 1
        }));
        return res.data;
    } catch (error) {
        console.error("Erro ao obter palavras-chave:", error.message);
        return null;
    }
}
