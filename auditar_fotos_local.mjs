import { auditarFotos } from './agent.js';
import fs from 'fs';
import path from 'path';

const PASTA_FOTOS = process.argv[2] || 'C:\\Users\\Solano\\Downloads\\BSB Redes de Proteção e telas mosquiteiras Brasília - Pesquisa Google';
const NOME_EMPRESA = process.argv[3] || 'BSB Redes de Proteção e telas mosquiteiras';

async function main() {
    console.log(`\n🔍 Carregando fotos de: ${PASTA_FOTOS}`);
    
    if (!fs.existsSync(PASTA_FOTOS)) {
        console.error(`❌ Pasta não encontrada: ${PASTA_FOTOS}`);
        process.exit(1);
    }

    const extensoesValidas = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const arquivos = fs.readdirSync(PASTA_FOTOS)
        .filter(f => extensoesValidas.includes(path.extname(f).toLowerCase()))
        .map(f => path.join(PASTA_FOTOS, f));

    if (arquivos.length === 0) {
        console.error('❌ Nenhuma imagem encontrada na pasta.');
        process.exit(1);
    }

    console.log(`📸 ${arquivos.length} fotos encontradas.`);
    console.log(`🤖 Gemini Vision analisando todas as imagens... (isso pode levar alguns segundos)`);

    try {
        // Gemini Vision tem limite de imagens por chamada — processamos em lotes de 8
        const LOTE = 8;
        let laudoFinal = '';
        
        for (let i = 0; i < arquivos.length; i += LOTE) {
            const lote = arquivos.slice(i, i + LOTE);
            console.log(`   → Lote ${Math.floor(i/LOTE)+1}: analisando fotos ${i+1} a ${Math.min(i+LOTE, arquivos.length)}...`);
            const laudoParcial = await auditarFotos(lote);
            laudoFinal += laudoParcial + '\n\n';
        }

        console.log(`\n✅ Análise Visual Concluída!`);
        console.log(`\n${'='.repeat(60)}`);
        console.log(laudoFinal);
        console.log('='.repeat(60));

        // Salvar laudo como arquivo Markdown
        const outputPath = path.join(process.cwd(), `Laudo_Visual_${NOME_EMPRESA.replace(/\s+/g, '_')}_${Date.now()}.md`);
        const conteudoMd = `# 📸 Laudo Visual: ${NOME_EMPRESA}\n\nData: ${new Date().toLocaleDateString('pt-BR')}\nTotal de fotos analisadas: **${arquivos.length}**\n\n---\n\n${laudoFinal}`;
        fs.writeFileSync(outputPath, conteudoMd, 'utf-8');
        
        console.log(`\n📄 Laudo salvo em: ${outputPath}`);
    } catch (err) {
        console.error('❌ Erro durante análise:', err.message);
    }
}

main();
