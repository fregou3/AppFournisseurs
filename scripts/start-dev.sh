#!/bin/bash

echo "Démarrage de l'application en mode développement..."

# Vérifier que les répertoires existent
if [ ! -d "../backend" ] || [ ! -d "../frontend" ]; then
  echo "Erreur : Les répertoires backend et frontend doivent exister dans le répertoire parent."
  exit 1
fi

# Démarrage du backend sur le port 5005
cd ../backend
echo "Démarrage du backend sur le port 5005..."
gnome-terminal -- bash -c "npm run dev:port; exec bash"

# Attendre quelques secondes pour que le backend démarre
echo "Attente du démarrage du backend..."
sleep 5

# Démarrage du frontend sur le port 3005
cd ../frontend
echo "Démarrage du frontend sur le port 3005..."
gnome-terminal -- bash -c "npm run start; exec bash"

echo "L'application est démarrée :"
echo "- Frontend : http://localhost:3005"
echo "- Backend : http://localhost:5005"
