import { google } from 'googleapis';
import { config } from './config.js';
import express from 'express';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(process.cwd(), 'tokens_gsc.json');

const oauth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    'http://localhost:3000'
);

const scopes = [
    'https://www.googleapis.com/auth/webmasters.readonly'
];

async function authenticate() {
    if (!config.googleClientId || !config.googleClientSecret) {
        console.error("ERRO: GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configurados no .env");
        process.exit(1);
    }

    if (fs.existsSync(TOKEN_PATH)) {
        try {
            const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
            oauth2Client.setCredentials(tokens);
            console.log('✅ Tokens GSC existentes carregados de tokens_gsc.json');
            
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
            console.log('✅ Token GSC renovado com sucesso!');
            process.exit(0);
        } catch (err) {
            console.log('⚠️ Token GSC expirado ou inválido. Iniciando nova autenticação...\n');
        }
    }

    const app = express();
    let server;

    app.get('/', async (req, res) => {
        const code = req.query.code;
        if (code) {
            try {
                const { tokens } = await oauth2Client.getToken(code);
                oauth2Client.setCredentials(tokens);
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
                
                res.send(`
                    <html><body style="background:#050507;color:#cbd5e1;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
                        <div style="text-align:center">
                            <h1 style="color:#d4af37;font-size:2rem">✅ Google Search Console Conectado!</h1>
                            <p style="color:#94a3b8">Autenticação concluída. Pode fechar esta aba.</p>
                        </div>
                    </body></html>
                `);
                
                console.log('\n✅ Autenticação GSC concluída! Tokens salvos em tokens_gsc.json');
                setTimeout(() => server.close(() => process.exit(0)), 1500);
            } catch (error) {
                res.status(500).send('Erro na autenticação: ' + error.message);
            }
        }
    });

    server = app.listen(3000, () => {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });

        console.log('');
        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║     🕸️ GMB CLAW - AUTENTICAÇÃO SEARCH CONSOLE   ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log('║  Abra a URL abaixo no seu navegador:             ║');
        console.log('╚══════════════════════════════════════════════════╝');
        console.log('');
        console.log(url);
        console.log('');
    });
}

authenticate();
