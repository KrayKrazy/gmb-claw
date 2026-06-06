import { google } from 'googleapis';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(process.cwd(), 'tokens_gsc.json');

const oauth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    'http://localhost:3000'
);

export async function getGscClient() {
    if (fs.existsSync(TOKEN_PATH)) {
        const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        oauth2Client.setCredentials(tokens);
        return google.webmasters({ version: 'v3', auth: oauth2Client });
    } else {
        throw new Error("❌ Não autenticado no GSC. Rode 'node auth_gsc.js' primeiro.");
    }
}

export async function listVerifiedSites() {
    try {
        const webmasters = await getGscClient();
        const response = await webmasters.sites.list();
        return response.data.siteEntry || [];
    } catch (error) {
        console.error("Erro ao listar sites do GSC:", error.message);
        return [];
    }
}

export async function getSitePerformance(siteUrl, startDate, endDate) {
    try {
        const webmasters = await getGscClient();
        const response = await webmasters.searchanalytics.query({
            siteUrl: siteUrl,
            requestBody: {
                startDate: startDate,
                endDate: endDate,
                dimensions: ['query', 'page'],
                rowLimit: 10
            }
        });
        return response.data.rows || [];
    } catch (error) {
        console.error(`Erro ao buscar performance para ${siteUrl}:`, error.message);
        return [];
    }
}

// Simple test block when run directly
if (process.argv[1].includes('api_gsc.js')) {
    (async () => {
        console.log(" Buscando sites...");
        const sites = await listVerifiedSites();
        console.log(`✅ ${sites.length} sites encontrados.`);
        sites.forEach(s => console.log(` - ${s.siteUrl}`));
    })();
}
