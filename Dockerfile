FROM nginx:alpine

# Copier les fichiers statiques précompilés
COPY dist/ /usr/share/nginx/html/

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Script d'entrée pour substituer l'URL de l'API
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'API_URL=${API_URL:-http://192.168.85.50:9000}' >> /docker-entrypoint.sh && \
    echo 'sed -i "s|http://192.168.85.50:9000|$API_URL|g" /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]