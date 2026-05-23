import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.SERPAPI_KEY;
const BASE_URL = 'https://serpapi.com/search';

async function test() {
    console.log("API_KEY:", API_KEY ? "Presente" : "Ausente");
    try {
        const response = await axios.get(BASE_URL, {
            params: {
                engine: 'google_maps',
                q: 'Wp refrigeração',
                location: 'São Sebastião DF',
                api_key: API_KEY,
                hl: 'pt-br'
            }
        });
        console.log("Sucesso:", JSON.stringify(response.data, null, 2).substring(0, 500));
    } catch (error) {
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Dados:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.log("Erro:", error.message);
        }
    }
}

test();
