import { gerarResposta } from './llm.js';

const INVISIBILIDADE_PROMPT = `
Você é a Débora, a Estrategista Sênior de Reputação e SEO Local da Kelevra Corp.
Analise os dados estruturados do Google Meu Negócio de uma empresa fornecidos abaixo e elabore um **"Diagnóstico de Invisibilidade"** comercial, rápido e altamente persuasivo.

DADOS DA EMPRESA AUDITADA:
Nome da Empresa: Casa do Andaime - SCIA - Cidade do Automóvel
Nota (Rating): 4.1
Número de Avaliações: 12
Possui Website? Não
Telefone: 61 9999-9999
Endereço: SCIA
Categoria GMB: Loja de andaimes
ID do Google Maps: 123

INSTRUÇÕES DO DIAGNÓSTICO:
1. Tom de Voz: Profissional, assertivo, comercialmente persuasivo, mas ético. O objetivo é despertar no dono da empresa o desejo imediato de corrigir os problemas de visibilidade.
2. Formato: Curto, visualmente escaneável, excelente para ser enviado pelo WhatsApp ou apresentado em uma ligação rápida de vendas.
3. Seções Obrigatórias:
   - **🎯 Veredito de Invisibilidade**: Uma nota de 0 a 100 de Saúde Digital e um status claro (ex: 🔴 Crítico, 🟡 Risco de Perda, 🟢 Potencial Oculto). Explique de forma muito simples a nota.
   - **🚨 Os Gargalos Graves (O que está afastando clientes)**: Liste de 2 a 3 falhas REAIS baseadas EXCLUSIVAMENTE nos dados fornecidos. Se a empresa possui site, NÃO diga que falta site. Se possui muitas avaliações, avalie a nota média. Explique o impacto prático disso no dia a dia.
   - **💸 O Impacto Financeiro (O Custo da Invisibilidade)**: Mostre o que a empresa está perdendo por não estar no Top 3 do Google Maps (quantos clientes estão preferindo concorrentes diretos que estão mais visíveis).
4. Linguagem: Didática e simples. Se usar termos técnicos de SEO Local ou algoritmo, faça analogias com vitrines de lojas ou localizações físicas.
ATENÇÃO: Nunca invente problemas. Baseie-se apenas nos dados enviados.

Elabore em formato Markdown refinado e profissional.
`;

async function run() {
    try {
        const res = await gerarResposta(INVISIBILIDADE_PROMPT, "Você é a Débora, a Estrategista Sênior de Reputação e SEO Local da Kelevra Corp.");
        console.log(res);
    } catch (e) {
        console.error(e);
    }
}
run();
