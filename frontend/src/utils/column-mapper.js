
// Script de correction des noms de colonnes pour le frontend
import axios from 'axios';
import config from '../config';

// Mapping par défaut des colonnes (utilisé si l'API n'est pas disponible)
let columnMapping = {
  // Mapping des colonnes du fichier Excel vers les colonnes de la base de données
  "Supplier_ID": "supplier_id",
  "PROCUREMENT ORGA": "procurement_orga",
  "PARTNERS": "partners",
  "Evaluated / Not Evaluated": "evaluated_not_evaluated",
  "Ecovadis name": "ecovadis_name",
  "Ecovadis score": "ecovadis_score",
  "Date": "date",
  "Ecovadis ID": "ecovadis_id",
  "Notation ESG": "notation_esg",
  "Santé financière": "sant__financi_re",
  "Risques compliance": "risques_compliance",
  "Calcul méthode ADEME": "calcul_m_thode_ademe",
  "Scope 1": "scope_1",
  "Scope 2": "scope_2",
  "Scope 3": "scope_3",
  "Vision gloable": "vision_gloable",
  "ORGANIZATION 1": "organization_1",
  "ORGANIZATION 2": "organization_2",
  "ORGANIZATION 3": "organization_3",
  "ORGANIZATION ZONE": "organization_zone",
  "ORGANIZATION COUNTRY": "organization_country",
  "SUBSIDIARY": "subsidiary",
  "ORIGINAL NAME PARTNER": "original_name_partner",
  "Country of Supplier Contact": "country_of_supplier_contact",
  "VAT number": "vat_number",
  "Activity Area": "activity_area",
  "Annual spend k€ A-2023": "annual_spend_k__a_2023",
  "Supplier Contact First Name": "supplier_contact_first_name",
  "Supplier Contact Last Name": "supplier_contact_last_name",
  "Supplier Contact Email": "supplier_contact_email",
  "Supplier Contact Phone": "supplier_contact_phone",
  "Comments": "comments",
  "Adresse fournisseur": "adresse_fournisseur",
  "Analyse des risques Loi Sapin II": "analyse_des_risques_loi_sapin_ii",
  "Région d'intervention": "r_gion_d_intervention",
  "Pays d'intervention": "pays_d_intervention",
  "Localisation": "localisation",
  "Nature du tiers": "nature_du_tiers",
  "Score": "score"
};

// Mapping inverse pour afficher les noms originaux dans le frontend
let displayNameMapping = {};
Object.entries(columnMapping).forEach(([displayName, dbName]) => {
  displayNameMapping[dbName] = displayName;
});

// Liste des colonnes manquantes (utilisée si l'API n'est pas disponible)
let missingColumns = [
  "organization_3",
  "organization_zone",
  "notation_esg",
  "risques_compliance",
  "calcul_m_thode_ademe",
  "scope_1",
  "scope_2",
  "scope_3",
  "vision_gloable",
  "comments",
  "analyse_des_risques_loi_sapin_ii"
];

// Charger le mapping depuis l'API
async function loadColumnMapping() {
  try {
    const response = await axios.get(`${config.apiUrl}/column-mapping`);
    columnMapping = response.data;
    console.log('Mapping des colonnes chargé depuis l\'API:', columnMapping);
    
    const missingResponse = await axios.get(`${config.apiUrl}/column-mapping/missing`);
    missingColumns = missingResponse.data;
    console.log('Colonnes manquantes chargées depuis l\'API:', missingColumns);
    
    // Mettre à jour le mapping avec les colonnes manquantes
    missingColumns.forEach(col => {
      columnMapping[col] = null;
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors du chargement du mapping des colonnes:', error);
    return false;
  }
}

// Charger le mapping au démarrage
loadColumnMapping();

// Fonction pour corriger les noms de colonnes dans les requêtes (frontend -> backend)
function correctColumnNames(columns) {
  if (!columns || !Array.isArray(columns)) return columns;
  
  // Étape 1: Corriger les noms de colonnes
  const correctedColumns = columns.map(col => {
    // Si la colonne est dans le mapping, utiliser le nom correct pour la base de données
    if (columnMapping[col]) {
      console.log(`Correction du nom de colonne: ${col} -> ${columnMapping[col]}`);
      return columnMapping[col];
    }
    return col;
  });
  
  // Étape 2: Déduplicater les colonnes
  return deduplicateColumns(correctedColumns);
}

// Fonction pour convertir les noms de colonnes de la base de données vers les noms d'affichage
function getDisplayNames(columns) {
  if (!columns || !Array.isArray(columns)) return columns;
  
  return columns.map(col => {
    // Si la colonne a un nom d'affichage, l'utiliser
    if (displayNameMapping[col]) {
      return displayNameMapping[col];
    }
    return col;
  });
}

// Fonction pour corriger les filtres
function correctFilters(filters) {
  if (!filters || typeof filters !== 'object') return filters;
  
  const correctedFilters = {};
  
  Object.entries(filters).forEach(([column, values]) => {
    const correctedColumn = columnMapping[column] || column;
    
    // Si la colonne est dans le mapping et a une valeur null, elle n'existe pas
    if (columnMapping[column] === null) {
      console.warn(`Le filtre sur la colonne ${column} sera ignoré car cette colonne n'existe pas`);
      return;
    }
    
    correctedFilters[correctedColumn] = values;
  });
  
  return correctedFilters;
}


// Fonction pour déduplicater les colonnes
function deduplicateColumns(columns) {
  if (!columns || !Array.isArray(columns)) return columns;
  
  const seen = new Set();
  return columns.filter(col => {
    // Si la colonne a déjà été vue, la filtrer
    if (seen.has(col.toLowerCase())) {
      console.warn(`Colonne dupliquée ignorée: ${col}`);
      return false;
    }
    
    // Sinon, l'ajouter à l'ensemble des colonnes vues
    seen.add(col.toLowerCase());
    return true;
  });
}

// Fonction pour obtenir les noms de colonnes originaux pour la création de groupes
function getOriginalColumnNames(columns) {
  if (!columns || !Array.isArray(columns)) return columns;
  
  return columns.map(col => {
    // Si la colonne a un nom d'affichage dans le mapping inverse, l'utiliser
    return displayNameMapping[col] || col;
  });
}

// Exporter les fonctions et variables
export {
  correctColumnNames,
  correctFilters,
  columnMapping,
  displayNameMapping,
  getDisplayNames,
  getOriginalColumnNames,
  deduplicateColumns
};
