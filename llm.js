import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import fs from 'fs';

let ai = null;

function getAIClient() {
    if (!ai) {
        if (!config.geminiApiKey) {
            throw new Error('GEMINI_API_KEY não configurada no arquivo .env');
        }
        ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
    return ai;
}

export async function gerarResposta(prompt, systemInstruction = '', tentativas = 3) {
    const client = getAIClient();
    
    for (let i = 0; i < tentativas; i++) {
        try {
            // No SDK unificado, o nome do modelo deve ser exato. 
            // O usuário selecionou Gemini 3 Flash, então usaremos o ID correspondente.
            const response = await client.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: systemInstruction || 'Você é um assistente especialista em Google Meu Negócio e otimização local de SEO.',
                    temperature: 0.7
                }
            });

            let textoFinal = response.text || "";
            
            textoFinal = textoFinal.replace(/<raciocinio>[\s\S]*?<\/raciocinio>\n*/gi, '');
            textoFinal = textoFinal.replace(/<analise_interna>[\s\S]*?<\/analise_interna>\n*/gi, '');
            textoFinal = textoFinal.replace(/<estrategia>[\s\S]*?<\/estrategia>\n*/gi, '');
            
            return textoFinal.trim();
        } catch (error) {
            console.error(`[Tentativa ${i + 1}/${tentativas}] Falha na API do Gemini:`, error.message);
            if (i === tentativas - 1) throw error;
            await new Promise(res => setTimeout(res, 2000));
        }
    }
}

export async function gerarRespostaComImagem(prompt, imagePaths, systemInstruction = '') {
    const client = getAIClient();

    try {
        const parts = imagePaths.map(path => ({
            inlineData: {
                data: fs.readFileSync(path).toString("base64"),
                mimeType: "image/jpeg"
            }
        }));

        parts.push({ text: prompt });

        const response = await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: parts }],
            config: {
                systemInstruction: systemInstruction || 'Você é um Auditor Visual de SEO Local.'
            }
        });

        return (response.text || "").trim();
    } catch (error) {
        console.error("Erro na Auditoria Visual:", error.message);
        return "Não foi possível realizar a auditoria visual no momento.";
    }
}

export async function gerarRespostaJSON(prompt, tentativas = 3) {
    const client = getAIClient();
    
    for (let i = 0; i < tentativas; i++) {
        try {
            const response = await client.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.3
                }
            });

            return (response.text || "").trim();
        } catch (error) {
            console.error(`[JSON Tentativa ${i + 1}/${tentativas}] Falha na API do Gemini:`, error.message);
            if (i === tentativas - 1) throw error;
            await new Promise(res => setTimeout(res, 2000));
        }
    }
}
