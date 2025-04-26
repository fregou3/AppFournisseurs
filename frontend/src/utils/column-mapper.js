
// Script de correction des noms de colonnes pour le frontend
import axios from 'axios';
import config from '../config';

// Mapping par défaut des colonnes (utilisé si l'API n'est pas disponible)
let columnMapping = {
  // Colonnes avec des noms différents
  "evaluated___not_evaluated": "evaluated_not_evaluated",
  "annual_spend_k__a_2023": "annual_spend_k_euros_a_2023",
  "sant__financi_re": "score",
  "adresse_fournisseur": "adresse",
  "nature_du_tiers": "nature_tiers",
  "r_gion_d_intervention": "region_intervention",
  "pays_d_intervention": "pays_intervention",
  "Score": "score",
  
  // Colonnes qui n'existent pas dans la base de données
  "organization_3": null,
  "organization_zone": null,
  "notation_esg": null,
  "risques_compliance": null,
  "calcul_m_thode_ademe": null,
  "scope_1": null,
  "scope_2": null,
  "scope_3": null,
  "vision_gloable": null,
  "comments": null,
  "analyse_des_risques_loi_sapin_ii": null
};

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

// Fonction pour corriger les noms de colonnes dans les requêtes
function correctColumnNames(columns) {
  if (!columns || !Array.isArray(columns)) return columns;
  
  // Étape 1: Filtrer les colonnes inexistantes
  const filteredColumns = columns.filter(col => {
    // Si la colonne est dans le mapping et a une valeur null, elle n'existe pas
    if (columnMapping[col] === null) {
      console.warn(`La colonne ${col} n'existe pas dans la base de données et sera ignorée`);
      return false;
    }
    return true;
  });
  
  // Étape 2: Corriger les noms de colonnes
  const correctedColumns = filteredColumns.map(col => {
    // Si la colonne est dans le mapping, utiliser le nom correct
    if (columnMapping[col]) {
      console.log(`Correction du nom de colonne: ${col} -> ${columnMapping[col]}`);
      return columnMapping[col];
    }
    return col;
  });
  
  // Étape 3: Déduplicater les colonnes
  return deduplicateColumns(correctedColumns);
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

// Exporter les fonctions
export { correctColumnNames, correctFilters, deduplicateColumns };
