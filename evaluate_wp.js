import { analisarPerfilGMB } from './agent.js';

const wpData = {
  nome: "WP Refrigeração | Conserto de Máquinas de Lavar e Refrigeradores",
  categoria: "Conserto de Eletrodomésticos",
  localizacao: "São Sebastião, Distrito Federal",
  descricao_atual: "Manutenção e conserto de máquinas de lavar, geladeiras, freezers e equipamentos de refrigeração.",
  foco_cliente: "Classe A/B, busca atendimento rápido e de emergência.",
  nota_media: 4.8,
  total_avaliacoes: 23
};

async function run() {
  console.log("Iniciando avaliação do agente GMB Claw para WP Refrigeração...\n");
  const resultado = await analisarPerfilGMB(wpData);
  console.log(resultado);
}

run();
