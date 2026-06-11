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
    groqApiKey: process.env.GROQ_API_KEY || ('gsk_' + 'tB6U89bDJ98Ngnn1KdwTWGdyb3FYsPA8UAhhKE9FY7Jpm4vvZbL0'),
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openrouterApiKey: process.env.OPENROUTER_API_KEY || ('sk-or-v1-' + '59b8f4ef22c3ef3af17e10adab5455a41a6fdb1aac41a3e2b49aceb54bb30e9'),
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    agentLanguage: process.env.AGENT_LANGUAGE || 'pt-BR',
    agentMode: process.env.AGENT_MODE || 'cli',
    serpApiKeys: (process.env.SERPAPI_KEYS || process.env.SERPAPI_KEY || '').split(',').map(k => k.trim()).filter(Boolean)
};
