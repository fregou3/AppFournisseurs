#!/bin/bash

##############################################################
# Script de déploiement complet pour l'application de gestion des fournisseurs
# Environnement : Ubuntu (Production)
# IP publique : 15.188.198.103
# Version : 1.1 - Avec correction pour Nginx
##############################################################

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages d'étape
print_step() {
    echo -e "\n${BLUE}[ÉTAPE $1/${TOTAL_STEPS}] $2${NC}"
}

# Fonction pour afficher les messages de succès
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Fonction pour afficher les messages d'erreur
print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Fonction pour afficher les messages d'avertissement
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Fonction pour afficher les messages d'information
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Fonction pour vérifier et libérer le port 80 si nécessaire
check_and_free_port_80() {
    print_info "Vérification si le port 80 est déjà utilisé..."
    PORT_80_USAGE=$(netstat -tulpn | grep ":80 ")
    if [ ! -z "$PORT_80_USAGE" ]; then
        print_warning "Le port 80 est déjà utilisé par un autre service:"
        echo "$PORT_80_USAGE"
        echo -e "${YELLOW}Voulez-vous tenter de libérer le port 80? (o/n)${NC}"
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Oo]$ ]]; then
            # Tenter de libérer le port 80
            PID=$(echo "$PORT_80_USAGE" | awk '{print $7}' | cut -d'/' -f1)
            if [ ! -z "$PID" ]; then
                print_info "Tentative d'arrêt du processus $PID..."
                kill -15 $PID
                sleep 2
                # Vérifier si le processus est toujours en cours d'exécution
                if ps -p $PID > /dev/null; then
                    print_warning "Le processus est toujours en cours d'exécution. Tentative d'arrêt forcé..."
                    kill -9 $PID
                    sleep 2
                fi
            fi
            
            # Vérifier à nouveau si le port est libre
            PORT_80_USAGE=$(netstat -tulpn | grep ":80 ")
            if [ ! -z "$PORT_80_USAGE" ]; then
                print_warning "Le port 80 est toujours utilisé. Vous devrez résoudre ce problème manuellement."
                return 1
            else
                print_success "Le port 80 a été libéré avec succès."
                return 0
            fi
        else
            print_warning "Le port 80 est toujours utilisé. Nginx pourrait ne pas démarrer correctement."
            return 1
        fi
    else
        print_info "Le port 80 est libre."
        return 0
    fi
}

# Nombre total d'étapes
TOTAL_STEPS=16

# Vérifier que le script est exécuté avec les privilèges sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté avec les privilèges sudo. Veuillez exécuter : sudo $0"
fi

# Définir le répertoire de base
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
print_info "Répertoire de base : $BASE_DIR"

# Demander confirmation avant de continuer
echo -e "${YELLOW}Ce script va déployer l'application de gestion des fournisseurs en production.${NC}"
echo -e "${YELLOW}Il va installer les dépendances système nécessaires, configurer Nginx et PM2.${NC}"
read -p "Voulez-vous continuer ? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    print_info "Déploiement annulé."
    exit 0
fi

# Configuration spécifique pour le serveur de production
DOMAIN_NAME="15.188.198.103"
BACKEND_PORT="5005"
VIRTUAL_DIR="fournisseurs"

print_info "Configuration pour le déploiement :"
print_info "- Adresse IP : $DOMAIN_NAME"
print_info "- Port backend : $BACKEND_PORT"
print_info "- Répertoire virtuel : /$VIRTUAL_DIR"

# 1. Installer les dépendances système
print_step 1 "Installation des dépendances système..."
apt update || print_error "Impossible de mettre à jour les paquets."
apt install -y curl git nginx software-properties-common net-tools || print_error "Impossible d'installer les dépendances système."
print_success "Dépendances système installées."

# 2. Installer Node.js
print_step 2 "Installation de Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - || print_error "Impossible de configurer le dépôt Node.js."
    apt install -y nodejs || print_error "Impossible d'installer Node.js."
    print_success "Node.js $(node -v) installé."
else
    print_success "Node.js $(node -v) est déjà installé."
fi

# 3. Installer PM2
print_step 3 "Installation de PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 || print_error "Impossible d'installer PM2."
    print_success "PM2 installé."
else
    print_success "PM2 est déjà installé."
fi

# 4. Créer un fichier .env pour le backend
print_step 4 "Configuration du fichier .env pour le backend..."
cat > "$BASE_DIR/backend/.env" << EOL
# Configuration de l'environnement
NODE_ENV=production

# Port du serveur backend
PORT=$BACKEND_PORT

# Configuration de la base de données
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=fournisseurs
DB_PORT=5432

# Domaine de production (pour CORS)
PRODUCTION_DOMAIN=http://$DOMAIN_NAME

# Chemin de base pour l'API en production
BASE_PATH=/$VIRTUAL_DIR/api
EOL
print_success "Fichier .env créé pour le backend."

# 5. Installer les dépendances du backend
print_step 5 "Installation des dépendances du backend..."
cd "$BASE_DIR/backend"
npm install || print_error "Impossible d'installer les dépendances du backend."
print_success "Dépendances du backend installées."

# 6. Installer les dépendances du frontend
print_step 6 "Installation des dépendances du frontend..."
cd "$BASE_DIR/frontend"
npm install || print_error "Impossible d'installer les dépendances du frontend."
print_success "Dépendances du frontend installées."

# 7. Construire le frontend pour la production
print_step 7 "Construction du frontend pour la production..."
cd "$BASE_DIR/frontend"
# Créer un fichier .env pour le frontend
cat > .env << EOL
REACT_APP_API_URL=/$VIRTUAL_DIR/api
REACT_APP_BASE_URL=/$VIRTUAL_DIR
PUBLIC_URL=/$VIRTUAL_DIR
EOL
npm run build || print_error "Impossible de construire le frontend."
print_success "Frontend construit avec succès."

# 8. Créer le répertoire de destination
print_step 8 "Préparation du répertoire de déploiement..."
mkdir -p "/var/www/$VIRTUAL_DIR" || print_error "Impossible de créer le répertoire de déploiement."
print_success "Répertoire de déploiement créé."

# 9. Copier les fichiers du build dans le répertoire de Nginx
print_step 9 "Copie des fichiers du build vers le répertoire de Nginx..."
cp -R "$BASE_DIR/frontend/build/"* "/var/www/$VIRTUAL_DIR/" || print_error "Impossible de copier les fichiers du build."
print_success "Fichiers copiés avec succès."

# 10. Configurer les permissions
print_step 10 "Configuration des permissions..."
chown -R www-data:www-data "/var/www/$VIRTUAL_DIR"
chmod -R 755 "/var/www/$VIRTUAL_DIR"
print_success "Permissions configurées."

# 11. Créer la configuration Nginx
print_step 11 "Création de la configuration Nginx..."
cat > "/etc/nginx/sites-available/$VIRTUAL_DIR" << EOL
server {
    listen 80;
    server_name $DOMAIN_NAME;
    
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
    
    # Répertoire virtuel pour l'application
    location /$VIRTUAL_DIR/ {
        alias /var/www/$VIRTUAL_DIR/;
        try_files \$uri \$uri/ /$VIRTUAL_DIR/index.html;
        
        # Configuration de sécurité
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options "nosniff";
    }
    
    # API pour l'application
    location /$VIRTUAL_DIR/api/ {
        rewrite ^/$VIRTUAL_DIR/api/(.*) /\$1 break;
        proxy_pass http://localhost:$BACKEND_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Redirection de la racine vers l'application par défaut
    location = / {
        return 301 /$VIRTUAL_DIR/;
    }
    
    # Gestion des erreurs
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
EOL
print_success "Configuration Nginx créée."

# 12. Créer un lien symbolique pour activer la configuration
print_step 12 "Activation de la configuration Nginx..."
# Supprimer toutes les configurations existantes pour éviter les conflits
rm -f /etc/nginx/sites-enabled/*
ln -sf "/etc/nginx/sites-available/$VIRTUAL_DIR" /etc/nginx/sites-enabled/
print_success "Configuration Nginx activée."

# 13. Vérifier la configuration Nginx
print_step 13 "Vérification de la configuration Nginx..."
nginx -t
if [ $? -ne 0 ]; then
    print_error "Erreur dans la configuration Nginx. Veuillez corriger les erreurs avant de continuer."
fi
print_success "Configuration Nginx valide."

# 14. Redémarrer Nginx avec gestion améliorée des erreurs
print_step 14 "Redémarrage de Nginx..."

# Arrêter complètement Nginx d'abord
systemctl stop nginx
sleep 2

# Vérifier et tenter de libérer le port 80 si nécessaire
check_and_free_port_80

# Tenter de démarrer Nginx
systemctl start nginx
NGINX_START_RESULT=$?

if [ $NGINX_START_RESULT -ne 0 ]; then
    print_warning "Erreur lors du démarrage de Nginx. Affichage des logs:"
    journalctl -xeu nginx.service --no-pager | tail -n 20
    
    # Tentative alternative de démarrage
    print_info "Tentative alternative de démarrage de Nginx..."
    killall -9 nginx 2>/dev/null
    sleep 2
    nginx
    
    if [ $? -ne 0 ]; then
        print_warning "Nginx n'a pas pu démarrer. Vérification des processus en cours sur le port 80..."
        netstat -tulpn | grep ":80 "
        
        echo -e "${YELLOW}Voulez-vous continuer le déploiement malgré cette erreur? (o/n)${NC}"
        read -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Oo]$ ]]; then
            print_error "Impossible de redémarrer Nginx. Déploiement interrompu."
        else
            print_warning "Continuation du déploiement malgré l'erreur Nginx..."
        fi
    else
        print_success "Nginx démarré avec la méthode alternative."
    fi
else
    print_success "Nginx redémarré."
fi

# 15. Créer un fichier de configuration PM2
print_step 15 "Création du fichier de configuration PM2..."
cd "$BASE_DIR"
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: '$VIRTUAL_DIR-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: $BACKEND_PORT
    }
  }]
};
EOL
print_success "Configuration PM2 créée."

# 16. Démarrer l'application avec PM2
print_step 16 "Démarrage de l'application avec PM2..."
cd "$BASE_DIR"
pm2 start ecosystem.config.js --env production || print_error "Impossible de démarrer l'application avec PM2."
pm2 save || print_error "Impossible de sauvegarder la configuration PM2."

# Configurer PM2 pour démarrer automatiquement
print_info "Configuration de PM2 pour démarrer automatiquement..."
pm2 startup
echo "Exécutez la commande ci-dessus si nécessaire pour configurer le démarrage automatique."

# Afficher un résumé du déploiement
echo -e "\n${GREEN}===============================================${NC}"
echo -e "${GREEN}Déploiement terminé !${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "L'application est accessible à l'adresse : ${BLUE}http://$DOMAIN_NAME/$VIRTUAL_DIR${NC}"
echo -e "L'API est accessible à l'adresse : ${BLUE}http://$DOMAIN_NAME/$VIRTUAL_DIR/api${NC}"
echo -e "\nLe backend est géré par PM2 et démarrera automatiquement au redémarrage du système."
echo -e "\n${YELLOW}Commandes utiles :${NC}"
echo -e "  - ${BLUE}pm2 list${NC} : Afficher la liste des applications"
echo -e "  - ${BLUE}pm2 logs${NC} : Afficher les logs"
echo -e "  - ${BLUE}pm2 logs $VIRTUAL_DIR-backend${NC} : Afficher les logs du backend"
echo -e "  - ${BLUE}pm2 restart $VIRTUAL_DIR-backend${NC} : Redémarrer le backend"
echo -e "  - ${BLUE}systemctl restart nginx${NC} : Redémarrer Nginx"

# Vérifier l'état final de Nginx
NGINX_RUNNING=$(systemctl is-active nginx)
if [ "$NGINX_RUNNING" != "active" ]; then
    echo -e "\n${YELLOW}ATTENTION : Nginx n'est pas en cours d'exécution. Vous devrez le démarrer manuellement.${NC}"
    echo -e "Commandes de dépannage pour Nginx :"
    echo -e "  - ${BLUE}sudo systemctl status nginx${NC} : Vérifier l'état de Nginx"
    echo -e "  - ${BLUE}sudo journalctl -xeu nginx.service${NC} : Consulter les logs de Nginx"
    echo -e "  - ${BLUE}sudo netstat -tulpn | grep :80${NC} : Vérifier si le port 80 est utilisé"
    echo -e "  - ${BLUE}sudo nginx -t${NC} : Tester la configuration de Nginx"
fi

echo -e "${GREEN}===============================================${NC}"
