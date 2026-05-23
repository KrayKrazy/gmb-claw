# Use a imagem oficial do Node.js
FROM node:20-alpine

# Crie o diretório de trabalho da aplicação
WORKDIR /usr/src/app

# Copie os arquivos de dependência
COPY package*.json ./

# Instale as dependências de produção
RUN npm install --only=production

# Copie todo o código da aplicação
COPY . .

# Exponha a porta que a aplicação vai rodar (Easypanel mapeia isso automaticamente)
EXPOSE 3000

# Defina a variável de ambiente para produção
ENV NODE_ENV=production
# Defina a senha padrão do Dashboard (pode ser sobrescrita nas variáveis de ambiente do painel)
ENV DASHBOARD_PASSWORD=kelevra2026

# Comando para iniciar o servidor web
CMD [ "npm", "start" ]
