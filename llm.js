import Groq from 'groq-sdk';
import { config } from './config.js';
import fs from 'fs';

let groqClient = null;

function getAIClient() {
    if (!groqClient) {
        if (!config.groqApiKey) {
            throw new Error('GROQ_API_KEY não configurada no arquivo .env');
        }
        groqClient = new Groq({ apiKey: config.groqApiKey });
    }
    return groqClient;
}

export async function gerarResposta(promptOrHistory, systemInstruction = '', tentativas = 3) {
    const client = getAIClient();
    
    // Suporte para string simples ou array de histórico
    let messages = [];
    
    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }
    
    if (Array.isArray(promptOrHistory)) {
        for (const msg of promptOrHistory) {
            if (msg.parts && msg.parts[0] && msg.parts[0].text && msg.parts[0].text.trim() !== '') {
                // Mapeia role 'model' do gemini para 'assistant' do openai/groq
                const role = msg.role === 'model' ? 'assistant' : msg.role;
                messages.push({ role: role, content: msg.parts[0].text });
            }
        }
    } else {
        messages.push({ role: 'user', content: promptOrHistory });
    }

    for (let i = 0; i < tentativas; i++) {
        try {
            const response = await client.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7
            });

            let textoFinal = response.choices[0].message.content || "";
            
            return textoFinal.trim();
        } catch (error) {
            console.error(`[Tentativa ${i + 1}/${tentativas}] Falha na API do Groq:`, error.message);
            if (i === tentativas - 1) throw error;
            await new Promise(res => setTimeout(res, 2000));
        }
    }
}

export async function gerarRespostaComImagem(prompt, imagePaths, systemInstruction = '') {
    // A API do Groq atual com Llama não suporta visão. 
    // Como workaround para evitar quebraremos o app, retornaremos um erro fixo
    // Ou se a OpenAI estuviese configurada poderíamos fazer fallback, mas não foi solicitada uma refatoração dupla.
    console.warn("Aviso: gerarRespostaComImagem foi chamada, mas o Groq SDK configurado não tem suporte nativo de visão ativo para esse modelo.");
    return "O recurso de auditoria visual de imagens está temporariamente em manutenção.";
}

export async function gerarRespostaJSON(prompt, tentativas = 3) {
    const client = getAIClient();
    
    for (let i = 0; i < tentativas; i++) {
        try {
            const response = await client.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'Você é um assistente que sempre responde com JSON válido. Retorne apenas JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            });

            return (response.choices[0].message.content || "").trim();
        } catch (error) {
            console.error(`[JSON Tentativa ${i + 1}/${tentativas}] Falha na API do Groq:`, error.message);
            if (i === tentativas - 1) throw error;
            await new Promise(res => setTimeout(res, 2000));
        }
    }
}
