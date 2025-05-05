#!/bin/bash

# Script pour exécuter tous les scripts SQL de création de tables
# Auteur: Cascade AI
# Date: 2025-05-05

# Définir le répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Vérifier si psql est installé
if ! command -v psql &> /dev/null; then
  echo "ERREUR: La commande psql n'est pas installée."
  echo "Veuillez installer le client PostgreSQL avec une des commandes suivantes:"
  echo "  - Sur Ubuntu/Debian: sudo apt-get install postgresql-client"
  echo "  - Sur Amazon Linux/RHEL: sudo yum install postgresql"
  echo "  - Sur Alpine: apk add postgresql-client"
  
  # Alternative: utiliser Docker si disponible
  if command -v docker &> /dev/null; then
    echo ""
    echo "Alternative: Vous pouvez utiliser Docker pour exécuter les scripts SQL."
    echo "Exemple pour create_group_metadata_table.sql:"
    echo "docker run --rm -v \"$(pwd):/scripts\" -e PGPASSWORD=\"\$DB_PASSWORD\" postgres:13 psql -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME -f /scripts/create_group_metadata_table.sql"
  fi
  
  exit 1
fi

# Charger les variables d'environnement
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
else
  echo "Fichier .env non trouvé. Veuillez vérifier qu'il existe dans le répertoire parent."
  exit 1
fi

# Vérifier que les variables nécessaires sont définies
if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  echo "Les variables DB_USER et DB_NAME doivent être définies dans le fichier .env"
  exit 1
fi

# Définir les variables de connexion
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_PASSWORD=${DB_PASSWORD:-""}

# Fonction pour exécuter un script SQL
run_sql_script() {
  local script_name=$1
  echo "============================================="
  echo "Exécution du script SQL: $script_name"
  echo "============================================="
  
  if [ -z "$DB_PASSWORD" ]; then
    # Sans mot de passe
    PGPASSWORD="" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$script_name"
  else
    # Avec mot de passe
    PGPASSWORD="$DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$script_name"
  fi
  
  # Vérifier si l'exécution a réussi
  if [ $? -eq 0 ]; then
    echo "✅ Script $script_name exécuté avec succès!"
  else
    echo "❌ Une erreur s'est produite lors de l'exécution du script $script_name."
    return 1
  fi
  echo ""
}

# Afficher un message de début
echo "Début de l'exécution de tous les scripts de création de tables..."
echo "Base de données: $DB_NAME sur $DB_HOST:$DB_PORT"
echo ""

# Liste des scripts SQL à exécuter
SCRIPTS=(
  "create_group_metadata_table.sql"
  "create_system_settings_table.sql"
)

# Exécuter chaque script
SUCCESS=true
for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    run_sql_script "$script" || SUCCESS=false
  else
    echo "❌ Le script $script n'existe pas."
    SUCCESS=false
  fi
done

# Afficher un résumé
echo "============================================="
if [ "$SUCCESS" = true ]; then
  echo "✅ Tous les scripts ont été exécutés avec succès!"
else
  echo "⚠️ Certains scripts n'ont pas pu être exécutés correctement."
  echo "Veuillez vérifier les messages d'erreur ci-dessus."
fi
echo "============================================="

echo "Opération terminée."
