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

// Charger le mapping personnalisé
let nameMapping;
try {
  nameMapping = require('./nameMapping.json');
} catch (error) {
  console.warn('Fichier de mapping non trouvé, utilisation des correspondances par défaut uniquement');
  nameMapping = { fallbackMappings: {} };
}

function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestMatch(searchName, fournisseursMap) {
  // 1. Vérifier le mapping direct
  if (nameMapping[searchName]) {
    const mappedName = normalizeName(nameMapping[searchName]);
    for (const [key, value] of fournisseursMap.entries()) {
      if (key.includes(mappedName) || mappedName.includes(key)) {
        return value;
      }
    }
  }

  // 2. Vérifier la correspondance exacte normalisée
  const normalizedSearch = normalizeName(searchName);
  let bestMatch = fournisseursMap.get(normalizedSearch);
  if (bestMatch) return bestMatch;

  // 3. Vérifier les correspondances partielles
  let maxScore = 0;
  let bestMatchValue = null;

  for (const [key, value] of fournisseursMap.entries()) {
    // Vérifier si l'un contient l'autre
    if (key.includes(normalizedSearch) || normalizedSearch.includes(key)) {
      const score = Math.min(key.length, normalizedSearch.length) / Math.max(key.length, normalizedSearch.length);
      if (score > maxScore) {
        maxScore = score;
        bestMatchValue = value;
      }
    }
  }

  if (bestMatchValue && maxScore > 0.5) return bestMatchValue;

  // 4. Vérifier les mappings de repli
  for (const [partial, full] of Object.entries(nameMapping.fallbackMappings)) {
    if (searchName.includes(partial) || normalizedSearch.includes(normalizeName(partial))) {
      const normalizedFull = normalizeName(full);
      for (const [key, value] of fournisseursMap.entries()) {
        if (key.includes(normalizedFull) || normalizedFull.includes(key)) {
          return value;
        }
      }
    }
  }

  // 5. Recherche par mots-clés
  const searchWords = normalizedSearch.split(' ').filter(word => word.length > 2);
  for (const [key, value] of fournisseursMap.entries()) {
    const matchingWords = searchWords.filter(word => key.includes(word));
    const score = matchingWords.length / searchWords.length;
    if (score > maxScore) {
      maxScore = score;
      bestMatchValue = value;
    }
  }

  return maxScore > 0.5 ? bestMatchValue : null;
}

async function extractScoresFromText(text) {
  let noteFinanciere = 0;
  let noteConformite = 0;

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
    const failedFiles = [];

    for (const file of files) {
      try {
        totalFiles++;
        const filePath = path.join(risqueDirPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        const fileNameWithoutExt = path.parse(file).name;
        const matchFound = findBestMatch(fileNameWithoutExt, fournisseursMap);
        
        if (!matchFound) {
          console.warn(`Aucun fournisseur trouvé pour: ${fileNameWithoutExt}`);
          failedImports++;
          failedFiles.push(fileNameWithoutExt);
          continue;
        }

        const { noteFinanciere, noteConformite } = await extractScoresFromText(content);

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
          matchFound.id,
          matchFound.originalName,
          content,
          noteFinanciere,
          noteConformite
        ]);

        console.log(`Données importées avec succès pour: ${matchFound.originalName}`);
        successfulImports++;
      } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${file}:`, error);
        failedImports++;
        failedFiles.push(path.parse(file).name);
      }
    }

    // Afficher les statistiques
    console.log('\nStatistiques d\'import:');
    console.log(`Total des fichiers traités: ${totalFiles}`);
    console.log(`Imports réussis: ${successfulImports}`);
    console.log(`Imports échoués: ${failedImports}`);
    console.log(`Taux de réussite: ${((successfulImports/totalFiles) * 100).toFixed(2)}%`);
    
    if (failedFiles.length > 0) {
      console.log('\nFichiers non importés:');
      failedFiles.forEach(file => console.log(`- ${file}`));
    }

  } catch (error) {
    console.error('Erreur lors de l\'import des données:', error);
  } finally {
    await pool.end();
  }
}

importRisqueData();
