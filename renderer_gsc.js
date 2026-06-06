import fs from 'fs';
import path from 'path';

/**
 * Gera um Dashboard HTML Premium com a identidade visual Kelevra para os dados do GSC.
 */
export function gerarDashboardGSC(relatorioGSC) {
    const totalSites = relatorioGSC.length;
    const totalCliquesGeral = relatorioGSC.reduce((acc, curr) => acc + curr.Cliques, 0);
    const totalImpressoesGeral = relatorioGSC.reduce((acc, curr) => acc + curr.Impressoes, 0);
    
    // Gerar os cards (grid) para cada site
    let sitesHTML = '';
    
    // Ordenar por cliques (descrescente)
    const relatorioOrdenado = [...relatorioGSC].sort((a, b) => b.Cliques - a.Cliques);

    relatorioOrdenado.forEach((site, index) => {
        let corDestaque = "border-slate-800";
        if (index === 0) corDestaque = "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
        else if (index === 1) corDestaque = "border-slate-400/50";
        else if (index === 2) corDestaque = "border-amber-700/50";

        const ctr = site.Impressoes > 0 ? ((site.Cliques / site.Impressoes) * 100).toFixed(1) : 0;

        sitesHTML += `
            <div class="glass p-6 rounded-2xl border ${corDestaque} flex flex-col justify-between">
                <div>
                    <p class="text-xs uppercase tracking-widest text-slate-500 mb-1 line-clamp-1" title="${site.Site}">${site.Site.replace('https://', '').replace('http://', '').replace('sc-domain:', '')}</p>
                    <div class="flex items-baseline gap-2 mt-4">
                        <span class="text-3xl font-bold text-metallic">${site.Cliques}</span>
                        <span class="text-slate-400 text-sm uppercase tracking-wider">cliques</span>
                    </div>
                    <div class="flex items-baseline gap-2 mt-1">
                        <span class="text-xl font-bold text-slate-300">${site.Impressoes}</span>
                        <span class="text-slate-500 text-xs uppercase tracking-wider">impressões</span>
                    </div>
                </div>
                <div class="mt-6 pt-4 border-t border-slate-800/50">
                    <p class="text-xs text-slate-400">CTR: <strong class="text-slate-200">${ctr}%</strong></p>
                    <p class="text-xs text-slate-400 mt-1 line-clamp-1" title="${site.TopQuery}">Top Query: <strong class="text-slate-200">${site.TopQuery}</strong> <span class="text-slate-500">(Pos: ${site.TopPos})</span></p>
                </div>
            </div>
        `;
    });

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Console Insights | Kelevra</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        @page { size: A4 landscape; margin: 12mm 14mm; }
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
        
        .stat-card { page-break-inside: avoid; }

        @media print {
            .no-print { display: none !important; }
            body { background-color: #050507 !important; overflow: visible !important; }
            .glass { background-color: #0f172a !important; border: 1px solid #1e293b !important; }
            .text-metallic { -webkit-text-fill-color: #d4af37 !important; color: #d4af37 !important; }
        }
    </style>
</head>
<body class="p-8 md:p-16 min-h-screen">
    <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <header class="flex justify-between items-end mb-12 border-b border-slate-800 pb-8">
            <div>
                <p class="text-xs tracking-[0.3em] uppercase text-slate-500 mb-2">Engenharia de Reputação</p>
                <h1 class="text-5xl font-serif text-metallic font-bold">Search Console Insights</h1>
                <p class="text-sm text-slate-400 mt-3">Análise de Tráfego Orgânico (Últimos 30 Dias)</p>
            </div>
            <div class="text-right">
                <div class="font-serif text-2xl font-bold text-metallic">|Kelevra corp.</div>
                <p class="text-xs text-slate-500 mt-1 uppercase tracking-widest">SEO Central</p>
            </div>
        </header>

        <!-- Stats Grid (Overview) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div class="glass p-6 rounded-2xl">
                <p class="text-xs uppercase tracking-widest text-slate-500 mb-2">Tráfego Total (Cliques)</p>
                <div class="flex items-baseline gap-2">
                    <span class="text-5xl font-bold text-metallic">${totalCliquesGeral.toLocaleString('pt-BR')}</span>
                </div>
            </div>
            <div class="glass p-6 rounded-2xl">
                <p class="text-xs uppercase tracking-widest text-slate-500 mb-2">Visibilidade Global (Impressões)</p>
                <span class="text-5xl font-bold text-slate-100">${totalImpressoesGeral.toLocaleString('pt-BR')}</span>
            </div>
            <div class="glass p-6 rounded-2xl">
                <p class="text-xs uppercase tracking-widest text-slate-500 mb-2">Propriedades Analisadas</p>
                <span class="text-5xl font-bold text-slate-100">${totalSites}</span>
            </div>
        </div>

        <h2 class="text-2xl font-serif text-metallic mt-8 mb-6 border-b border-slate-800/50 pb-2 inline-block">Portfólio de Domínios</h2>

        <!-- Propriedades Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            ${sitesHTML}
        </div>

        <!-- Footer / CTA -->
        <footer class="text-center pt-8 border-t border-slate-800">
            <p class="text-slate-500 text-sm italic">"O futuro é iluminado. A Kelevra constrói a infraestrutura do seu sucesso digital."</p>
            <button onclick="window.print()" class="no-print mt-8 px-6 py-2 bg-slate-800 text-slate-200 rounded-full border border-slate-700 hover:bg-slate-700 transition-all uppercase text-xs tracking-widest font-bold">
                Gerar PDF (Paisagem)
            </button>
        </footer>
    </div>
</body>
</html>
    `;
    
    const outputPath = path.join(process.cwd(), \`GSC_Dashboard_\${Date.now()}.html\`);
    fs.writeFileSync(outputPath, html);
    return outputPath;
}
