import { exec } from 'child_process';
import util from 'util';
import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const execAsync = util.promisify(exec);

// Configuração do Webhook da Easypanel (Coloque essa variável no seu .env)
const EASYPANEL_WEBHOOK_URL = process.env.EASYPANEL_WEBHOOK_URL || null;

async function runCommand(command, description) {
    console.log(`\n⏳ Executando: ${description}...`);
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stdout) console.log(stdout.trim());
        if (stderr) console.error(stderr.trim());
        console.log(`✅ Concluído: ${description}`);
    } catch (error) {
        console.error(`❌ Erro em: ${description}`);
        console.error(error.message);
        process.exit(1);
    }
}

async function triggerWebhook() {
    if (!EASYPANEL_WEBHOOK_URL) {
        console.log("\n⚠️ EASYPANEL_WEBHOOK_URL não definido no .env. O Easypanel puxará a atualização automaticamente caso o auto-deploy do Github esteja ativado nele.");
        return;
    }

    console.log("\n📡 Acionando API do Easypanel para deploy...");
    
    return new Promise((resolve, reject) => {
        const req = https.get(EASYPANEL_WEBHOOK_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log("✅ API Easypanel acionada com sucesso! Seu servidor já está sendo atualizado na nuvem.");
                    resolve();
                } else {
                    console.log(`❌ Falha ao acionar a API. Status Code: ${res.statusCode}`);
                    resolve();
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ Erro de rede ao tentar acessar o Webhook do Easypanel: ${e.message}`);
            resolve();
        });

        req.end();
    });
}

async function deploy() {
    console.log("🚀 Iniciando rotina de Deploy para a Kelevra Corp...\n");

    const commitMessage = `Auto-deploy: Atualização do GMB Claw Web (${new Date().toISOString()})`;

    await runCommand('git add .', 'Adicionando arquivos modificados');
    
    try {
        // Ignora erro se não houver nada para commitar
        await execAsync(`git commit -m "${commitMessage}"`);
        console.log(`✅ Concluído: Commit local gerado.`);
    } catch (e) {
        if (e.message.includes('nothing to commit')) {
            console.log(`✅ Concluído: Nenhum arquivo novo para commitar.`);
        } else {
            console.error("❌ Erro ao commitar:", e.message);
            process.exit(1);
        }
    }

    await runCommand('git push', 'Enviando código para o Github');

    await triggerWebhook();

    console.log("\n🎉 Deploy finalizado! Se o webhook foi acionado ou o auto-deploy está ligado no Easypanel, a nova versão estará online em vitalebrasil.shop em 1 a 2 minutos.");
}

deploy();
