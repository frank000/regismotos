# Use uma imagem base do Nginx
FROM nginx:latest

# Copie os arquivos HTML e o arquivo de configuração do Nginx para dentro do contêiner
COPY ./img/* /usr/share/nginx/html/img/
COPY ./* /usr/share/nginx/html/
COPY ./img/* /usr/share/nginx/html/img/
COPY default.conf /etc/nginx/conf.d/default.conf

 

# Exponha a porta 8080
EXPOSE 8080
