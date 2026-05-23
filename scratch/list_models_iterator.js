import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

async function debug() {
    const response = await ai.models.list();
    // Iterando sobre o pager
    for await (const model of response) {
        if (model.name.includes('gemini')) {
            console.log(model.name);
        }
    }
}

debug();
