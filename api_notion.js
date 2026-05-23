import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

const notion = axios.create({
    baseURL: 'https://api.notion.com/v1',
    headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
    }
});

/**
 * Cria uma nova página no Notion com o resultado da auditoria.
 */
export async function salvarAuditoriaNoNotion(dadosEmpresa, relatorio) {
    if (!NOTION_TOKEN || !DATABASE_ID) {
        console.log("⚠️ Notion não configurado corretamente no .env. Pulando salvamento.");
        return null;
    }

    try {
        const response = await notion.post('/pages', {
            parent: { database_id: DATABASE_ID },
            properties: {
                "Nome": {
                    title: [{ text: { content: dadosEmpresa["Business name"] || dadosEmpresa["nome"] || "Empresa Sem Nome" } }]
                },
                "Rating": {
                    number: parseFloat(dadosEmpresa["Google star rating"] || dadosEmpresa["nota_media"]) || 0
                },
                "Total de Avaliações": {
                    number: parseInt(dadosEmpresa["Review count"] || dadosEmpresa["total_avaliacoes"]) || 0
                },
                "Categoria": {
                    rich_text: [{ text: { content: dadosEmpresa["Category"] || "" } }]
                },
                "Estágio de negociação": {
                    select: { name: "Novo" }
                }
            },
            children: [
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: { rich_text: [{ text: { content: "Resumo da Auditoria 360 (GMB Claw)" } }] }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ text: { content: relatorio.substring(0, 2000) } }]
                    }
                }
            ]
        });

        return response.data.id;
    } catch (error) {
        const notionError = error.response?.data;
        console.error("Erro ao salvar no Notion:", notionError?.message || error.message);
        if (notionError?.message?.includes("not a property")) {
            console.log("Dica: Verifique se os nomes das colunas (Nome, Rating, Total de Avaliações, Estágio de negociação) estão exatos no seu Notion.");
        }
        return null;
    }
}
