-- Script pour recréer la table system_settings à l'identique de la table locale
-- Généré automatiquement le 2025-05-05T12:38:46.050Z

-- Supprimer la table et ses dépendances si elle existe
DROP TABLE IF EXISTS system_settings CASCADE;

-- Recréer la table avec la définition complète
CREATE TABLE system_settings (
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
,
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);


-- Commentaires sur les colonnes

-- Données de la table
INSERT INTO system_settings (key, value, updated_at) VALUES ('default_table', 'fournisseurs_2023_sup_5000_add_2024', '"2025-05-03T16:35:00.565Z"');

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table system_settings supprimée et recréée avec succès.';
END $$;
