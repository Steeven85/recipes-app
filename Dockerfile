// Mise à jour du Dockerfile
FROM node:18-alpine AS build

# Installation des dépendances nécessaires
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Copie des fichiers sources
COPY . .

# Créer un dossier pour les assets statiques
RUN mkdir -p public/assets/images

# Ajouter une image de recette par défaut si elle n'existe pas déjà
RUN if [ ! -f public/assets/images/default-recipe.png ]; then \
    echo "Creating placeholder image..." && \
    echo "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowODoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6ODY2QTEyQUVDRTcwMTFFODkwOTFBODQ4OTA1NDg1RDUiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ODY2QTEyQURDRTcwMTFFODkwOTFBODQ4OTA1NDg1RDUiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6ODY2QTEyQTlDRTcwMTFFODkwOTFBODQ4OTA1NDg1RDUiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6ODY2QTEyQUFDRTcwMTFFODkwOTFBODQ4OTA1NDg1RDUiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5QJt9CAAAABlBMVEX///////9VfPVsAAAAAnRSTlP/AOW3MEoAAAA9SURBVHja7cExAQAAAMKg9U9tCF8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACATwMkrgABbCUYewAAAABJRU5ErkJggg==" | base64 -d > public/assets/images/default-recipe.png; \
    fi

# Construction
RUN npm run build:prod

# Étape de production avec Nginx
FROM nginx:alpine

# Copie de la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Création d'un script d'entrée pour remplacer les variables d'environnement
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copie des fichiers construits
COPY --from=build /app/dist /usr/share/nginx/html

# Exposition du port 80
EXPOSE 80

# Point d'entrée pour remplacer les variables d'environnement
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]