# Application de Gestion des Fournisseurs

## Configuration Multi-Environnements

Cette application est configurée pour fonctionner dans différents environnements :

- **Développement local** : Frontend sur le port 3005, Backend sur le port 5005
- **Production** : Frontend accessible via le port 80 avec un répertoire virtuel `/fournisseurs`

## Prérequis

- Node.js (v14 ou supérieur)
- PostgreSQL
- Nginx (pour la production)

## Installation des dépendances

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Configuration

### Backend

1. Créez un fichier `.env` dans le répertoire `backend` en vous basant sur le fichier `.env.example`
2. Configurez les paramètres de connexion à la base de données

### Frontend

Le frontend est déjà configuré pour s'adapter automatiquement à l'environnement d'exécution.

## Démarrage en mode développement

Vous pouvez démarrer l'application en mode développement de deux façons :

### 1. Utiliser le script automatique

Exécutez le script `scripts/start-dev.bat` :

```bash
cd scripts
start-dev.bat
```

### 2. Démarrer manuellement les services

#### Backend (port 5005)

```bash
cd backend
npm run dev:port
```

#### Frontend (port 3005)

```bash
cd frontend
npm run start
```

## Déploiement en production

### 1. Utiliser le script automatique

Exécutez le script `scripts/deploy-prod.bat` :

```bash
cd scripts
deploy-prod.bat
```

### 2. Déployer manuellement

#### Construire le frontend

```bash
cd frontend
npm run build:prod
```

#### Copier les fichiers vers Nginx

Copiez le contenu du répertoire `frontend/build` vers le répertoire virtuel de Nginx (par exemple `/var/www/fournisseurs` ou `C:\nginx\html\fournisseurs`).

#### Configurer Nginx

Utilisez le fichier `nginx/nginx.prod.conf` comme modèle pour votre configuration Nginx.

#### Démarrer le backend

```bash
cd backend
npm run start:prod
```

## Structure des répertoires virtuels

La configuration actuelle permet d'accéder à l'application via :

- Développement : `http://localhost:3005`
- Production : `http://votre-ip/fournisseurs`

Pour ajouter d'autres applications, vous pouvez créer d'autres répertoires virtuels dans la configuration Nginx :

```nginx
# Application de gestion des fournisseurs
location /fournisseurs/ {
    # Configuration existante
}

# Autre application
location /autre-app/ {
    alias /var/www/autre-app/;
    try_files $uri $uri/ /autre-app/index.html;
}
```

## Accès aux API

- Développement : 
  - Frontend -> Backend : `/api/...`
  - URL directe : `http://localhost:5005/...`
- Production :
  - Frontend -> Backend : `/fournisseurs/api/...`
  - URL directe : `http://votre-ip/fournisseurs/api/...`
