-- Créer la base de données si elle n'existe pas
SELECT 'CREATE DATABASE gestion_fournisseurs'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gestion_fournisseurs');

-- Se connecter à la base de données
\c gestion_fournisseurs;

-- Création de la table fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
    id SERIAL PRIMARY KEY,
    supplier_id VARCHAR(255),
    procurement_orga VARCHAR(255),
    partners VARCHAR(255),
    evaluated_not_evaluated VARCHAR(255),
    ecovadis_name VARCHAR(255),
    ecovadis_score VARCHAR(255),
    date DATE,
    ecovadis_id VARCHAR(255),
    organization_1 VARCHAR(255),
    organization_2 VARCHAR(255),
    organization_country VARCHAR(255),
    subsidiary VARCHAR(255),
    original_name_partner VARCHAR(255),
    country_of_supplier_contact VARCHAR(255),
    vat_number VARCHAR(255),
    activity_area VARCHAR(255),
    annual_spend_k_euros_a_2023 DECIMAL(15,2),
    supplier_contact_first_name VARCHAR(255),
    supplier_contact_last_name VARCHAR(255),
    supplier_contact_email VARCHAR(255),
    supplier_contact_phone VARCHAR(255),
    adresse VARCHAR(255),
    nature_tier VARCHAR(255),
    localisation VARCHAR(255),
    pays_intervention VARCHAR(255),
    region_intervention VARCHAR(255),
    score DECIMAL(10,2)
);
