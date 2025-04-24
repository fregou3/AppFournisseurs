#!/bin/bash

# Configuration de la base de données
export PGHOST=localhost
export PGPORT=5435
export PGUSER=admin
export PGPASSWORD=admin123
export PGDATABASE=gestion_fournisseurs

# Vérifier si le fichier est spécifié
if [ $# -ne 1 ]; then
    echo "Usage: $0 backup_file"
    echo "Example: $0 gestion_fournisseurs_backup.sql"
    exit 1
fi

# Vérifier si le fichier existe
if [ ! -f "$1" ]; then
    echo "Erreur: Le fichier '$1' n'existe pas"
    exit 1
fi

# Importer la base de données
echo "Importation de la base de données..."
docker exec -i gestion_fournisseurs_db psql -U ${PGUSER} -d ${PGDATABASE} < "$1"

echo "Importation terminée avec succès."
