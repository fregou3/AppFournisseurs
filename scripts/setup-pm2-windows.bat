@echo off
echo Installation et configuration de PM2 pour l'application de gestion des fournisseurs...

REM Vérifier si Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js n'est pas installé. Veuillez installer Node.js depuis https://nodejs.org/
    echo Une fois Node.js installé, exécutez à nouveau ce script.
    exit /b 1
) else (
    echo Node.js est déjà installé.
)

REM Installer PM2 globalement s'il n'est pas déjà installé
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installation de PM2...
    npm install -g pm2 windows-service
    echo PM2 a été installé.
) else (
    echo PM2 est déjà installé.
)

REM Créer un fichier de configuration PM2 pour l'application
echo Création du fichier de configuration PM2 pour l'application...
cd /d %~dp0..

(
echo module.exports = {
echo   apps: [{
echo     name: 'fournisseurs-backend',
echo     script: './backend/server.js',
echo     instances: 1,
echo     autorestart: true,
echo     watch: false,
echo     max_memory_restart: '1G',
echo     env: {
echo       NODE_ENV: 'development',
echo       PORT: 5005
echo     },
echo     env_production: {
echo       NODE_ENV: 'production',
echo       PORT: 5005
echo     }
echo   }]
echo };
) > ecosystem.config.js

echo Configuration PM2 créée : ecosystem.config.js

REM Démarrer l'application avec PM2 en mode production
echo Démarrage de l'application avec PM2 en mode production...
pm2 start ecosystem.config.js --env production

REM Configurer PM2 pour démarrer automatiquement au démarrage du système
echo Configuration de PM2 pour démarrer automatiquement au démarrage du système...
pm2-service-install -n PM2AppFournisseurs

REM Sauvegarder la configuration PM2
echo Sauvegarde de la configuration PM2...
pm2 save

echo PM2 a été configuré avec succès pour l'application de gestion des fournisseurs.
echo L'application backend démarrera automatiquement au démarrage du système.
echo Commandes utiles :
echo   - pm2 list : Afficher la liste des applications gérées par PM2
echo   - pm2 logs : Afficher les logs de toutes les applications
echo   - pm2 logs fournisseurs-backend : Afficher les logs de l'application backend
echo   - pm2 restart fournisseurs-backend : Redémarrer l'application backend
echo   - pm2 stop fournisseurs-backend : Arrêter l'application backend
echo   - pm2 delete fournisseurs-backend : Supprimer l'application de PM2
