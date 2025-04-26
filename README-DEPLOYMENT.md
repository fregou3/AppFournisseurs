# Guide de déploiement de l'Application de Gestion des Fournisseurs

Ce guide explique comment déployer l'application de gestion des fournisseurs dans différents environnements, tant sur Windows que sur Ubuntu.

## Table des matières

1. [Prérequis](#prérequis)
2. [Configuration multi-environnements](#configuration-multi-environnements)
3. [Scripts disponibles](#scripts-disponibles)
4. [Déploiement sur Windows](#déploiement-sur-windows)
5. [Déploiement sur Ubuntu](#déploiement-sur-ubuntu)
6. [Configuration des répertoires virtuels](#configuration-des-répertoires-virtuels)
7. [Dépannage](#dépannage)

## Prérequis

### Windows
- Node.js (v14 ou supérieur)
- PostgreSQL
- Nginx (installé automatiquement par nos scripts)
- PM2 (installé automatiquement par nos scripts)

### Ubuntu
- Node.js (v14 ou supérieur)
- PostgreSQL
- Nginx
- PM2
- Droits sudo pour l'installation

## Configuration multi-environnements

L'application est configurée pour fonctionner dans différents environnements :

- **Développement local** :
  - Frontend : `http://localhost:3005`
  - Backend : `http://localhost:5005`

- **Production** :
  - Frontend : `http://votre-ip/fournisseurs`
  - Backend : `http://votre-ip/fournisseurs/api`

## Scripts disponibles

### Scripts Windows

| Script | Description |
|--------|-------------|
| `scripts\start-dev.bat` | Démarre l'application en mode développement |
| `scripts\deploy-prod.bat` | Déploie l'application en production (version simple) |
| `scripts\setup-nginx-windows.bat` | Installe et configure Nginx pour Windows |
| `scripts\setup-pm2-windows.bat` | Installe et configure PM2 pour Windows |
| `scripts\deploy-prod-complete-windows.bat` | Script complet de déploiement en production pour Windows |

### Scripts Ubuntu

| Script | Description |
|--------|-------------|
| `scripts/start-dev.sh` | Démarre l'application en mode développement |
| `scripts/deploy-prod.sh` | Déploie l'application en production (version simple) |
| `scripts/setup-nginx-ubuntu.sh` | Installe et configure Nginx pour Ubuntu |
| `scripts/setup-pm2-ubuntu.sh` | Installe et configure PM2 pour Ubuntu |
| `scripts/deploy-prod-complete-ubuntu.sh` | Script complet de déploiement en production pour Ubuntu |

## Déploiement sur Windows

### Développement

Pour démarrer l'application en mode développement :

```batch
cd scripts
start-dev.bat
```

L'application sera accessible à l'adresse `http://localhost:3005`.

### Production

Pour un déploiement complet en production :

```batch
cd scripts
deploy-prod-complete-windows.bat
```

Ce script :
1. Vérifie et installe les prérequis (Node.js, Nginx, PM2)
2. Installe les dépendances du backend et du frontend
3. Construit le frontend pour la production
4. Configure Nginx avec le répertoire virtuel `/fournisseurs`
5. Configure PM2 pour gérer le backend
6. Démarre tous les services

L'application sera accessible à l'adresse `http://localhost/fournisseurs` ou `http://votre-ip/fournisseurs`.

## Déploiement sur Ubuntu

### Développement

Pour démarrer l'application en mode développement :

```bash
cd scripts
chmod +x start-dev.sh
./start-dev.sh
```

L'application sera accessible à l'adresse `http://localhost:3005`.

### Production

Pour un déploiement complet en production :

```bash
cd scripts
chmod +x deploy-prod-complete-ubuntu.sh
sudo ./deploy-prod-complete-ubuntu.sh
```

Ce script :
1. Installe les prérequis (Node.js, Nginx, PM2)
2. Installe les dépendances du backend et du frontend
3. Construit le frontend pour la production
4. Configure Nginx avec le répertoire virtuel `/fournisseurs`
5. Configure PM2 pour gérer le backend et le démarrage automatique
6. Démarre tous les services

L'application sera accessible à l'adresse `http://votre-ip/fournisseurs`.

## Configuration des répertoires virtuels

La configuration Nginx mise en place permet d'utiliser des répertoires virtuels pour héberger plusieurs applications sur le même serveur :

- `/fournisseurs` : Application de gestion des fournisseurs
- `/fournisseurs/api` : API backend de l'application

Pour ajouter d'autres applications, modifiez le fichier de configuration Nginx :

### Windows
```
C:\nginx\conf\nginx.conf
```

### Ubuntu
```
/etc/nginx/sites-available/fournisseurs
```

Exemple d'ajout d'une nouvelle application :

```nginx
# Nouvelle application
location /autre-app/ {
    alias /var/www/autre-app/;  # ou C:/nginx/html/autre-app/ sur Windows
    try_files $uri $uri/ /autre-app/index.html;
}

# API pour la nouvelle application
location /autre-app/api/ {
    rewrite ^/autre-app/api/(.*) /$1 break;
    proxy_pass http://localhost:5006/;  # Port différent pour la nouvelle API
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Dépannage

### Problèmes courants sur Windows

1. **Nginx ne démarre pas**
   ```batch
   tasklist | findstr nginx
   ```
   Si aucun processus n'est trouvé, vérifiez les logs dans `C:\nginx\logs\error.log`.

2. **PM2 ne démarre pas automatiquement**
   ```batch
   pm2 startup
   ```
   Exécutez la commande générée avec les droits administrateur.

3. **Port 80 déjà utilisé**
   ```batch
   netstat -ano | findstr :80
   ```
   Identifiez le processus qui utilise le port 80 et arrêtez-le ou modifiez le port dans la configuration Nginx.

### Problèmes courants sur Ubuntu

1. **Nginx ne démarre pas**
   ```bash
   sudo systemctl status nginx
   sudo journalctl -u nginx
   ```
   Vérifiez les logs pour identifier le problème.

2. **PM2 ne démarre pas automatiquement**
   ```bash
   sudo pm2 startup
   ```
   Suivez les instructions pour configurer le démarrage automatique.

3. **Port 80 déjà utilisé**
   ```bash
   sudo netstat -tulpn | grep :80
   ```
   Identifiez le processus qui utilise le port 80 et arrêtez-le ou modifiez le port dans la configuration Nginx.

4. **Problèmes de permissions**
   ```bash
   sudo chown -R www-data:www-data /var/www/fournisseurs
   sudo chmod -R 755 /var/www/fournisseurs
   ```
   Assurez-vous que les permissions sont correctement configurées.
