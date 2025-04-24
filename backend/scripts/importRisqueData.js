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

async function extractScoresFromText(text) {
  let noteFinanciere = 0;
  let noteConformite = 0;

  // Recherche des scores dans le texte
  const financierMatch = text.match(/[Nn]ote\s+(?:de\s+)?[Rr]isque\s+[Ff]inancier\s*:?\s*(\d+)/);
  const conformiteMatch = text.match(/[Nn]ote\s+(?:de\s+)?[Cc]onformit[ée]\s*:?\s*(\d+)/);

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

    // Récupérer la correspondance ID-partners_group de la table fournisseurs
    const fournisseursQuery = 'SELECT id, partners_group FROM fournisseurs';
    const fournisseursResult = await pool.query(fournisseursQuery);
    const fournisseursMap = new Map(
      fournisseursResult.rows.map(row => [row.partners_group, row.id])
    );

    for (const file of files) {
      try {
        const filePath = path.join(risqueDirPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Extraire le nom du fournisseur du nom de fichier (sans extension)
        const name = path.parse(file).name;
        
        // Trouver l'ID correspondant dans la table fournisseurs
        const id = fournisseursMap.get(name);
        
        if (!id) {
          console.warn(`Aucun fournisseur trouvé pour: ${name}`);
          continue;
        }

        // Extraire les scores du contenu
        const { noteFinanciere, noteConformite } = await extractScoresFromText(content);

        // Insérer ou mettre à jour les données dans la table risque
        const upsertQuery = `
          INSERT INTO risque (id, name, detail_risque, note_risque_financier, note_de_conformite)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE
          SET name = EXCLUDED.name,
              detail_risque = EXCLUDED.detail_risque,
              note_risque_financier = EXCLUDED.note_risque_financier,
              note_de_conformite = EXCLUDED.note_de_conformite
        `;

        await pool.query(upsertQuery, [
          id,
          name,
          content,
          noteFinanciere,
          noteConformite
        ]);

        console.log(`Données importées avec succès pour: ${name}`);
      } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${file}:`, error);
      }
    }

    console.log('Import terminé');
  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
  } finally {
    await pool.end();
  }
}

importRisqueData();
