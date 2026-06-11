import { config } from './config.js';

const GEMINI_API_KEY = config.geminiApiKey;
const MODEL = 'gemini-2.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(contents, systemInstruction = '', temperature = 0.7, maxOutputTokens = 2048) {
    const body = {
        contents,
        generationConfig: {
            temperature,
            maxOutputTokens
        }
    };
    if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text.trim()) throw new Error('Resposta vazia do Gemini');
    return text.trim();
}

export async function gerarResposta(promptOrHistory, systemInstruction = '', tentativas = 3) {
    // Monta contents no formato Gemini: [{role, parts:[{text}]}]
    let contents = [];

    if (Array.isArray(promptOrHistory)) {
        for (const msg of promptOrHistory) {
            let text = '';
            if (msg.parts && msg.parts[0] && msg.parts[0].text) {
                text = msg.parts[0].text;
            } else if (msg.content) {
                text = msg.content;
            }
            if (!text.trim()) continue;
            const role = (msg.role === 'assistant') ? 'model' : (msg.role === 'model' ? 'model' : 'user');
            contents.push({ role, parts: [{ text }] });
        }
    } else {
        contents.push({ role: 'user', parts: [{ text: String(promptOrHistory) }] });
    }

    // O Gemini exige que a última mensagem seja do usuário
    if (!contents.length || contents[contents.length - 1].role !== 'user') return '';

    // Limitar a 20 mensagens para não estourar tokens
    contents = contents.slice(-20);

    for (let i = 0; i < tentativas; i++) {
        try {
            return await callGemini(contents, systemInstruction, 0.7, 2048);
        } catch (error) {
            console.error(`[Tentativa ${i + 1}/${tentativas}] Falha no Gemini:`, error.message);
            if (i === tentativas - 1) throw error;
            await new Promise(res => setTimeout(res, 2000 * (i + 1)));
        }
    }
}

export async function gerarRespostaComImagem(prompt, imagePaths, systemInstruction = '') {
    return 'O recurso de auditoria visual de imagens está temporariamente em manutenção.';
}

export async function gerarRespostaJSON(prompt, tentativas = 3) {
    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const system = 'Você é um assistente que sempre responde com JSON válido. Retorne APENAS o JSON, sem texto extra, sem markdown, sem blocos de código.';

    for (let i = 0; i < tentativas; i++) {
        try {
            const raw = await callGemini(contents, system, 0.3, 2048);
            // Extrai JSON mesmo que venha com markdown
            const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
            return match[1].trim();
        } catch (error) {
            console.error(`[JSON Tentativa ${i + 1}/${tentativas}] Falha no Gemini:`, error.message);
            if (i === tentativas - 1) throw error;
            await new Promise(res => setTimeout(res, 2000 * (i + 1)));
        }
    }
}
