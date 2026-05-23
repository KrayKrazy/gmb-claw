import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.SERPAPI_KEY;
const BASE_URL = 'https://serpapi.com/search';

async function test() {
    try {
        const q = 'Wp refrigeração';
        const location = 'São Sebastião DF';
        const queryFinal = `${q} ${location}`;
        
        const response = await axios.get(BASE_URL, {
            params: {
                engine: 'google_maps',
                q: queryFinal,
                api_key: API_KEY,
                hl: 'pt-br'
            }
        });
        console.log("Sucesso! Resultados encontrados:", response.data.local_results?.length || 0);
        if (response.data.local_results) {
            console.log("Primeiro resultado:", response.data.local_results[0].title);
        }
    } catch (error) {
        console.log("Erro:", error.message);
        if (error.response) console.log(JSON.stringify(error.response.data));
    }
}

test();
