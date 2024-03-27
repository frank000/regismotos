# Use uma imagem base do Node.js
FROM node:14

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copie o arquivo package.json e o arquivo package-lock.json (se existir)
COPY package*.json ./
 

# Instale as dependências do aplicativo
RUN npm install

# Copie o restante do código-fonte do aplicativo
COPY . .

# Exponha a porta em que o aplicativo será executado
EXPOSE 3000

# Comando para executar o aplicativo quando o contêiner for iniciado
CMD ["node", "index.js"]