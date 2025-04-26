#!/bin/bash

echo "Installation et configuration de Nginx pour l'application de gestion des fournisseurs..."

# Mettre à jour les paquets
echo "Mise à jour des paquets..."
sudo apt update

# Installer Nginx s'il n'est pas déjà installé
if ! command -v nginx &> /dev/null; then
    echo "Installation de Nginx..."
    sudo apt install -y nginx
else
    echo "Nginx est déjà installé."
fi

# Vérifier que Nginx est activé et démarré
echo "Activation et démarrage de Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Créer le répertoire pour l'application
echo "Création du répertoire pour l'application..."
sudo mkdir -p /var/www/fournisseurs

# Définir les permissions
echo "Configuration des permissions..."
sudo chown -R $USER:$USER /var/www/fournisseurs
sudo chmod -R 755 /var/www

# Créer la configuration Nginx pour l'application
echo "Création de la configuration Nginx pour l'application..."
sudo tee /etc/nginx/sites-available/fournisseurs > /dev/null << 'EOL'
server {
    listen 80;
    server_name _;  # Remplacer par votre nom de domaine ou IP publique en production
    
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

# Créer un lien symbolique pour activer la configuration
echo "Activation de la configuration..."
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi
sudo ln -sf /etc/nginx/sites-available/fournisseurs /etc/nginx/sites-enabled/

# Vérifier la configuration
echo "Vérification de la configuration Nginx..."
sudo nginx -t

# Redémarrer Nginx si la configuration est valide
if [ $? -eq 0 ]; then
    echo "Redémarrage de Nginx..."
    sudo systemctl restart nginx
    echo "Nginx a été configuré avec succès pour l'application de gestion des fournisseurs."
    echo "L'application sera accessible à l'adresse : http://votre-ip/fournisseurs"
else
    echo "Erreur dans la configuration Nginx. Veuillez corriger les erreurs avant de continuer."
fi
