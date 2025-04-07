FROM node:18-alpine AS build

# Installation des dépendances
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copie des fichiers sources
COPY . .

# Modifiez axiosInstance.js pour utiliser /api comme baseURL
RUN sed -i 's|baseURL: .http://192.168.85.50:9000.|baseURL: "/api",|g' src/services/axiosInstance.js

# Construire l'application sans TypeScript
RUN sed -i 's/vue-tsc -b && vite build/vite build/g' package.json && \
    npm run build

# Étape de production
FROM nginx:alpine

# Copier la configuration Nginx modifiée pour le proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers construits
COPY --from=build /app/dist /usr/share/nginx/html

# Script d'entrée personnalisé
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'API_URL=${API_URL:-http://192.168.85.50:9000}' >> /docker-entrypoint.sh && \
    echo 'echo "Configuration de l API: $API_URL"' >> /docker-entrypoint.sh && \
    echo 'sed -i "s|http://192.168.85.50:9000|$API_URL|g" /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]