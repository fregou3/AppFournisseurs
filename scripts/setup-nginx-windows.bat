@echo off
echo Installation et configuration de Nginx pour l'application de gestion des fournisseurs...

REM Vérifier si Nginx est déjà installé
if exist "C:\nginx" (
    echo Nginx est déjà installé dans C:\nginx
) else (
    echo Téléchargement de Nginx...
    
    REM Créer un répertoire temporaire pour le téléchargement
    mkdir "%TEMP%\nginx_install"
    cd "%TEMP%\nginx_install"
    
    REM Télécharger Nginx
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
)

REM Créer les répertoires pour l'application
echo Création des répertoires pour l'application...
if not exist "C:\nginx\html\fournisseurs" mkdir "C:\nginx\html\fournisseurs"

REM Copier la configuration Nginx
echo Création de la configuration Nginx pour l'application...
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

REM Créer un service Windows pour Nginx (nécessite NSSM - Non-Sucking Service Manager)
echo Pour créer un service Windows pour Nginx, vous devez installer NSSM.
echo Vous pouvez le télécharger depuis https://nssm.cc/download
echo.
echo Une fois NSSM installé, exécutez les commandes suivantes pour créer un service :
echo nssm install nginx C:\nginx\nginx.exe
echo nssm set nginx AppDirectory C:\nginx
echo nssm set nginx Description "Nginx Web Server"
echo nssm start nginx
echo.

REM Démarrer Nginx
echo Démarrage de Nginx...
taskkill /F /IM nginx.exe 2>NUL
timeout /t 2 /nobreak > NUL
cd /d C:\nginx
start nginx

echo Nginx a été configuré avec succès pour l'application de gestion des fournisseurs.
echo L'application sera accessible à l'adresse : http://localhost/fournisseurs
echo Pour accéder à l'application depuis d'autres machines, utilisez l'adresse IP du serveur.
