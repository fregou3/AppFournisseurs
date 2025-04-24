const fs = require('fs').promises;
const xlsx = require('xlsx');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

// Mapping des colonnes Excel vers les colonnes de la base de données
const columnMapping = {
  'Supplier_ID': 'supplier_id',
  'PROCUREMENT ORGA': 'procurement_orga',
  'PARTNERS': 'partners_group',
  'Evaluated / Not Evaluated': 'evaluated_not_evaluated',
  'Ecovadis name': 'ecovadis_name',
  'Score Ecovadis': 'ecovadis_score',
  'Date': 'date',
  'Ecovadis ID': 'ecovadis_id',
  'ORGANIZATION 1': 'organization_1',
  'ORGANIZATION 2': 'organization_2',
  'ORGANIZATION COUNTRY': 'organization_3',
  'SUBSIDIARY': 'subsidiary',
  'ORIGINAL NAME PARTNER': 'original_name_partner',
  'Country of Supplier Contact': 'country_of_supplier_contact',
  'VAT number': 'vat_number',
  'Activity Area': 'activity_area',
  'Annual spend k€ A-2023': 'annual_spend_k_euros_a_2023',
  'Supplier Contact First Name': 'supplier_contact_first_name',
  'Supplier Contact Last Name': 'supplier_contact_last_name',
  'Supplier Contact Email': 'supplier_contact_email',
  'Supplier Contact Phone': 'supplier_contact_phone',
  'Adresse': 'adresse',
  'Nature du tiers': 'nature_tiers',
  'localisation': 'localisation',
  'Pays d\'intervention': 'pays_intervention',
  'Région d\'intervention': 'region_intervention',
  'score': 'score'
};

// Fonction pour convertir une date Excel en format YYYY-MM-DD
function excelDateToISO(excelDate) {
  if (!excelDate) return null;
  
  // Si c'est déjà une chaîne de caractères au format date
  if (typeof excelDate === 'string') {
    // Essayer de parser différents formats de date
    const formats = [
      'DD/MM/YYYY',
      'D/M/YYYY',
      'DD-MM-YYYY',
      'YYYY-MM-DD'
    ];
    
    for (const format of formats) {
      const date = new Date(excelDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return null;
  }
  
  // Si c'est un nombre (date Excel)
  if (typeof excelDate === 'number') {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  return null;
}

async function importFournisseurs() {
  try {
    // Lire le fichier Excel
    const workbook = xlsx.readFile('C:\\App\\AppGetionFournisseurs\\AppGetionFournisseurs_3.3_EN\\data\\fournisseurs.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Statistiques d'import
    let totalRows = 0;
    let successfulImports = 0;
    let failedImports = 0;

    for (const row of data) {
      try {
        totalRows++;
        
        // Préparer les données pour l'insertion
        const values = {};
        for (const [excelCol, dbCol] of Object.entries(columnMapping)) {
          let value = row[excelCol];
          
          // Conversion spéciale pour certains types de données
          if (dbCol === 'date') {
            value = excelDateToISO(value);
          } else if (dbCol === 'annual_spend_k_euros_a_2023') {
            value = value ? parseFloat(value) : null;
          } else if (dbCol === 'ecovadis_score' || dbCol === 'score') {
            value = value ? parseInt(value) : null;
          }
          
          values[dbCol] = value;
        }

        // Construire la requête d'insertion
        const columns = Object.keys(values);
        const placeholders = columns.map((_, idx) => `$${idx + 1}`);
        const updateClauses = columns.map(col => `${col} = EXCLUDED.${col}`);

        const query = `
          INSERT INTO fournisseurs (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          ON CONFLICT (supplier_id) DO UPDATE
          SET ${updateClauses.join(', ')}
        `;

        await pool.query(query, Object.values(values));
        console.log(`Importé avec succès: ${values.supplier_id}`);
        successfulImports++;
      } catch (error) {
        console.error(`Erreur lors de l'import de la ligne ${totalRows}:`, error);
        failedImports++;
      }
    }

    // Afficher les statistiques
    console.log('\nStatistiques d\'import:');
    console.log(`Total des lignes traitées: ${totalRows}`);
    console.log(`Imports réussis: ${successfulImports}`);
    console.log(`Imports échoués: ${failedImports}`);
    console.log(`Taux de réussite: ${((successfulImports/totalRows) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
  } finally {
    await pool.end();
  }
}

importFournisseurs();
