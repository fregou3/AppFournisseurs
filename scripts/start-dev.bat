@echo off
echo Démarrage de l'application en mode développement...

REM Démarrage du backend sur le port 5005
cd /d %~dp0..\backend
start cmd /k "npm run dev:port"

REM Attendre quelques secondes pour que le backend démarre
timeout /t 5 /nobreak

REM Démarrage du frontend sur le port 3005
cd /d %~dp0..\frontend
start cmd /k "npm run start"

echo L'application est démarrée :
echo - Frontend : http://localhost:3005
echo - Backend : http://localhost:5005
