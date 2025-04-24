#!/bin/bash

# Configuration de la base de données
DB_CONTAINER=gestion_fournisseurs_db
PGUSER=admin
PGPASSWORD=admin123
PGDATABASE=gestion_fournisseurs

# Fonction pour lister les fichiers de sauvegarde d'un type spécifique
list_backup_files() {
    local pattern=$1
    echo "Fichiers de sauvegarde disponibles :"
    echo "-----------------------------------"
    ls -1t gestion_fournisseurs_${pattern}_*.sql 2>/dev/null
    echo
}

# Fonction pour supprimer toutes les tables
drop_all_tables() {
    echo "Suppression des tables existantes..."
    
    # Créer un script SQL temporaire pour supprimer toutes les tables
    cat > /tmp/drop_tables.sql << EOF
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
EOF

    # Copier le script dans le conteneur
    docker cp /tmp/drop_tables.sql "$DB_CONTAINER:/tmp/drop_tables.sql"
    
    # Exécuter le script
    if docker exec "$DB_CONTAINER" psql -U "$PGUSER" -d "$PGDATABASE" -f /tmp/drop_tables.sql; then
        echo "Tables supprimées avec succès."
        
        # Nettoyer les fichiers temporaires
        rm /tmp/drop_tables.sql
        docker exec "$DB_CONTAINER" rm /tmp/drop_tables.sql
    else
        echo "Erreur lors de la suppression des tables."
        exit 1
    fi
}

# Fonction pour restaurer un fichier
restore_backup() {
    local backup_file=$1
    if [ ! -f "$backup_file" ]; then
        echo "Erreur : Le fichier $backup_file n'existe pas."
        exit 1
    fi

    echo "Restauration de la sauvegarde à partir de : $backup_file"
    echo "Cette opération va écraser les données existantes."
    read -p "Êtes-vous sûr de vouloir continuer ? (o/n) : " confirm
    
    if [ "$confirm" = "o" ] || [ "$confirm" = "O" ]; then
        echo "Début de la restauration..."
        
        # Supprimer d'abord toutes les tables
        drop_all_tables
        
        # Copier le fichier de backup dans le conteneur
        echo "Copie du fichier de backup dans le conteneur..."
        if docker cp "$backup_file" "$DB_CONTAINER:/tmp/backup.sql"; then
            echo "Fichier copié avec succès."
            
            # Exécuter la restauration
            echo "Exécution de la restauration..."
            if docker exec "$DB_CONTAINER" psql -U "$PGUSER" -d "$PGDATABASE" -f /tmp/backup.sql; then
                echo "Restauration terminée avec succès."
                
                # Nettoyer le fichier temporaire
                docker exec "$DB_CONTAINER" rm /tmp/backup.sql
            else
                echo "Erreur lors de la restauration."
                exit 1
            fi
        else
            echo "Erreur lors de la copie du fichier dans le conteneur."
            exit 1
        fi
    else
        echo "Restauration annulée."
        exit 0
    fi
}

# Menu principal
clear
echo "Script de restauration de la base de données"
echo "=========================================="
echo
echo "Choisissez le type de sauvegarde à restaurer :"
echo "1) Base de données complète"
echo "2) Tables eval2 uniquement"
echo "3) Tables sans eval2"
echo "4) Quitter"
echo

read -p "Votre choix (1-4) : " choice

case $choice in
    1)
        echo "Restauration de la base de données complète"
        list_backup_files "all"
        read -p "Entrez le nom du fichier à restaurer : " filename
        restore_backup "$filename"
        ;;
    2)
        echo "Restauration des tables eval2 uniquement"
        list_backup_files "eval2"
        read -p "Entrez le nom du fichier à restaurer : " filename
        restore_backup "$filename"
        ;;
    3)
        echo "Restauration des tables sans eval2"
        list_backup_files "no_eval2"
        read -p "Entrez le nom du fichier à restaurer : " filename
        restore_backup "$filename"
        ;;
    4)
        echo "Au revoir!"
        exit 0
        ;;
    *)
        echo "Choix invalide"
        exit 1
        ;;
esac
