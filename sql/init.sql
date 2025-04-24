-- Création de la table principale des fournisseurs
CREATE TABLE fournisseurs (
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
    annual_spend_k_euros_a_2023 NUMERIC(15,2),
    supplier_contact_first_name VARCHAR(255),
    supplier_contact_last_name VARCHAR(255),
    supplier_contact_email VARCHAR(255),
    supplier_contact_phone VARCHAR(255),
    adresse VARCHAR(255),
    nature_tiers VARCHAR(255),
    localisation VARCHAR(255),
    pays_intervention VARCHAR(255),
    region_intervention VARCHAR(255),
    score INTEGER
);

-- Création des index
CREATE INDEX idx_fournisseurs_supplier_id ON fournisseurs(supplier_id);
CREATE INDEX idx_fournisseurs_score ON fournisseurs(score);
CREATE INDEX idx_fournisseurs_nature_tiers ON fournisseurs(nature_tiers);
CREATE INDEX idx_fournisseurs_localisation ON fournisseurs(localisation);
CREATE INDEX idx_fournisseurs_region_intervention ON fournisseurs(region_intervention);
CREATE INDEX idx_fournisseurs_pays_intervention ON fournisseurs(pays_intervention);
