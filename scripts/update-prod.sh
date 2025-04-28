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
SERVER_IP="15.188.198.103"
SERVER_USER="ubuntu"
APP_DIR="/home/ubuntu/AppGetionFournisseurs_3.9_EN/AppFournisseurs"
NGINX_CONF_DIR="/etc/nginx/sites-available"

# Vérifier que le script est exécuté avec les privilèges sudo
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté avec les privilèges sudo."
fi

# Étape 1: Connexion SSH au serveur et mise à jour du dépôt Git
print_step 1 "Mise à jour du dépôt Git sur le serveur"
ssh ${SERVER_USER}@${SERVER_IP} "cd ${APP_DIR} && sudo git fetch && sudo git pull" || print_error "Impossible de mettre à jour le dépôt Git"
print_success "Dépôt Git mis à jour avec succès"

# Étape 2: Copier la nouvelle configuration Nginx
print_step 2 "Mise à jour de la configuration Nginx"
scp -r nginx/nginx.prod.fixed.conf ${SERVER_USER}@${SERVER_IP}:/tmp/nginx.prod.fixed.conf || print_error "Impossible de copier la configuration Nginx"
ssh ${SERVER_USER}@${SERVER_IP} "sudo cp /tmp/nginx.prod.fixed.conf ${NGINX_CONF_DIR}/fournisseurs-fixed && sudo ln -sf ${NGINX_CONF_DIR}/fournisseurs-fixed /etc/nginx/sites-enabled/" || print_error "Impossible de configurer Nginx"
ssh ${SERVER_USER}@${SERVER_IP} "sudo nginx -t && sudo systemctl restart nginx" || print_error "Impossible de redémarrer Nginx"
print_success "Configuration Nginx mise à jour avec succès"

# Étape 3: Mise à jour des dépendances NPM si nécessaire
print_step 3 "Mise à jour des dépendances NPM"
ssh ${SERVER_USER}@${SERVER_IP} "cd ${APP_DIR}/frontend && sudo npm install" || print_info "Mise à jour des dépendances frontend échouée, mais on continue"
ssh ${SERVER_USER}@${SERVER_IP} "cd ${APP_DIR}/backend && sudo npm install" || print_info "Mise à jour des dépendances backend échouée, mais on continue"
print_success "Dépendances NPM mises à jour avec succès"

# Étape 4: Reconstruire le frontend
print_step 4 "Reconstruction du frontend"
ssh ${SERVER_USER}@${SERVER_IP} "cd ${APP_DIR}/frontend && sudo npm run build" || print_error "Impossible de reconstruire le frontend"
ssh ${SERVER_USER}@${SERVER_IP} "sudo cp -r ${APP_DIR}/frontend/build/* /var/www/fournisseurs/" || print_error "Impossible de copier les fichiers du frontend"
print_success "Frontend reconstruit et déployé avec succès"

# Étape 5: Redémarrer le backend
print_step 5 "Redémarrage du backend"
ssh ${SERVER_USER}@${SERVER_IP} "sudo pm2 restart fournisseurs-backend" || print_error "Impossible de redémarrer le backend"
print_success "Backend redémarré avec succès"

# Résumé
echo -e "\n${GREEN}===============================================${NC}"
echo -e "${GREEN}Mise à jour terminée avec succès !${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "L'application est accessible à l'adresse : ${BLUE}http://${SERVER_IP}/fournisseurs${NC}"
echo -e "L'API est accessible à l'adresse : ${BLUE}http://${SERVER_IP}/fournisseurs/api${NC}"
echo -e "\n${YELLOW}Commandes utiles :${NC}"
echo -e "- Vérifier l'état du backend : ${BLUE}ssh ${SERVER_USER}@${SERVER_IP} \"sudo pm2 status\"${NC}"
echo -e "- Vérifier les logs du backend : ${BLUE}ssh ${SERVER_USER}@${SERVER_IP} \"sudo pm2 logs fournisseurs-backend\"${NC}"
echo -e "- Vérifier les logs de Nginx : ${BLUE}ssh ${SERVER_USER}@${SERVER_IP} \"sudo tail -f /var/log/nginx/error.log\"${NC}"
