@echo off
echo Nettoyage de la base de données...
node scripts/clean_database.js

echo.
echo Import de la base de données...
psql -U admin -d gestion_fournisseurs -f %1

echo.
echo Import terminé.
