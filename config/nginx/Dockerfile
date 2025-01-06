FROM nginx:alpine
COPY config/nginx/static.conf /etc/nginx/nginx.conf
COPY dist /usr/share/nginx/html

EXPOSE 80

LABEL org.opencontainers.image.title="Spaced Nginx"
LABEL org.opencontainers.image.licenses=MIT
LABEL org.opencontainers.image.source=https://github.com/Ekhorn/spaced.git
