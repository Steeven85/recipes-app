#!/bin/sh

# Remplacement des variables d'environnement dans les fichiers JavaScript
# Trouve tous les fichiers JS et remplace l'URL de l'API
if [ -n "$API_URL" ]; then
  echo "Configuration de l'API URL: $API_URL"
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://192.168.85.50:9000|$API_URL|g" {} \;
fi

# Démarre Nginx
exec "$@"