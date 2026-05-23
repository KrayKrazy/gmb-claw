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

async function getDbStructure() {
    try {
        const response = await notion.get(`/databases/${DATABASE_ID}`);
        console.log("Propriedades encontradas no seu Database:");
        console.log(JSON.stringify(Object.keys(response.data.properties), null, 2));
    } catch (error) {
        console.error("Erro ao buscar estrutura:", error.response?.data || error.message);
    }
}

getDbStructure();
