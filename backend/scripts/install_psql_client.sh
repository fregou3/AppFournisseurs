#!/bin/bash

# Script pour installer le client PostgreSQL
# Auteur: Cascade AI
# Date: 2025-05-05

# Fonction pour afficher un message en couleur
print_color() {
  local color=$1
  local message=$2
  
  case $color in
    "green") echo -e "\033[0;32m$message\033[0m" ;;
    "red") echo -e "\033[0;31m$message\033[0m" ;;
    "yellow") echo -e "\033[0;33m$message\033[0m" ;;
    "blue") echo -e "\033[0;34m$message\033[0m" ;;
    *) echo "$message" ;;
  esac
}

# Vérifier si psql est déjà installé
if command -v psql &> /dev/null; then
  print_color "green" "✅ Le client PostgreSQL (psql) est déjà installé."
  psql --version
  exit 0
fi

print_color "yellow" "⚠️ Le client PostgreSQL (psql) n'est pas installé. Installation en cours..."

# Détecter le système d'exploitation
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS=$NAME
  VERSION=$VERSION_ID
elif type lsb_release >/dev/null 2>&1; then
  OS=$(lsb_release -si)
  VERSION=$(lsb_release -sr)
else
  OS=$(uname -s)
  VERSION=$(uname -r)
fi

print_color "blue" "Système d'exploitation détecté: $OS $VERSION"

# Installer le client PostgreSQL en fonction du système d'exploitation
case "$OS" in
  *Ubuntu*|*Debian*)
    print_color "blue" "Installation du client PostgreSQL pour Ubuntu/Debian..."
    sudo apt-get update
    sudo apt-get install -y postgresql-client
    ;;
  *Amazon*|*CentOS*|*RHEL*|*Red*)
    print_color "blue" "Installation du client PostgreSQL pour Amazon Linux/CentOS/RHEL..."
    sudo yum install -y postgresql
    ;;
  *Alpine*)
    print_color "blue" "Installation du client PostgreSQL pour Alpine Linux..."
    apk add postgresql-client
    ;;
  *)
    print_color "red" "❌ Système d'exploitation non pris en charge: $OS"
    print_color "yellow" "Veuillez installer manuellement le client PostgreSQL."
    exit 1
    ;;
esac

# Vérifier si l'installation a réussi
if command -v psql &> /dev/null; then
  print_color "green" "✅ Le client PostgreSQL a été installé avec succès!"
  psql --version
  
  print_color "blue" "Vous pouvez maintenant exécuter les scripts SQL avec:"
  print_color "blue" "  ./run_create_group_metadata_table.sh"
  print_color "blue" "  ./run_create_system_settings_table.sh"
  print_color "blue" "ou"
  print_color "blue" "  ./run_all_table_scripts.sh"
else
  print_color "red" "❌ L'installation du client PostgreSQL a échoué."
  print_color "yellow" "Veuillez essayer d'installer manuellement le client PostgreSQL."
  exit 1
fi
