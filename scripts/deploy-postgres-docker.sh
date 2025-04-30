#!/bin/bash

##############################################################
# Script de déploiement de la base de données PostgreSQL pour l'application de gestion des fournisseurs
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
    echo -e "${GREEN}✓ $1${NC}"
}

# Fonction pour afficher les messages d'erreur
print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Fonction pour afficher les messages d'information
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Nombre total d'étapes
TOTAL_STEPS=5

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez l'installer avant de continuer."
fi

# Définir les variables pour la base de données
DB_NAME="gestion_fournisseurs"
DB_USER="admin"
DB_PASSWORD="admin123"
DB_PORT="5435"
CONTAINER_NAME="postgres_fournisseurs"
POSTGRES_VERSION="14"
DATA_DIR="/var/lib/postgresql/data/fournisseurs"

# Afficher les informations de configuration
print_info "Configuration de la base de données PostgreSQL :"
print_info "- Nom de la base de données : $DB_NAME"
print_info "- Utilisateur : $DB_USER"
print_info "- Port : $DB_PORT"
print_info "- Conteneur : $CONTAINER_NAME"
print_info "- Version PostgreSQL : $POSTGRES_VERSION"
print_info "- Répertoire des données : $DATA_DIR"

# Demander confirmation avant de continuer
echo -e "${YELLOW}Ce script va déployer une base de données PostgreSQL dans un conteneur Docker.${NC}"
read -p "Voulez-vous continuer ? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
    print_info "Déploiement annulé."
    exit 0
fi

# 1. Vérifier si le conteneur existe déjà
print_step 1 "Vérification de l'existence du conteneur..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_info "Le conteneur $CONTAINER_NAME existe déjà."
    read -p "Voulez-vous supprimer le conteneur existant et en créer un nouveau ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        print_info "Arrêt et suppression du conteneur existant..."
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
        print_success "Conteneur supprimé."
    else
        print_info "Utilisation du conteneur existant."
        
        # Vérifier si le conteneur est en cours d'exécution
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            print_success "Le conteneur est déjà en cours d'exécution."
        else
            print_info "Démarrage du conteneur existant..."
            docker start $CONTAINER_NAME
            print_success "Conteneur démarré."
        fi
        
        print_info "Vous pouvez vous connecter à la base de données avec :"
        print_info "- Hôte : localhost"
        print_info "- Port : $DB_PORT"
        print_info "- Base de données : $DB_NAME"
        print_info "- Utilisateur : $DB_USER"
        print_info "- Mot de passe : $DB_PASSWORD"
        exit 0
    fi
fi

# 2. Créer le répertoire pour les données persistantes
print_step 2 "Création du répertoire pour les données persistantes..."
sudo mkdir -p $DATA_DIR
sudo chmod 777 $DATA_DIR
print_success "Répertoire créé : $DATA_DIR"

# 3. Lancer le conteneur PostgreSQL
print_step 3 "Lancement du conteneur PostgreSQL..."
docker run --name $CONTAINER_NAME \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -e POSTGRES_DB=$DB_NAME \
    -v $DATA_DIR:/var/lib/postgresql/data \
    -p $DB_PORT:5432 \
    -d postgres:$POSTGRES_VERSION

# Vérifier si le conteneur a été créé avec succès
if [ $? -ne 0 ]; then
    print_error "Impossible de créer le conteneur PostgreSQL."
fi
print_success "Conteneur PostgreSQL créé et démarré."

# 4. Attendre que PostgreSQL soit prêt
print_step 4 "Attente du démarrage de PostgreSQL..."
sleep 5
for i in {1..10}; do
    if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
        print_success "PostgreSQL est prêt."
        break
    fi
    print_info "Attente de PostgreSQL... ($i/10)"
    sleep 2
    if [ $i -eq 10 ]; then
        print_error "PostgreSQL n'est pas prêt après 20 secondes. Veuillez vérifier les logs avec : docker logs $CONTAINER_NAME"
    fi
done

# 5. Configurer le démarrage automatique
print_step 5 "Configuration du démarrage automatique..."
docker update --restart=always $CONTAINER_NAME
print_success "Démarrage automatique configuré."

# Afficher un résumé
echo -e "\n${GREEN}===============================================${NC}"
echo -e "${GREEN}Déploiement de PostgreSQL terminé !${NC}"
echo -e "${GREEN}===============================================${NC}"
echo -e "La base de données PostgreSQL est accessible avec les paramètres suivants :"
echo -e "- Hôte : localhost"
echo -e "- Port : ${BLUE}$DB_PORT${NC}"
echo -e "- Base de données : ${BLUE}$DB_NAME${NC}"
echo -e "- Utilisateur : ${BLUE}$DB_USER${NC}"
echo -e "- Mot de passe : ${BLUE}$DB_PASSWORD${NC}"
echo -e "\n${YELLOW}Commandes utiles :${NC}"
echo -e "  - ${BLUE}docker logs $CONTAINER_NAME${NC} : Afficher les logs"
echo -e "  - ${BLUE}docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME${NC} : Se connecter à la base de données"
echo -e "  - ${BLUE}docker stop $CONTAINER_NAME${NC} : Arrêter le conteneur"
echo -e "  - ${BLUE}docker start $CONTAINER_NAME${NC} : Démarrer le conteneur"
echo -e "${GREEN}===============================================${NC}"

# Vérifier si le conteneur est en cours d'exécution
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_error "Le conteneur n'est pas en cours d'exécution. Veuillez vérifier les logs avec : docker logs $CONTAINER_NAME"
fi
