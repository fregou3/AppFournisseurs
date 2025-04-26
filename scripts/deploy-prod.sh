#!/bin/bash

echo "Déploiement de l'application en mode production..."

# Vérifier que les répertoires existent
if [ ! -d "../backend" ] || [ ! -d "../frontend" ] || [ ! -d "../nginx" ]; then
  echo "Erreur : Les répertoires backend, frontend et nginx doivent exister dans le répertoire parent."
  exit 1
fi

# Construire le frontend pour la production
cd ../frontend
echo "Construction du frontend pour la production..."
npm run build:prod

# Créer le répertoire de destination si nécessaire
echo "Préparation du répertoire de déploiement..."
sudo mkdir -p /var/www/fournisseurs

# Copier les fichiers du build dans le répertoire de Nginx
echo "Copie des fichiers du build vers le répertoire de Nginx..."
sudo cp -R build/* /var/www/fournisseurs/

# Copier la configuration Nginx
echo "Copie de la configuration Nginx..."
sudo cp ../nginx/nginx.prod.conf /etc/nginx/sites-available/fournisseurs

# Créer un lien symbolique si nécessaire
if [ ! -f "/etc/nginx/sites-enabled/fournisseurs" ]; then
  echo "Création du lien symbolique pour la configuration Nginx..."
  sudo ln -s /etc/nginx/sites-available/fournisseurs /etc/nginx/sites-enabled/
fi

# Vérifier la configuration Nginx
echo "Vérification de la configuration Nginx..."
sudo nginx -t

# Redémarrer Nginx si la configuration est valide
if [ $? -eq 0 ]; then
  echo "Redémarrage de Nginx..."
  sudo systemctl restart nginx
else
  echo "Erreur dans la configuration Nginx. Veuillez corriger les erreurs avant de continuer."
  exit 1
fi

# Démarrer le backend en mode production
cd ../backend
echo "Démarrage du backend en mode production..."
gnome-terminal -- bash -c "npm run start:prod; exec bash"

echo "Déploiement terminé !"
echo "L'application est accessible à l'adresse : http://localhost/fournisseurs"
echo "Pour accéder à l'application depuis d'autres machines, utilisez l'adresse IP du serveur."
