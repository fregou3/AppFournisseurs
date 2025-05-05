#!/bin/bash

# Script pour exécuter le fichier SQL qui crée la table system_settings
# Utilise Docker pour exécuter le script SQL sans avoir besoin d'installer psql
# Auteur: Cascade AI
# Date: 2025-05-05

# Définir le répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Fonction pour afficher un message en couleur
print_color() {
  local color=$1
  local message=$2
  
  case $color in
    "green") echo -e "\033[0;32m$message\033[0m" ;;
    "red") echo -e "\033[0;31m$message\033[0m" ;;
    "yellow") echo -e "\033[0;33m$message\033[0m" ;;
    "blue") echo -e "\033[0;34m$message\033[0m" ;;
    *) echo "$message" ;;
  esac
}

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
  print_color "red" "ERREUR: Docker n'est pas installé."
  print_color "yellow" "Veuillez installer Docker avec une des commandes suivantes:"
  print_color "yellow" "  - Sur Ubuntu/Debian: sudo apt-get install docker.io"
  print_color "yellow" "  - Sur Amazon Linux/RHEL: sudo yum install docker"
  print_color "yellow" "  - Ou suivez les instructions sur https://docs.docker.com/engine/install/"
  exit 1
fi

# Charger les variables d'environnement
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
else
  print_color "red" "Fichier .env non trouvé. Veuillez vérifier qu'il existe dans le répertoire parent."
  exit 1
fi

# Vérifier que les variables nécessaires sont définies
if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  print_color "red" "Les variables DB_USER et DB_NAME doivent être définies dans le fichier .env"
  exit 1
fi

# Définir les variables de connexion
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_PASSWORD=${DB_PASSWORD:-""}

# Afficher un message de début
print_color "blue" "Exécution du script SQL pour créer/recréer la table system_settings..."
print_color "blue" "Utilisation de Docker pour exécuter le script SQL"

# Télécharger l'image Docker de PostgreSQL si nécessaire
print_color "yellow" "Téléchargement de l'image Docker PostgreSQL si nécessaire..."
docker pull postgres:13 > /dev/null

# Exécuter le script SQL avec Docker
print_color "yellow" "Exécution du script SQL avec Docker..."

if [ -z "$DB_PASSWORD" ]; then
  # Sans mot de passe
  docker run --rm -v "$SCRIPT_DIR:/scripts" \
    postgres:13 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /scripts/create_system_settings_table.sql
  RESULT=$?
else
  # Avec mot de passe
  docker run --rm -v "$SCRIPT_DIR:/scripts" \
    -e PGPASSWORD="$DB_PASSWORD" \
    postgres:13 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /scripts/create_system_settings_table.sql
  RESULT=$?
fi

# Vérifier si l'exécution a réussi
if [ $RESULT -eq 0 ]; then
  print_color "green" "\u2705 Script SQL exécuté avec succès!"
  print_color "green" "La table system_settings a été supprimée et recréée."
else
  print_color "red" "\u274c Une erreur s'est produite lors de l'exécution du script SQL."
  
  # Conseils de dépannage
  print_color "yellow" "\nConseils de dépannage:"
  print_color "yellow" "1. Vérifiez que les informations de connexion à la base de données sont correctes dans le fichier .env"
  print_color "yellow" "2. Vérifiez que la base de données est accessible depuis ce serveur"
  print_color "yellow" "3. Si vous utilisez localhost comme hôte, essayez d'utiliser l'adresse IP du serveur PostgreSQL"
  print_color "yellow" "   car Docker ne peut pas accéder directement au localhost de la machine hôte"
  
  exit 1
fi

print_color "blue" "Opération terminée."
