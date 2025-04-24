#!/bin/bash

# Configuration de la base de données
export PGHOST=localhost
export PGPORT=5435
export PGUSER=admin
export PGPASSWORD=admin123
export PGDATABASE=gestion_fournisseurs

# Créer le nom du fichier de sauvegarde avec la date et l'heure
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="gestion_fournisseurs_${TIMESTAMP}.sql"

# Exporter la base de données complète
docker exec gestion_fournisseurs_db pg_dump -U ${PGUSER} -d ${PGDATABASE} --clean --if-exists --create > "${BACKUP_FILE}"

echo "Base de données exportée avec succès dans : ${BACKUP_FILE}"
