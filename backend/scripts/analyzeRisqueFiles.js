const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

async function analyzeFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.toLowerCase().split('\n');
  
  const relevantLines = {
    financier: [],
    conformite: []
  };

  // Mots-clés pour la recherche
  const keywords = {
    financier: ['financier', 'finance', 'risque financier', 'note financière', 'score financier', 'évaluation financière'],
    conformite: ['conformité', 'conformite', 'compliance', 'note de conformité', 'score de conformité', 'évaluation de conformité']
  };

  // Chercher les lignes pertinentes
  lines.forEach((line, index) => {
    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => line.includes(word))) {
        // Ajouter les 3 lignes avant et après pour le contexte
        const start = Math.max(0, index - 3);
        const end = Math.min(lines.length, index + 4);
        const context = lines.slice(start, end).join('\n');
        relevantLines[type].push({
          lineNumber: index + 1,
          context: context
        });
      }
    }
  });

  return relevantLines;
}

async function analyzeMissingScores() {
  try {
    const risqueDirPath = 'C:\\App\\AppGetionFournisseurs\\AppGetionFournisseurs_2.1\\Risque';
    const files = await fs.readdir(risqueDirPath);
    
    console.log('Analyse des fichiers sans notes...\n');
    
    // Récupérer les entrées sans notes
    const query = `
      SELECT id, name, note_risque_financier, note_de_conformite
      FROM risque
      WHERE note_risque_financier = 0 OR note_de_conformite = 0
      ORDER BY name;
    `;
    
    const result = await pool.query(query);
    
    console.log(`Nombre d'entrées sans notes complètes: ${result.rows.length}\n`);
    
    for (const row of result.rows) {
      const matchingFiles = files.filter(file => {
        const fileName = path.parse(file).name.toLowerCase();
        const rowName = row.name.toLowerCase();
        return fileName.includes(rowName) || rowName.includes(fileName);
      });

      if (matchingFiles.length > 0) {
        console.log(`\n${row.name}:`);
        console.log(`Note financière actuelle: ${row.note_risque_financier}`);
        console.log(`Note conformité actuelle: ${row.note_de_conformite}`);
        
        for (const file of matchingFiles) {
          const filePath = path.join(risqueDirPath, file);
          const analysis = await analyzeFile(filePath);
          
          console.log(`\nContenu pertinent dans ${file}:`);
          
          if (row.note_risque_financier === 0 && analysis.financier.length > 0) {
            console.log('\nContexte financier:');
            analysis.financier.forEach(({ lineNumber, context }) => {
              console.log(`\nLigne ${lineNumber}:`);
              console.log(context);
            });
          }
          
          if (row.note_de_conformite === 0 && analysis.conformite.length > 0) {
            console.log('\nContexte conformité:');
            analysis.conformite.forEach(({ lineNumber, context }) => {
              console.log(`\nLigne ${lineNumber}:`);
              console.log(context);
            });
          }
        }
      } else {
        console.log(`\n${row.name}: Aucun fichier correspondant trouvé`);
      }
    }

  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
  } finally {
    await pool.end();
  }
}

analyzeMissingScores();
