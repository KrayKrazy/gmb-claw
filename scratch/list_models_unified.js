import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

async function listModels() {
    try {
        const response = await ai.models.list();
        console.log("Modelos disponíveis:");
        response.models.forEach(m => console.log(`- ${m.name}`));
    } catch (e) {
        console.error("Erro ao listar modelos:", e.message);
    }
}

listModels();
