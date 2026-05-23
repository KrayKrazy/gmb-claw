import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

async function listGemini() {
    try {
        const response = await ai.models.list({ pageSize: 100 });
        const geminiModels = response.models.filter(m => m.name.includes('gemini'));
        console.log("Modelos Gemini disponíveis:");
        geminiModels.forEach(m => console.log(`- ${m.name}`));
    } catch (e) {
        console.error("Erro:", e.message);
    }
}

listGemini();
