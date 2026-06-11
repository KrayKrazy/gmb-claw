import Groq from 'groq-sdk';
import { config } from './config.js';

let client = null;

function getAIClient() {
    if (!client) {
        const key = config.groqApiKey;
        if (!key) throw new Error('GROQ_API_KEY não configurada');
        client = new Groq({ apiKey: key });
    }
    return client;
}

// Usa o modelo mais leve da Groq para evitar timeout e rate limit
const MODEL = 'llama-3.1-8b-instant';

export async function gerarResposta(promptOrHistory, systemInstruction = '', tentativas = 3) {
    const ai = getAIClient();
    let messages = [];

    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }

    if (Array.isArray(promptOrHistory)) {
        for (const msg of promptOrHistory) {
            let content = '';
            if (msg.parts && msg.parts[0] && msg.parts[0].text) {
                content = msg.parts[0].text;
            } else if (msg.content) {
                content = msg.content;
            }
            if (content.trim() === '') continue;
            const role = msg.role === 'model' ? 'assistant' : msg.role;
            messages.push({ role, content });
        }
    } else {
        messages.push({ role: 'user', content: String(promptOrHistory) });
    }

    // Limitar histórico a últimas 10 mensagens para não estourar tokens
    const systemMsg = messages.find(m => m.role === 'system');
    const otherMsgs = messages.filter(m => m.role !== 'system');
    const trimmed = otherMsgs.slice(-10);
    messages = systemMsg ? [systemMsg, ...trimmed] : trimmed;

    for (let i = 0; i < tentativas; i++) {
        try {
            const response = await ai.chat.completions.create({
                model: MODEL,
                messages,
                temperature: 0.7,
                max_tokens: 2048
            });
            const text = response.choices?.[0]?.message?.content || '';
            if (!text.trim()) throw new Error('Resposta vazia do modelo');
            return text.trim();
        } catch (error) {
            console.error(`[Tentativa ${i + 1}/${tentativas}] Falha no Groq:`, error.message);
            if (i === tentativas - 1) throw error;
            await new Promise(res => setTimeout(res, 3000 * (i + 1)));
        }
    }
}

export async function gerarRespostaComImagem(prompt, imagePaths, systemInstruction = '') {
    return 'O recurso de auditoria visual de imagens está temporariamente em manutenção.';
}

export async function gerarRespostaJSON(prompt, tentativas = 3) {
    const ai = getAIClient();
    for (let i = 0; i < tentativas; i++) {
        try {
            const response = await ai.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: 'system', content: 'Você é um assistente que sempre responde com JSON válido. Retorne APENAS o JSON, sem texto extra, sem markdown.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 2048
            });
            const raw = (response.choices?.[0]?.message?.content || '').trim();
            const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
            return match[1].trim();
        } catch (error) {
            console.error(`[JSON Tentativa ${i + 1}/${tentativas}] Falha no Groq:`, error.message);
            if (i === tentativas - 1) throw error;
            await new Promise(res => setTimeout(res, 3000 * (i + 1)));
        }
    }
}
