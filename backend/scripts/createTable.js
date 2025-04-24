const XLSX = require('xlsx');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

async function createTableFromExcel() {
  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile('C:/App/AppGetionFournisseurs/AppGetionFournisseurs_1.7/TABLEAU_Finale_v2.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      console.error('Le fichier Excel est vide');
      process.exit(1);
    }

    // Mapping des colonnes Excel vers les colonnes PostgreSQL
    const columnMapping = {
      'PROCUREMENT ORGA': 'procurement_orga',
      'HUYI MODIFICATION': 'huyi_modification',
      'PARTNERS GROUP': 'partners_group',
      'PARTNERS TRADUCTION': 'partners_traduction',
      'Evaluated / Not Evaluated': 'evaluated_not_evaluated',
      'Activity Area': 'activity_area',
      'Ecovadis Name': 'ecovadis_name',
      'Ecovadis score': 'ecovadis_score',
      'Date': 'date',
      'Ecovadis ID': 'ecovadis_id',
      'Notation ESG': 'notation_esg',
      'Santé financière': 'sante_financiere',
      'Risques compliance': 'risques_compliance',
      'Calcul méthode ADEME': 'calcul_methode_ademe',
      'Scope 1': 'scope_1',
      'Scope 2': 'scope_2',
      'Scope 3': 'scope_3',
      'Vision globale': 'vision_globale',
      'ORGANIZATION 1': 'organization_1',
      'ORGANIZATION 2': 'organization_2',
      'ORGANIZATION 3': 'organization_3',
      'ORGANIZATION ZONE': 'organization_zone',
      'ORGANIZATION COUNTRY': 'organization_country',
      'SUBSIDIARY': 'subsidiary',
      'ORIGINAL NAME PARTNER': 'original_name_partner',
      'Country of Supplier Contact': 'country_of_supplier_contact',
      'VAT number': 'vat_number',
      'Activity Area_1': 'activity_area_1',
      'Annual spend k€ A-2023': 'annual_spend_k_euros_a_2023',
      'Supplier Contact First Name': 'supplier_contact_first_name',
      'Supplier Contact Last Name': 'supplier_contact_last_name',
      'Supplier Contact Email': 'supplier_contact_email',
      'Supplier Contact Phone': 'supplier_contact_phone',
      'Comments': 'comments',
      'Adresse fournisseur': 'adresse',
      'Analyse des risques Loi Sapin II': 'analyse_des_risques_loi_sapin_ii',
      'Region d\'intervention': 'region_intervention',
      'Pays d\'intervention': 'pays_intervention',
      'Localisation': 'localisation',
      'Nature de Tier': 'nature_tier'
    };

    // Transformer les données avec le mapping
    const transformedData = data.map(row => {
      const transformedRow = {};
      for (const [excelCol, dbCol] of Object.entries(columnMapping)) {
        transformedRow[dbCol] = row[excelCol]?.toString() || null;
      }
      return transformedRow;
    });

    // Obtenir les colonnes de la base de données
    const dbColumns = Object.values(columnMapping);

    // Créer la requête SQL pour créer la table
    const createTableQuery = `
      DROP TABLE IF EXISTS fournisseurs;
      CREATE TABLE fournisseurs (
        id SERIAL PRIMARY KEY,
        ${dbColumns.map(col => `"${col}" TEXT`).join(',\n        ')}
      );
    `;

    // Exécuter la requête de création de table
    await pool.query(createTableQuery);
    console.log('Table fournisseurs créée avec succès');

    // Préparer la requête d'insertion
    const insertQuery = `
      INSERT INTO fournisseurs (${dbColumns.map(col => `"${col}"`).join(', ')})
      VALUES (${dbColumns.map((_, i) => `$${i + 1}`).join(', ')})
    `;

    // Insérer les données transformées
    for (const row of transformedData) {
      const values = dbColumns.map(col => row[col]);
      await pool.query(insertQuery, values);
    }

    console.log(`${transformedData.length} lignes insérées avec succès`);
    
    // Afficher un exemple des données insérées
    const result = await pool.query('SELECT * FROM fournisseurs LIMIT 5');
    console.log('\nExemple des 5 premières lignes insérées :');
    console.table(result.rows);

  } catch (error) {
    console.error('Erreur :', error);
  } finally {
    await pool.end();
  }
}

createTableFromExcel();
