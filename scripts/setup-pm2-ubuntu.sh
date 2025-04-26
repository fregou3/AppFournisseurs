#!/bin/bash

echo "Installation et configuration de PM2 pour l'application de gestion des fournisseurs..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé. Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js a été installé."
else
    echo "Node.js est déjà installé."
fi

# Installer PM2 globalement s'il n'est pas déjà installé
if ! command -v pm2 &> /dev/null; then
    echo "Installation de PM2..."
    sudo npm install -g pm2
else
    echo "PM2 est déjà installé."
fi

# Créer un fichier de configuration PM2 pour l'application
echo "Création du fichier de configuration PM2 pour l'application..."
cd "$(dirname "$0")/.."

cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'fournisseurs-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5005
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5005
    }
  }]
};
EOL

echo "Configuration PM2 créée : ecosystem.config.js"

# Démarrer l'application avec PM2 en mode production
echo "Démarrage de l'application avec PM2 en mode production..."
pm2 start ecosystem.config.js --env production

# Configurer PM2 pour démarrer automatiquement au démarrage du système
echo "Configuration de PM2 pour démarrer automatiquement au démarrage du système..."
pm2 startup
echo "Exécutez la commande ci-dessus si nécessaire pour configurer le démarrage automatique."

# Sauvegarder la configuration PM2
echo "Sauvegarde de la configuration PM2..."
pm2 save

echo "PM2 a été configuré avec succès pour l'application de gestion des fournisseurs."
echo "L'application backend démarrera automatiquement au démarrage du système."
echo "Commandes utiles :"
echo "  - pm2 list : Afficher la liste des applications gérées par PM2"
echo "  - pm2 logs : Afficher les logs de toutes les applications"
echo "  - pm2 logs fournisseurs-backend : Afficher les logs de l'application backend"
echo "  - pm2 restart fournisseurs-backend : Redémarrer l'application backend"
echo "  - pm2 stop fournisseurs-backend : Arrêter l'application backend"
echo "  - pm2 delete fournisseurs-backend : Supprimer l'application de PM2"
