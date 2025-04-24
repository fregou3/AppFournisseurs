@echo off
setlocal

:: Configuration de la base de données
set PGHOST=localhost
set PGPORT=5435
set PGUSER=admin
set PGPASSWORD=admin123
set PGDATABASE=gestion_fournisseurs

:: Créer le nom du fichier de sauvegarde avec la date et l'heure
set TIMESTAMP=%DATE:~6,4%%DATE:~3,2%%DATE:~0,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=gestion_fournisseurs_%TIMESTAMP%.sql

:: Exporter la base de données complète
docker exec gestion_fournisseurs_db pg_dump -U %PGUSER% -d %PGDATABASE% --clean --if-exists --create > %BACKUP_FILE%

echo Base de données exportée avec succès dans : %BACKUP_FILE%

endlocal
