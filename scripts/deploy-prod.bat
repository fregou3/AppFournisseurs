@echo off
echo Déploiement de l'application en mode production...

REM Construire le frontend pour la production
cd /d %~dp0..\frontend
echo Construction du frontend pour la production...
call npm run build:prod

REM Copier les fichiers du build dans le répertoire de Nginx
echo Copie des fichiers du build vers le répertoire de Nginx...
if not exist "C:\nginx\html\fournisseurs" mkdir "C:\nginx\html\fournisseurs"
xcopy /E /Y "build\*" "C:\nginx\html\fournisseurs\"

REM Copier la configuration Nginx
echo Copie de la configuration Nginx...
copy /Y "%~dp0..\nginx\nginx.prod.conf" "C:\nginx\conf\nginx.conf"

REM Redémarrer Nginx
echo Redémarrage de Nginx...
net stop nginx
timeout /t 2 /nobreak
net start nginx

REM Démarrer le backend en mode production
cd /d %~dp0..\backend
echo Démarrage du backend en mode production...
start cmd /k "npm run start:prod"

echo Déploiement terminé !
echo L'application est accessible à l'adresse : http://localhost/fournisseurs
echo Pour accéder à l'application depuis d'autres machines, utilisez l'adresse IP du serveur.
