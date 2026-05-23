import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config({ path: join(__dirname, '.env') });
dotenv.config({ path: join(__dirname, '.env.gemini'), override: true });

export const config = {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    agentLanguage: process.env.AGENT_LANGUAGE || 'pt-BR',
    agentMode: process.env.AGENT_MODE || 'cli',
    serpApiKeys: (process.env.SERPAPI_KEYS || process.env.SERPAPI_KEY || '').split(',').map(k => k.trim()).filter(Boolean)
};
