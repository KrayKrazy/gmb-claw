import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const BASE_DIR = path.join(process.cwd(), 'base_pdfs');
const KNOWLEDGE_FILE = path.join(process.cwd(), 'knowledge_base.txt');
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR);

const QUERIES = [
    'filetype:pdf "Google Meu Negócio"',
    'filetype:pdf "Google Business Profile"',
    'filetype:pdf "SEO Local" "Google Meu Negócio"',
    'filetype:pdf "otimização" "Google Business Profile"'
];

const TARGET_PDFS = 100;
const MAX_PAGES_PER_QUERY = 5;

// Usando SearxNG público ou DuckDuckGo. DDG é mais estável.
async function searchDDG(query, page = 1) {
    try {
        console.log(`Buscando: ${query} (Página ${page})`);
        const res = await axios.get('https://html.duckduckgo.com/html/', {
            params: { q: query },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);
        const links = [];
        $('.result__url').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
                // Duckduckgo sometimes redirects via /l/?uddg=...
                const match = href.match(/uddg=([^&]+)/);
                if (match) {
                    links.push(decodeURIComponent(match[1]));
                } else {
                    links.push(href);
                }
            }
        });
        return links.filter(l => l.toLowerCase().endsWith('.pdf'));
    } catch (e) {
        console.error('Erro na busca DDG:', e.message);
        return [];
    }
}

async function downloadPDF(url, index) {
    const filePath = path.join(BASE_DIR, `gmb_doc_${index}.pdf`);
    try {
        console.log(`Baixando PDF [${index}]: ${url.substring(0, 60)}...`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000 // 10s
        });
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Erro ao baixar ${url}:`, error.message);
        return null;
    }
}

async function extractText(pdfPath) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (e) {
        console.error('Erro ao ler PDF:', e.message);
        return null;
    }
}

// Pausa para não ser bloqueado
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function main() {
    let downloadedCount = 0;
    const allLinks = new Set();
    
    console.log("=== Iniciando raspagem de PDFs sobre GMB ===");
    
    // Coleta de Links
    for (const query of QUERIES) {
        if (downloadedCount >= TARGET_PDFS) break;
        
        const links = await searchDDG(query, 1);
        links.forEach(l => allLinks.add(l));
        await delay(2000); // Evitar rate limit
    }
    
    const uniqueLinks = Array.from(allLinks);
    console.log(`Encontrados ${uniqueLinks.length} links únicos de PDF.`);
    
    // Download e Extração
    const combinedTexts = [];
    
    for (const url of uniqueLinks) {
        if (downloadedCount >= TARGET_PDFS) break;
        
        const filePath = await downloadPDF(url, downloadedCount + 1);
        if (filePath) {
            downloadedCount++;
            console.log(`Extraindo texto do PDF ${downloadedCount}...`);
            const text = await extractText(filePath);
            if (text && text.trim().length > 100) {
                combinedTexts.push(`--- INÍCIO DO DOCUMENTO ${downloadedCount} ---\nFONTE: ${url}\n\n${text}\n--- FIM DO DOCUMENTO ${downloadedCount} ---\n\n`);
            }
        }
        await delay(1000);
    }
    
    console.log(`\n=== Finalizado! Baixados ${downloadedCount} PDFs válidos. ===`);
    
    // Salvar Base de Conhecimento
    if (combinedTexts.length > 0) {
        fs.writeFileSync(KNOWLEDGE_FILE, combinedTexts.join(''));
        console.log(`Base de conhecimento salva em: ${KNOWLEDGE_FILE}`);
        console.log(`Tamanho: ${(fs.statSync(KNOWLEDGE_FILE).size / 1024 / 1024).toFixed(2)} MB`);
    } else {
        console.log("Nenhum texto foi extraído.");
    }
}

main().catch(console.error);
