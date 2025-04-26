const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Mapping des noms de colonnes incorrects vers les noms corrects
const columnMapping = {
  'evaluated___not_evaluated': 'evaluated_not_evaluated',
  'annual_spend_k__a_2023': 'annual_spend_k_euros_a_2023',
  'sant__financi_re': 'score', // Approximation, à ajuster
  'adresse_fournisseur': 'adresse',
  'nature_du_tiers': 'nature_tiers',
  'r_gion_d_intervention': 'region_intervention',
  'pays_d_intervention': 'pays_intervention',
  'Score': 'score',
  'organization_3': null, // Colonne inexistante
  'organization_zone': null, // Colonne inexistante
  'notation_esg': null, // Colonne inexistante
  'risques_compliance': null, // Colonne inexistante
  'calcul_m_thode_ademe': null, // Colonne inexistante
  'scope_1': null, // Colonne inexistante
  'scope_2': null, // Colonne inexistante
  'scope_3': null, // Colonne inexistante
  'vision_gloable': null, // Colonne inexistante
  'comments': null, // Colonne inexistante
  'analyse_des_risques_loi_sapin_ii': null // Colonne inexistante
};

async function fixColumnNames() {
  const client = await pool.connect();
  try {
    console.log('Vérification et correction des noms de colonnes...');
    
    // Récupérer la liste des colonnes existantes
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fournisseurs'
      ORDER BY ordinal_position;
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    console.log('Colonnes existantes dans la table fournisseurs:');
    console.log(existingColumns);
    
    // Créer un point d'API pour récupérer le mapping des colonnes
    console.log('\nCréation d\'un point d\'API pour le mapping des colonnes...');
    
    // Vérifier si la table de mapping existe déjà
    const mappingTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'column_mapping'
      );
    `);
    
    if (!mappingTableExists.rows[0].exists) {
      console.log('Création de la table column_mapping...');
      await client.query(`
        CREATE TABLE column_mapping (
          frontend_column TEXT PRIMARY KEY,
          backend_column TEXT,
          description TEXT
        )
      `);
      console.log('Table column_mapping créée avec succès.');
      
      // Insérer les mappings
      console.log('Insertion des mappings de colonnes...');
      
      for (const [frontendColumn, backendColumn] of Object.entries(columnMapping)) {
        if (backendColumn) {
          await client.query(`
            INSERT INTO column_mapping (frontend_column, backend_column, description)
            VALUES ($1, $2, $3)
          `, [frontendColumn, backendColumn, `Mapping pour ${frontendColumn}`]);
        } else if (frontendColumn) {
          await client.query(`
            INSERT INTO column_mapping (frontend_column, backend_column, description)
            VALUES ($1, NULL, $2)
          `, [frontendColumn, `Colonne ${frontendColumn} non disponible dans la base de données`]);
        }
      }
      
      console.log('Mappings insérés avec succès.');
    } else {
      console.log('La table column_mapping existe déjà.');
    }
    
    // Créer une vue pour faciliter l'accès aux colonnes
    console.log('\nCréation d\'une vue pour faciliter l\'accès aux colonnes...');
    
    await client.query(`
      DROP VIEW IF EXISTS fournisseurs_view;
      
      CREATE VIEW fournisseurs_view AS
      SELECT 
        id,
        supplier_id,
        procurement_orga,
        partners,
        evaluated_not_evaluated AS "evaluated___not_evaluated",
        ecovadis_name,
        ecovadis_score,
        date,
        ecovadis_id,
        organization_1,
        organization_2,
        organization_country,
        subsidiary,
        original_name_partner,
        country_of_supplier_contact,
        vat_number,
        activity_area,
        annual_spend_k_euros_a_2023 AS "annual_spend_k__a_2023",
        supplier_contact_first_name,
        supplier_contact_last_name,
        supplier_contact_email,
        supplier_contact_phone,
        adresse AS "adresse_fournisseur",
        nature_tiers AS "nature_du_tiers",
        localisation,
        pays_intervention AS "pays_d_intervention",
        region_intervention AS "r_gion_d_intervention",
        score AS "Score"
      FROM fournisseurs;
    `);
    
    console.log('Vue fournisseurs_view créée avec succès.');
    
    // Créer un script pour le frontend qui corrige les noms de colonnes
    console.log('\nCréation d\'un script pour le frontend qui corrige les noms de colonnes...');
    
    const frontendScript = `
// Script de correction des noms de colonnes
// À inclure dans le frontend

const columnMapping = ${JSON.stringify(columnMapping, null, 2)};

// Fonction pour corriger les noms de colonnes dans les requêtes
function correctColumnNames(columns) {
  if (!columns || !Array.isArray(columns)) return columns;
  
  return columns.filter(col => {
    // Si la colonne est dans le mapping et a une valeur null, elle n'existe pas
    if (columnMapping[col] === null) {
      console.warn(\`La colonne \${col} n'existe pas dans la base de données et sera ignorée\`);
      return false;
    }
    return true;
  }).map(col => {
    // Si la colonne est dans le mapping, utiliser le nom correct
    if (columnMapping[col]) {
      console.log(\`Correction du nom de colonne: \${col} -> \${columnMapping[col]}\`);
      return columnMapping[col];
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
      console.warn(\`Le filtre sur la colonne \${column} sera ignoré car cette colonne n'existe pas\`);
      return;
    }
    
    correctedFilters[correctedColumn] = values;
  });
  
  return correctedFilters;
}

// Exporter les fonctions
export { correctColumnNames, correctFilters };
`;
    
    // Écrire le script dans un fichier
    const fs = require('fs');
    const frontendScriptPath = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'column-mapper.js');
    
    // Créer le répertoire utils s'il n'existe pas
    const utilsDir = path.join(__dirname, '..', 'frontend', 'src', 'utils');
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }
    
    fs.writeFileSync(frontendScriptPath, frontendScript);
    console.log(`Script frontend créé avec succès: ${frontendScriptPath}`);
    
    console.log('\nVérification et correction terminées avec succès.');
    
  } catch (err) {
    console.error('Erreur lors de la correction des noms de colonnes:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixColumnNames();
