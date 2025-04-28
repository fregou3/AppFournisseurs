#!/bin/bash

##############################################################
# Script de mise à jour des modifications pour l'application de gestion des fournisseurs
# Environnement : Ubuntu (Production)
# IP publique : 15.188.198.103
# Version : 1.0
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
    echo -e "${GREEN}$1${NC}"
}

# Fonction pour afficher les messages d'erreur
print_error() {
    echo -e "${RED}ERREUR: $1${NC}"
    exit 1
}

# Fonction pour afficher les messages d'information
print_info() {
    echo -e "${YELLOW}INFO: $1${NC}"
}

# Nombre total d'étapes
TOTAL_STEPS=5

# Variables
APP_DIR="/home/ubuntu/AppGetionFournisseurs_3.9_EN/AppFournisseurs"
NGINX_CONF_DIR="/etc/nginx/sites-available"
FRONTEND_DIR="${APP_DIR}/frontend"
BACKEND_DIR="${APP_DIR}/backend"
WWW_DIR="/var/www/fournisseurs"

# Vérifier que le script est exécuté avec les privilèges sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté avec les privilèges sudo."
fi

# Étape 1: Mise à jour du dépôt Git
print_step 1 "Mise à jour du dépôt Git"
cd ${APP_DIR} && git fetch && git pull || print_error "Impossible de mettre à jour le dépôt Git"
print_success "Dépôt Git mis à jour avec succès"

# Étape 2: Mettre à jour la configuration Nginx
print_step 2 "Mise à jour de la configuration Nginx"
cp ${APP_DIR}/nginx/nginx.prod.fixed.conf ${NGINX_CONF_DIR}/fournisseurs-fixed || print_error "Impossible de copier la configuration Nginx"
ln -sf ${NGINX_CONF_DIR}/fournisseurs-fixed /etc/nginx/sites-enabled/ || print_error "Impossible de configurer Nginx"
nginx -t && systemctl restart nginx || print_error "Impossible de redémarrer Nginx"
print_success "Configuration Nginx mise à jour avec succès"

# Étape 3: Mise à jour des dépendances NPM si nécessaire
print_step 3 "Mise à jour des dépendances NPM"
cd ${FRONTEND_DIR} && npm install || print_info "Mise à jour des dépendances frontend échouée, mais on continue"
cd ${BACKEND_DIR} && npm install || print_info "Mise à jour des dépendances backend échouée, mais on continue"
print_success "Dépendances NPM mises à jour avec succès"

# Étape 4: Reconstruire le frontend
print_step 4 "Reconstruction du frontend"
cd ${FRONTEND_DIR} && npm run build || print_error "Impossible de reconstruire le frontend"
cp -r ${FRONTEND_DIR}/build/* ${WWW_DIR}/ || print_error "Impossible de copier les fichiers du frontend"
print_success "Frontend reconstruit et déployé avec succès"

# Étape 5: Redémarrer le backend
print_step 5 "Redémarrage du backend"
pm2 restart fournisseurs-backend || print_error "Impossible de redémarrer le backend"
print_success "Backend redémarré avec succès"

# Résumé
echo -e "\n${GREEN}===============================================${NC}"
echo -e "${GREEN}Mise à jour terminée avec succès !${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "L'application est accessible à l'adresse : ${BLUE}http://15.188.198.103/fournisseurs${NC}"
echo -e "L'API est accessible à l'adresse : ${BLUE}http://15.188.198.103/fournisseurs/api${NC}"
echo -e "\n${YELLOW}Commandes utiles :${NC}"
echo -e "- Vérifier l'état du backend : ${BLUE}pm2 status${NC}"
echo -e "- Vérifier les logs du backend : ${BLUE}pm2 logs fournisseurs-backend${NC}"
echo -e "- Vérifier les logs de Nginx : ${BLUE}tail -f /var/log/nginx/error.log${NC}"
