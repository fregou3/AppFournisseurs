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

:: Définir les noms des fichiers de sauvegarde
set BACKUP_FILE_ALL=gestion_fournisseurs_all_%TIMESTAMP%.sql
set BACKUP_FILE_EVAL2=gestion_fournisseurs_eval2_%TIMESTAMP%.sql
set BACKUP_FILE_NO_EVAL2=gestion_fournisseurs_no_eval2_%TIMESTAMP%.sql

:: 1. Exporter toutes les tables
echo Exportation de toutes les tables...
docker exec gestion_fournisseurs_db_V3 pg_dump -U %PGUSER% -d %PGDATABASE% --clean --if-exists --create > %BACKUP_FILE_ALL%
echo Base de données complète exportée avec succès dans : %BACKUP_FILE_ALL%

:: 2. Exporter uniquement les tables eval2
echo Exportation des tables eval2...
docker exec gestion_fournisseurs_db_V3 pg_dump -U %PGUSER% -d %PGDATABASE% --clean --if-exists --create --table="eval2*" > %BACKUP_FILE_EVAL2%
echo Tables eval2 exportées avec succès dans : %BACKUP_FILE_EVAL2%

:: 3. Exporter toutes les tables sauf eval2
echo Exportation des tables non-eval2...
docker exec gestion_fournisseurs_db_V3 pg_dump -U %PGUSER% -d %PGDATABASE% --clean --if-exists --create --exclude-table="eval2*" > %BACKUP_FILE_NO_EVAL2%
echo Tables non-eval2 exportées avec succès dans : %BACKUP_FILE_NO_EVAL2%

echo Toutes les sauvegardes ont été effectuées avec succès.

endlocal
