#!/bin/bash

# Script simple pour exécuter le fichier SQL qui crée la table system_settings
# Utilise Docker pour exécuter le script SQL directement
# Auteur: Cascade AI
# Date: 2025-05-05

# Définir le répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
  echo "ERREUR: Docker n'est pas installé."
  echo "Veuillez installer Docker avec une des commandes suivantes:"
  echo "  - Sur Ubuntu/Debian: sudo apt-get install docker.io"
  echo "  - Sur Amazon Linux/RHEL: sudo yum install docker"
  exit 1
fi

# Afficher un message de début
echo "Exécution du script SQL pour créer/recréer la table system_settings..."

# Créer un conteneur PostgreSQL temporaire et exécuter le script SQL
echo "Création d'un conteneur PostgreSQL temporaire..."

# Créer un réseau Docker pour la communication entre conteneurs
docker network create pg-network 2>/dev/null || true

# Lancer un conteneur PostgreSQL temporaire
docker run --rm -d \
  --name pg-temp \
  --network pg-network \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  postgres:13

# Attendre que PostgreSQL soit prêt
echo "Attente du démarrage de PostgreSQL..."
sleep 5

# Copier le script SQL dans le conteneur
docker cp "$SCRIPT_DIR/create_system_settings_table.sql" pg-temp:/tmp/

# Exécuter le script SQL dans le conteneur
echo "Exécution du script SQL..."
docker exec pg-temp psql -U postgres -d postgres -f /tmp/create_system_settings_table.sql
RESULT=$?

# Arrêter et supprimer le conteneur PostgreSQL
echo "Arrêt du conteneur PostgreSQL..."
docker stop pg-temp > /dev/null

# Supprimer le réseau Docker
docker network rm pg-network 2>/dev/null || true

# Vérifier si l'exécution a réussi
if [ $RESULT -eq 0 ]; then
  echo "\u2705 Script SQL exécuté avec succès!"
  echo "La table system_settings a été supprimée et recréée."
else
  echo "\u274c Une erreur s'est produite lors de l'exécution du script SQL."
  exit 1
fi

echo "Opération terminée."
