import { gerarResposta } from '../llm.js';

async function test() {
    console.log("🧪 Testando resposta de texto...");
    try {
        const resp = await gerarResposta("Olá, quem é você?");
        console.log("Resposta:", resp);
        console.log("✅ Sucesso!");
    } catch (e) {
        console.error("❌ Erro:", e.message);
    }
}

test();
