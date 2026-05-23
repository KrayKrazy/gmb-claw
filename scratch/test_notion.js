import { salvarAuditoriaNoNotion } from '../api_notion.js';

async function testNotion() {
    console.log("🧪 Testando conexão com Notion...");
    const dadosTeste = {
        "Business name": "Teste GMB Claw Integration",
        "Google star rating": "4.9",
        "Review count": "100"
    };
    const relatorioTeste = "Este é um teste automático de integração para garantir que os leads estão sendo criados corretamente no Notion da Kelevra Corp.";
    
    const id = await salvarAuditoriaNoNotion(dadosTeste, relatorioTeste);
    if (id) {
        console.log("✅ Conexão estabelecida! Página criada com ID:", id);
    } else {
        console.log("❌ Falha na conexão. Verifique o token e o ID do Database.");
    }
}

testNotion();
