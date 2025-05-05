#!/bin/bash

# Script pour exécuter le fichier SQL qui crée la table system_settings
# Auteur: Cascade AI
# Date: 2025-05-05

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

# Afficher un message de début
echo "Exécution du script SQL pour créer/recréer la table system_settings..."

# Exécuter le script SQL
if [ -z "$DB_PASSWORD" ]; then
  # Sans mot de passe
  PGPASSWORD="" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f create_system_settings_table.sql
else
  # Avec mot de passe
  PGPASSWORD="$DB_PASSWORD" psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f create_system_settings_table.sql
fi

# Vérifier si l'exécution a réussi
if [ $? -eq 0 ]; then
  echo "Script SQL exécuté avec succès!"
  echo "La table system_settings a été supprimée et recréée."
else
  echo "Une erreur s'est produite lors de l'exécution du script SQL."
  exit 1
fi

echo "Opération terminée."
