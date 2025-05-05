-- Script pour créer la table system_group_metadata si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS system_group_metadata (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter un index sur group_id et table_name pour des recherches plus rapides
CREATE INDEX IF NOT EXISTS idx_system_group_metadata_group_id ON system_group_metadata(group_id);
CREATE INDEX IF NOT EXISTS idx_system_group_metadata_table_name ON system_group_metadata(table_name);

-- Commentaire sur la table
COMMENT ON TABLE system_group_metadata IS 'Stocke les métadonnées associées aux groupes de données';

-- Commentaires sur les colonnes
COMMENT ON COLUMN system_group_metadata.id IS 'Identifiant unique de l''entrée de métadonnées';
COMMENT ON COLUMN system_group_metadata.group_id IS 'Identifiant du groupe associé à ces métadonnées';
COMMENT ON COLUMN system_group_metadata.table_name IS 'Nom de la table à laquelle appartient le groupe';
COMMENT ON COLUMN system_group_metadata.metadata IS 'Métadonnées du groupe au format JSON';
COMMENT ON COLUMN system_group_metadata.created_at IS 'Date et heure de création de l''entrée';
COMMENT ON COLUMN system_group_metadata.updated_at IS 'Date et heure de la dernière mise à jour de l''entrée';
