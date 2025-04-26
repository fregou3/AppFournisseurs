#!/bin/bash

echo "==============================================="
echo "Déploiement complet de l'application en production sur Ubuntu"
echo "==============================================="

# Vérifier que le script est exécuté avec les privilèges sudo
if [ "$EUID" -ne 0 ]; then
  echo "Ce script doit être exécuté avec les privilèges sudo."
  echo "Veuillez exécuter : sudo $0"
  exit 1
fi

# Définir le répertoire de base
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "Répertoire de base : $BASE_DIR"

# 1. Installer les dépendances système si nécessaires
echo "1. Vérification et installation des dépendances système..."
apt update
apt install -y curl git nginx

# 2. Installer Node.js si nécessaire
if ! command -v node &> /dev/null; then
    echo "2. Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
    apt install -y nodejs
    echo "Node.js $(node -v) installé."
else
    echo "2. Node.js $(node -v) est déjà installé."
fi

# 3. Installer PM2 si nécessaire
if ! command -v pm2 &> /dev/null; then
    echo "3. Installation de PM2..."
    npm install -g pm2
    echo "PM2 installé."
else
    echo "3. PM2 est déjà installé."
fi

# 4. Installer les dépendances du backend
echo "4. Installation des dépendances du backend..."
cd "$BASE_DIR/backend"
npm install

# 5. Installer les dépendances du frontend
echo "5. Installation des dépendances du frontend..."
cd "$BASE_DIR/frontend"
npm install

# 6. Construire le frontend pour la production
echo "6. Construction du frontend pour la production..."
npm run build:prod

# 7. Créer le répertoire de destination si nécessaire
echo "7. Préparation du répertoire de déploiement..."
mkdir -p /var/www/fournisseurs

# 8. Copier les fichiers du build dans le répertoire de Nginx
echo "8. Copie des fichiers du build vers le répertoire de Nginx..."
cp -R build/* /var/www/fournisseurs/

# 9. Configurer les permissions
echo "9. Configuration des permissions..."
chown -R www-data:www-data /var/www/fournisseurs
chmod -R 755 /var/www/fournisseurs

# 10. Créer la configuration Nginx
echo "10. Création de la configuration Nginx..."
cat > /etc/nginx/sites-available/fournisseurs << 'EOL'
server {
    listen 80;
    server_name _;  # Remplacer par votre nom de domaine ou IP publique en production
    
    # Compression pour améliorer les performances
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_min_length 256;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Répertoire virtuel pour l'application de gestion des fournisseurs
    location /fournisseurs/ {
        alias /var/www/fournisseurs/;
        try_files $uri $uri/ /fournisseurs/index.html;
        
        # Configuration de sécurité
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options "nosniff";
    }
    
    # API pour l'application de gestion des fournisseurs
    location /fournisseurs/api/ {
        rewrite ^/fournisseurs/api/(.*) /$1 break;
        proxy_pass http://localhost:5005/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Redirection de la racine vers l'application par défaut
    location = / {
        return 301 /fournisseurs/;
    }
    
    # Gestion des erreurs
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
EOL

# 11. Créer un lien symbolique pour activer la configuration
echo "11. Activation de la configuration Nginx..."
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi
ln -sf /etc/nginx/sites-available/fournisseurs /etc/nginx/sites-enabled/

# 12. Vérifier la configuration Nginx
echo "12. Vérification de la configuration Nginx..."
nginx -t

# 13. Redémarrer Nginx si la configuration est valide
if [ $? -eq 0 ]; then
    echo "13. Redémarrage de Nginx..."
    systemctl restart nginx
else
    echo "Erreur dans la configuration Nginx. Veuillez corriger les erreurs avant de continuer."
    exit 1
fi

# 14. Créer un fichier de configuration PM2
echo "14. Création du fichier de configuration PM2..."
cd "$BASE_DIR"
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'fournisseurs-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5005
    }
  }]
};
EOL

# 15. Démarrer l'application avec PM2
echo "15. Démarrage de l'application avec PM2..."
cd "$BASE_DIR"
pm2 start ecosystem.config.js --env production

# 16. Configurer PM2 pour démarrer automatiquement
echo "16. Configuration de PM2 pour démarrer automatiquement..."
pm2 startup
pm2 save

echo "==============================================="
echo "Déploiement terminé avec succès !"
echo "==============================================="
echo "L'application est accessible à l'adresse : http://$(hostname -I | awk '{print $1}')/fournisseurs"
echo "Le backend est géré par PM2 et démarrera automatiquement au redémarrage du système."
echo ""
echo "Commandes utiles :"
echo "  - pm2 list : Afficher la liste des applications"
echo "  - pm2 logs : Afficher les logs"
echo "  - pm2 restart fournisseurs-backend : Redémarrer le backend"
echo "  - systemctl restart nginx : Redémarrer Nginx"
echo "==============================================="
