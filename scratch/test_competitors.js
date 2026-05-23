import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.SERPAPI_KEY;
const BASE_URL = 'https://serpapi.com/search';

async function test() {
    try {
        const queryFinal = 'Conserto de geladeira em São Sebastião DF';
        
        const response = await axios.get(BASE_URL, {
            params: {
                engine: 'google_maps',
                q: queryFinal,
                api_key: API_KEY,
                hl: 'pt-br'
            }
        });
        console.log("Resultados para concorrentes:", response.data.local_results?.length || 0);
        if (response.data.local_results) {
            response.data.local_results.slice(0, 3).forEach((r, i) => {
                console.log(`${i+1}. ${r.title} (${r.rating}⭐)`);
            });
        }
    } catch (error) {
        console.log("Erro:", error.message);
    }
}

test();
