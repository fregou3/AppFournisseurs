-- Script pour supprimer et recréer la table system_settings

-- Supprimer la table et ses dépendances si elle existe
DROP TABLE IF EXISTS system_settings CASCADE;

-- Recréer la table avec la définition complète
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter un index sur la clé pour des recherches plus rapides
CREATE INDEX idx_system_settings_key ON system_settings(key);

-- Commentaire sur la table
COMMENT ON TABLE system_settings IS 'Stocke les paramètres système de l''application';

-- Commentaires sur les colonnes
COMMENT ON COLUMN system_settings.id IS 'Identifiant unique du paramètre';
COMMENT ON COLUMN system_settings.key IS 'Clé unique du paramètre';
COMMENT ON COLUMN system_settings.value IS 'Valeur du paramètre au format JSON';
COMMENT ON COLUMN system_settings.description IS 'Description du paramètre';
COMMENT ON COLUMN system_settings.created_at IS 'Date et heure de création du paramètre';
COMMENT ON COLUMN system_settings.updated_at IS 'Date et heure de la dernière mise à jour du paramètre';

-- Insérer le paramètre de table par défaut s'il n'existe pas déjà
INSERT INTO system_settings (key, value, description)
VALUES 
    ('default-table', '{"defaultTable": "fournisseurs_2023_sup_5000_add_2024"}'::jsonb, 'Table par défaut utilisée pour l''affichage des données')
ON CONFLICT (key) 
DO NOTHING;

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table system_settings supprimée et recréée avec succès.';
END $$;
