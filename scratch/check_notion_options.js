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

async function getSelectOptions() {
    try {
        const response = await notion.get(`/databases/${DATABASE_ID}`);
        console.log("Opções de 'Estágio de negociação':");
        console.log(JSON.stringify(response.data.properties["Estágio de negociação"].select.options.map(o => o.name), null, 2));
    } catch (error) {
        console.error("Erro:", error.response?.data || error.message);
    }
}

getSelectOptions();
