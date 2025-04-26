@echo off
echo ===============================================
echo Déploiement complet de l'application en production sur Windows
echo ===============================================

REM Définir le répertoire de base
set BASE_DIR=%~dp0..
echo Répertoire de base : %BASE_DIR%

REM 1. Vérifier si Node.js est installé
echo 1. Vérification de Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js n'est pas installé. Veuillez installer Node.js depuis https://nodejs.org/
    echo Une fois Node.js installé, exécutez à nouveau ce script.
    exit /b 1
) else (
    for /f "tokens=1,2,3 delims=." %%a in ('node -v') do set NODE_VERSION=%%a.%%b.%%c
    echo Node.js %NODE_VERSION:~1% est installé.
)

REM 2. Vérifier si Nginx est installé
echo 2. Vérification de Nginx...
if not exist "C:\nginx" (
    echo Nginx n'est pas installé. Installation de Nginx...
    
    REM Créer un répertoire temporaire pour le téléchargement
    mkdir "%TEMP%\nginx_install"
    cd "%TEMP%\nginx_install"
    
    REM Télécharger Nginx
    echo Téléchargement de Nginx...
    powershell -Command "Invoke-WebRequest -Uri 'http://nginx.org/download/nginx-1.24.0.zip' -OutFile 'nginx.zip'"
    
    echo Extraction de Nginx...
    powershell -Command "Expand-Archive -Path 'nginx.zip' -DestinationPath '.'"
    
    echo Installation de Nginx...
    mkdir "C:\nginx"
    xcopy /E /I /Y "nginx-1.24.0\*" "C:\nginx\"
    
    echo Nettoyage des fichiers temporaires...
    cd "%TEMP%"
    rmdir /S /Q "%TEMP%\nginx_install"
    
    echo Nginx a été installé dans C:\nginx
) else (
    echo Nginx est déjà installé dans C:\nginx
)

REM 3. Installer PM2 globalement s'il n'est pas déjà installé
echo 3. Vérification de PM2...
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installation de PM2...
    npm install -g pm2 windows-service
    echo PM2 a été installé.
) else (
    echo PM2 est déjà installé.
)

REM 4. Installer les dépendances du backend
echo 4. Installation des dépendances du backend...
cd /d %BASE_DIR%\backend
call npm install

REM 5. Installer les dépendances du frontend
echo 5. Installation des dépendances du frontend...
cd /d %BASE_DIR%\frontend
call npm install

REM 6. Construire le frontend pour la production
echo 6. Construction du frontend pour la production...
call npm run build:prod

REM 7. Créer le répertoire de destination si nécessaire
echo 7. Préparation du répertoire de déploiement...
if not exist "C:\nginx\html\fournisseurs" mkdir "C:\nginx\html\fournisseurs"

REM 8. Copier les fichiers du build dans le répertoire de Nginx
echo 8. Copie des fichiers du build vers le répertoire de Nginx...
xcopy /E /Y "build\*" "C:\nginx\html\fournisseurs\"

REM 9. Créer la configuration Nginx
echo 9. Création de la configuration Nginx...
(
echo worker_processes auto;
echo.
echo events {
echo     worker_connections 1024;
echo }
echo.
echo http {
echo     include       mime.types;
echo     default_type  application/octet-stream;
echo     sendfile        on;
echo     keepalive_timeout  65;
echo.    
echo     # Compression pour améliorer les performances
echo     gzip on;
echo     gzip_disable "msie6";
echo     gzip_vary on;
echo     gzip_proxied any;
echo     gzip_comp_level 6;
echo     gzip_buffers 16 8k;
echo     gzip_http_version 1.1;
echo     gzip_min_length 256;
echo     gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
echo.
echo     server {
echo         listen       80;
echo         server_name  localhost;
echo.        
echo         # Répertoire virtuel pour l'application de gestion des fournisseurs
echo         location /fournisseurs/ {
echo             alias C:/nginx/html/fournisseurs/;
echo             try_files $uri $uri/ /fournisseurs/index.html;
echo.            
echo             # Configuration de sécurité
echo             add_header X-Frame-Options "SAMEORIGIN";
echo             add_header X-XSS-Protection "1; mode=block";
echo             add_header X-Content-Type-Options "nosniff";
echo         }
echo.        
echo         # API pour l'application de gestion des fournisseurs
echo         location /fournisseurs/api/ {
echo             rewrite ^/fournisseurs/api/(.*) /$1 break;
echo             proxy_pass http://localhost:5005/;
echo             proxy_http_version 1.1;
echo             proxy_set_header Upgrade $http_upgrade;
echo             proxy_set_header Connection 'upgrade';
echo             proxy_set_header Host $host;
echo             proxy_cache_bypass $http_upgrade;
echo             proxy_set_header X-Real-IP $remote_addr;
echo             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo             proxy_set_header X-Forwarded-Proto $scheme;
echo         }
echo.        
echo         # Redirection de la racine vers l'application par défaut
echo         location = / {
echo             return 301 /fournisseurs/;
echo         }
echo.        
echo         # Gestion des erreurs
echo         error_page   500 502 503 504  /50x.html;
echo         location = /50x.html {
echo             root   html;
echo         }
echo     }
echo }
) > "C:\nginx\conf\nginx.conf"

REM 10. Redémarrer Nginx
echo 10. Redémarrage de Nginx...
taskkill /F /IM nginx.exe 2>NUL
timeout /t 2 /nobreak > NUL
cd /d C:\nginx
start nginx

REM 11. Créer un fichier de configuration PM2
echo 11. Création du fichier de configuration PM2...
cd /d %BASE_DIR%
(
echo module.exports = {
echo   apps: [{
echo     name: 'fournisseurs-backend',
echo     script: './backend/server.js',
echo     instances: 1,
echo     autorestart: true,
echo     watch: false,
echo     max_memory_restart: '1G',
echo     env_production: {
echo       NODE_ENV: 'production',
echo       PORT: 5005
echo     }
echo   }]
echo };
) > ecosystem.config.js

REM 12. Démarrer l'application avec PM2
echo 12. Démarrage de l'application avec PM2...
cd /d %BASE_DIR%
pm2 start ecosystem.config.js --env production

REM 13. Configurer PM2 pour démarrer automatiquement
echo 13. Configuration de PM2 pour démarrer automatiquement...
pm2-service-install -n PM2AppFournisseurs
pm2 save

echo ===============================================
echo Déploiement terminé avec succès !
echo ===============================================
echo L'application est accessible à l'adresse : http://localhost/fournisseurs
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
echo Pour accéder depuis d'autres machines, utilisez : http://%IP:~1%/fournisseurs
echo.
echo Le backend est géré par PM2 et démarrera automatiquement au redémarrage du système.
echo.
echo Commandes utiles :
echo   - pm2 list : Afficher la liste des applications
echo   - pm2 logs : Afficher les logs
echo   - pm2 restart fournisseurs-backend : Redémarrer le backend
echo   - taskkill /F /IM nginx.exe ^& cd /d C:\nginx ^& start nginx : Redémarrer Nginx
echo ===============================================
