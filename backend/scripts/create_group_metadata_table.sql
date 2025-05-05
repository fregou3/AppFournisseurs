-- Script pour créer la table system_group_metadata avec la structure spécifiée
-- Date: 2025-05-05

-- Supprimer la table et ses dépendances si elle existe
DROP TABLE IF EXISTS system_group_metadata CASCADE;

-- Recréer la table avec la définition exacte spécifiée
CREATE TABLE system_group_metadata (
  group_name text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  filters jsonb,
  visible_columns jsonb,
  table_name text,
  original_column_names jsonb,
  CONSTRAINT system_group_metadata_pkey PRIMARY KEY (group_name)
);

-- Créer l'index unique sur group_name
CREATE UNIQUE INDEX system_group_metadata_pkey ON public.system_group_metadata USING btree (group_name);

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table system_group_metadata supprimée et recréée avec succès.';
END $$;
