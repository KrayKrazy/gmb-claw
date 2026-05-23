import fs from 'fs';
import path from 'path';

/**
 * Gera um Dashboard HTML Premium com a identidade visual Kelevra.
 */
export function gerarDashboardHTML(dados, relatorioMarkdown, laudoGap = "", geogridData = null, laudoVisual = "") {
    const businessName = dados["Business name"] || "Empresa";
    const rating = dados["Google star rating"] || "0.0";
    const reviews = dados["Review count"] || "0";
    const photos = dados["Review photos count"] || "0";
    
    const formatarMarkdown = (md) => {
        if (!md) return "";
        let textoLimpo = md.replace(/^(Olá|Aqui está|Com certeza|Saudações)[^.\n]*[.\n]*/i, '').trim();
        return textoLimpo
            .replace(/^# (.*$)/gim, '<h1 class="text-4xl font-serif text-metallic mb-6">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-serif text-metallic mt-8 mb-4">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-slate-200 mt-6 mb-3">$1</h3>')
            .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-slate-400 mb-2">$1</li>')
            .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-400 mb-2">$1</li>')
            .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-yellow-500 pl-4 py-2 my-4 italic text-slate-300 bg-slate-900/50 rounded-r-lg">$1</blockquote>')
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\|(.+)\|/g, (match) => {
                const cells = match.split('|').filter(c => c.trim() !== '');
                if (match.includes('---')) return ''; 
                return `<tr class="border-b border-slate-800">${cells.map(c => `<td class="p-3 text-sm">${c.trim()}</td>`).join('')}</tr>`;
            })
            .replace(/(<tr.*<\/tr>)+/gs, (match) => `<div class="overflow-x-auto my-6"><table class="w-full text-left border-collapse glass rounded-xl">${match}</table></div>`)
            .replace(/\n/g, '<br>');
    };

    const relatorioHTML = formatarMarkdown(relatorioMarkdown);
    const gapHTML = formatarMarkdown(laudoGap);
    const visualHTML = formatarMarkdown(laudoVisual);

    let geogridHTML = "";
    if (geogridData && geogridData.length > 0) {
        const maxRow = Math.max(...geogridData.map(d => d.row));
        const maxCol = Math.max(...geogridData.map(d => d.col));
        
        let gridCells = '';
        for (let r = 0; r <= maxRow; r++) {
            gridCells += '<div class="flex justify-center gap-2 mb-2">';
            for (let c = 0; c <= maxCol; c++) {
                const point = geogridData.find(d => d.row === r && d.col === c);
                if (point) {
                    const rankNum = parseInt(point.rank);
                    let colorClass = 'bg-red-500/20 text-red-400 border-red-500/50';
                    if (rankNum >= 1 && rankNum <= 3) colorClass = 'bg-green-500/20 text-green-400 border-green-500/50';
                    else if (rankNum >= 4 && rankNum <= 10) colorClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
                    
                    gridCells += `<div class="w-16 h-16 flex items-center justify-center border rounded-lg font-bold text-xl ${colorClass}">${point.rank}</div>`;
                } else {
                    gridCells += `<div class="w-16 h-16 border border-slate-800 rounded-lg"></div>`;
                }
            }
            gridCells += '</div>';
        }
        
        geogridHTML = `
        <div class="glass p-10 rounded-3xl mb-12 border border-slate-800" style="page-break-before: always;">
            <h2 class="text-3xl font-serif text-metallic mb-8 text-center">Rastreamento Geogrid (Radar de Posição)</h2>
            <div class="flex flex-col items-center justify-center mb-6">
                ${gridCells}
            </div>
            <p class="text-center text-sm text-slate-400">A malha acima simula a posição da empresa no Google Maps vista por clientes em diferentes ruas num raio de 8km².</p>
        </div>`;
    }



    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard de Auditoria | ${businessName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        @page { size: A4; margin: 12mm 14mm; }
        body { font-family: 'Inter', sans-serif; background-color: #050507 !important; color: #cbd5e1; margin: 0; padding: 0; }
        .font-serif { font-family: 'Playfair Display', serif; }
        .text-metallic {
            background: linear-gradient(135deg, #f8fafc 0%, #d4af37 40%, #f1c40f 60%, #9a7b0c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            display: inline-block;
        }
        .glass {
            background: rgba(15, 23, 42, 0.6) !important;
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .gold-border { border-left: 4px solid #d4af37 !important; }
        
        /* Impede que blocos de conteúdo sejam cortados entre páginas */
        li, h1, h2, h3, p, .glass, .stat-card { 
            break-inside: avoid; 
            page-break-inside: avoid; 
        }
        h1, h2, h3 { 
            break-after: avoid; 
            page-break-after: avoid; 
        }

        @media print {
            .no-print { display: none !important; }
            body { background-color: #050507 !important; overflow: visible !important; }
            .glass { background-color: #0f172a !important; border: 1px solid #1e293b !important; }
            .container-main { max-width: 100% !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
            .text-metallic { -webkit-text-fill-color: #d4af37 !important; color: #d4af37 !important; }
            .report-content { word-wrap: break-word !important; overflow-wrap: break-word !important; }
        }
    </style>
</head>
<body class="p-8 md:p-16 min-h-screen">
    <div class="container-main max-w-5xl mx-auto">
        <!-- Header -->
        <header class="flex justify-between items-end mb-12 border-b border-slate-800 pb-8">
            <div>
                <p class="text-xs tracking-[0.3em] uppercase text-slate-500 mb-2">Engenharia de Reputação</p>
                <h1 class="text-5xl font-serif text-metallic font-bold">${businessName}</h1>
            </div>
            <div class="text-right">
                <div class="font-serif text-2xl font-bold text-metallic">|Kelevra corp.</div>
                <p class="text-xs text-slate-500 mt-1 uppercase tracking-widest">Auditoria Estratégica 2026</p>
            </div>
        </header>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div class="glass p-6 rounded-2xl">
                <p class="text-xs uppercase tracking-widest text-slate-500 mb-2">Nota Média</p>
                <div class="flex items-baseline gap-2">
                    <span class="text-4xl font-bold text-slate-100">${rating}</span>
                    <span class="text-yellow-500 text-xl">★★★★★</span>
                </div>
            </div>
            <div class="glass p-6 rounded-2xl">
                <p class="text-xs uppercase tracking-widest text-slate-500 mb-2">Total de Reviews</p>
                <span class="text-4xl font-bold text-slate-100">${reviews}</span>
            </div>
            <div class="glass p-6 rounded-2xl">
                <p class="text-xs uppercase tracking-widest text-slate-500 mb-2">Ativos Visuais</p>
                <span class="text-4xl font-bold text-slate-100">${photos} fotos</span>
            </div>
        </div>

        <!-- Relatório Content -->
        <div class="glass report-content p-10 rounded-3xl mb-12 gold-border">
            <div class="prose prose-invert max-w-none">
                ${relatorioHTML}
            </div>
        </div>

        ${gapHTML ? `
        <div class="glass report-content p-10 rounded-3xl mb-12 border border-red-500/30">
            <div class="prose prose-invert max-w-none">
                ${gapHTML}
            </div>
        </div>` : ''}

        ${geogridHTML}

        ${visualHTML ? `
        <div class="glass report-content p-10 rounded-3xl mb-12 border border-blue-500/30">
            <div class="prose prose-invert max-w-none">
                ${visualHTML}
            </div>
        </div>` : ''}

        <!-- Footer / CTA -->
        <footer class="text-center pt-8 border-t border-slate-800">
            <p class="text-slate-500 text-sm italic">"O futuro é iluminado. A Kelevra constrói a infraestrutura do seu sucesso digital."</p>
            <button onclick="window.print()" class="no-print mt-8 px-6 py-2 bg-slate-800 text-slate-200 rounded-full border border-slate-700 hover:bg-slate-700 transition-all uppercase text-xs tracking-widest font-bold">
                Gerar PDF para o Cliente
            </button>
        </footer>
    </div>
</body>
</html>
    `;
    
    const outputPath = path.join(process.cwd(), 'dashboard_resultado.html');
    fs.writeFileSync(outputPath, html);
    return outputPath;
}
