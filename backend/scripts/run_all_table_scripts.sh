#!/bin/bash

# Script simple pour exécuter tous les scripts SQL de création de tables
# Utilise Docker pour exécuter les scripts SQL directement
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
echo "Début de l'exécution de tous les scripts de création de tables..."

# Créer un conteneur PostgreSQL temporaire et exécuter les scripts SQL
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

# Liste des scripts SQL à exécuter
SCRIPTS=(
  "create_group_metadata_table.sql"
  "create_system_settings_table.sql"
)

# Fonction pour exécuter un script SQL
run_sql_script() {
  local script_name=$1
  echo "=============================================="
  echo "Exécution du script SQL: $script_name"
  echo "=============================================="
  
  # Copier le script SQL dans le conteneur
  docker cp "$SCRIPT_DIR/$script_name" pg-temp:/tmp/
  
  # Exécuter le script SQL dans le conteneur
  docker exec pg-temp psql -U postgres -d postgres -f "/tmp/$script_name"
  local result=$?
  
  # Vérifier si l'exécution a réussi
  if [ $result -eq 0 ]; then
    echo "\u2705 Script $script_name exécuté avec succès!"
    return 0
  else
    echo "\u274c Une erreur s'est produite lors de l'exécution du script $script_name."
    return 1
  fi
}

# Exécuter chaque script
SUCCESS=true
for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    run_sql_script "$script" || SUCCESS=false
  else
    echo "\u274c Le script $script n'existe pas."
    SUCCESS=false
  fi
done

# Arrêter et supprimer le conteneur PostgreSQL
echo "Arrêt du conteneur PostgreSQL..."
docker stop pg-temp > /dev/null

# Supprimer le réseau Docker
docker network rm pg-network 2>/dev/null || true

# Afficher un résumé
echo "=============================================="
if [ "$SUCCESS" = true ]; then
  echo "\u2705 Tous les scripts ont été exécutés avec succès!"
else
  echo "\u26a0\ufe0f Certains scripts n'ont pas pu être exécutés correctement."
  echo "Veuillez vérifier les messages d'erreur ci-dessus."
fi
echo "=============================================="

echo "Opération terminée."
