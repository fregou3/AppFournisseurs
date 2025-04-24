@echo off
setlocal

:: Définir les variables d'environnement PostgreSQL
set PGUSER=admin
set PGPASSWORD=admin123
set PGDATABASE=gestion_fournisseurs

:: Vérifier si le fichier est spécifié
if "%~1"=="" (
    echo Usage: %0 backup_file
    echo Example: %0 backup.sql
    exit /b 1
)

:: Nettoyage de la base de données
echo Nettoyage de la base de données...
node clean_database.js

:: Importer la base de données
echo.
echo Import de la base de données...
docker exec -i gestion_fournisseurs_db psql -U %PGUSER% -d %PGDATABASE% < %1

echo.
echo Import terminé.

endlocal
