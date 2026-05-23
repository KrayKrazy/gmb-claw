import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

async function listModels() {
    try {
        const response = await ai.models.list({ pageSize: 50 });
        console.log("Modelos disponíveis:");
        // No SDK unificado, o resultado pode ser um objeto com uma propriedade que é um array ou um iterador
        if (response && response.models) {
            response.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("Estrutura da resposta:", JSON.stringify(response, null, 2));
        }
    } catch (e) {
        console.error("Erro ao listar modelos:", e.message);
    }
}

listModels();
