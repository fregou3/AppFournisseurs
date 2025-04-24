const fs = require('fs').promises;
const path = require('path');
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

// Fonction pour normaliser les noms
function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .toUpperCase() // Mettre en majuscules
    .replace(/[^A-Z0-9]/g, ' ') // Remplacer les caractères spéciaux par des espaces
    .replace(/\s+/g, ' ') // Réduire les espaces multiples
    .trim(); // Supprimer les espaces au début et à la fin
}

async function extractScoresFromText(text) {
  let noteFinanciere = 0;
  let noteConformite = 0;

  // Recherche des scores dans le texte avec plus de variations possibles
  const financierRegex = /[Nn]ote\s+(?:de\s+)?[Rr]isque\s+[Ff]inanci[èe]re?\s*:?\s*(\d+)/;
  const conformiteRegex = /[Nn]ote\s+(?:de\s+)?[Cc]onformit[ée]\s*:?\s*(\d+)/;
  
  const financierMatch = text.match(financierRegex);
  const conformiteMatch = text.match(conformiteRegex);

  if (financierMatch) {
    noteFinanciere = parseInt(financierMatch[1]);
  }
  if (conformiteMatch) {
    noteConformite = parseInt(conformiteMatch[1]);
  }

  return {
    noteFinanciere,
    noteConformite
  };
}

async function importRisqueData() {
  try {
    const risqueDirPath = 'C:\\App\\AppGetionFournisseurs\\AppGetionFournisseurs_2.1\\Risque';
    const files = await fs.readdir(risqueDirPath);

    // Récupérer tous les fournisseurs
    const fournisseursQuery = 'SELECT id, partners_group FROM fournisseurs';
    const fournisseursResult = await pool.query(fournisseursQuery);
    
    // Créer une Map avec les noms normalisés
    const fournisseursMap = new Map();
    fournisseursResult.rows.forEach(row => {
      if (row.partners_group) {
        const normalizedName = normalizeName(row.partners_group);
        fournisseursMap.set(normalizedName, {
          id: row.id,
          originalName: row.partners_group
        });
      }
    });

    // Statistiques d'import
    let totalFiles = 0;
    let successfulImports = 0;
    let failedImports = 0;

    for (const file of files) {
      try {
        totalFiles++;
        const filePath = path.join(risqueDirPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Normaliser le nom du fichier
        const fileNameWithoutExt = path.parse(file).name;
        const normalizedFileName = normalizeName(fileNameWithoutExt);
        
        // Rechercher une correspondance
        let matchFound = fournisseursMap.get(normalizedFileName);
        
        if (!matchFound) {
          // Recherche plus flexible si pas de correspondance exacte
          for (const [key, value] of fournisseursMap.entries()) {
            if (key.includes(normalizedFileName) || normalizedFileName.includes(key)) {
              matchFound = value;
              console.log(`Correspondance approximative trouvée: ${fileNameWithoutExt} -> ${value.originalName}`);
              break;
            }
          }
        }

        if (!matchFound) {
          console.warn(`Aucun fournisseur trouvé pour: ${fileNameWithoutExt}`);
          failedImports++;
          continue;
        }

        // Extraire les scores du contenu
        const { noteFinanciere, noteConformite } = await extractScoresFromText(content);

        // Insérer ou mettre à jour les données
        const upsertQuery = `
          INSERT INTO risque (id, note_risque_financier, note_de_conformite, risque_detaille)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE
          SET note_risque_financier = EXCLUDED.note_risque_financier,
              note_de_conformite = EXCLUDED.note_de_conformite,
              risque_detaille = EXCLUDED.risque_detaille
        `;

        await pool.query(upsertQuery, [
          matchFound.id,
          noteFinanciere,
          noteConformite,
          content
        ]);

        console.log(`Données importées avec succès pour: ${matchFound.originalName}`);
        successfulImports++;
      } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${file}:`, error);
        failedImports++;
      }
    }

    // Afficher les statistiques
    console.log('\nStatistiques d\'import:');
    console.log(`Total des fichiers traités: ${totalFiles}`);
    console.log(`Imports réussis: ${successfulImports}`);
    console.log(`Imports échoués: ${failedImports}`);
    console.log(`Taux de réussite: ${((successfulImports/totalFiles) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
  } finally {
    await pool.end();
  }
}

importRisqueData();
