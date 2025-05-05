-- Script pour recréer la table system_group_metadata à l'identique de la table locale
-- Généré automatiquement le 2025-05-05T12:36:28.011Z

-- Supprimer la table et ses dépendances si elle existe
DROP TABLE IF EXISTS system_group_metadata CASCADE;

-- Recréer la table avec la définition complète
CREATE TABLE system_group_metadata (
  group_name text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  filters jsonb,
  visible_columns jsonb,
  table_name text,
  original_column_names jsonb
,
  CONSTRAINT system_group_metadata_pkey PRIMARY KEY (group_name)
);


-- Commentaires sur les colonnes

-- Données de la table
INSERT INTO system_group_metadata (group_name, created_at, filters, visible_columns, table_name, original_column_names) VALUES ('group_test_debug_group', '"2025-04-24T16:51:13.637Z"', '{"organization_2":["APAC"]}', '["id","supplier_id","procurement_orga","partners","evaluated_not_evaluated","ecovadis_name","ecovadis_score","date","organization_1","organization_2","score"]', NULL, NULL);
INSERT INTO system_group_metadata (group_name, created_at, filters, visible_columns, table_name, original_column_names) VALUES ('group_g1', '"2025-05-04T11:45:07.774Z"', '{}', '["id","Supplier_ID","PROCUREMENT ORGA","PARTNERS","Evaluated / Not Evaluated","Ecovadis ID","Notation ESG","Santé financière","Risques compliance","Calcul méthode ADEME","Scope 1","Scope 2","Scope 3","Vision gloable","ORGANIZATION 1","ORGANIZATION 2","ORGANIZATION 3","ORGANIZATION ZONE","ORGANIZATION COUNTRY","SUBSIDIARY","ORIGINAL NAME PARTNER","Country of Supplier Contact","VAT number","Activity Area","Annual spend k€ A-2023","Supplier Contact First Name","Supplier Contact Last Name","Supplier Contact Email","Supplier Contact Phone","Comments","Adresse fournisseur","Analyse des risques Loi Sapin II","Région d''intervention","Pays d''intervention","Localisation","Nature du tiers","Score"]', 'fournisseurs_2023_sup_5000_add_2024', NULL);
INSERT INTO system_group_metadata (group_name, created_at, filters, visible_columns, table_name, original_column_names) VALUES ('group_g2', '"2025-05-04T11:47:12.672Z"', '{}', '["id","Supplier_ID","PROCUREMENT ORGA","PARTNERS","Evaluated / Not Evaluated","Ecovadis name","Ecovadis score","Date","Ecovadis ID","Notation ESG","Santé financière","Risques compliance","Calcul méthode ADEME","Scope 1","Scope 2","Scope 3","Vision gloable","ORGANIZATION 1","ORGANIZATION 2","ORGANIZATION 3","ORGANIZATION ZONE","ORGANIZATION COUNTRY","SUBSIDIARY","ORIGINAL NAME PARTNER","Country of Supplier Contact","VAT number","Activity Area","Annual spend k€ A-2023","Supplier Contact First Name","Supplier Contact Last Name","Supplier Contact Email","Supplier Contact Phone","Comments","Adresse fournisseur","Analyse des risques Loi Sapin II","Région d''intervention","Pays d''intervention","Localisation","Nature du tiers","Score"]', 'fournisseurs_2023_sup_5000_add_2024', NULL);

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table system_group_metadata supprimée et recréée avec succès.';
END $$;
