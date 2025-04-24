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

async function findConformityScore(text) {
  // Nettoyer le texte pour une meilleure analyse
  text = text.replace(/\r\n/g, '\n').toLowerCase();
  
  // Patterns pour trouver la note de conformité
  const patterns = [
    /note\s+(?:de\s+)?(?:risque\s+(?:de\s+)?)?conformit[ée]\s*:?\s*(\d+)(?:\s*\/\s*20)?/,
    /risque\s+(?:de\s+)?conformit[ée]\s*:?\s*(?:note\s+(?:de\s+)?)?\s*(\d+)(?:\s*\/\s*20)?/,
    /conformit[ée]\s*:?\s*(\d+)(?:\s*\/\s*20)?/,
    /compliance\s*:?\s*(\d+)(?:\s*\/\s*20)?/
  ];

  // Chercher avec les patterns
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const score = parseInt(match[1]);
      if (score >= 0 && score <= 20) {
        return score;
      }
    }
  }

  // Si pas trouvé, chercher dans le contexte
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('conformité') || line.includes('conformite') || line.includes('compliance')) {
      // Chercher un nombre dans les 5 lignes suivantes
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const scoreMatch = lines[j].match(/(\d+)\s*\/\s*20/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1]);
          if (score >= 0 && score <= 20) {
            return score;
          }
        }
      }
    }
  }

  return null;
}

async function updateConformityScores() {
  try {
    const risqueDirPath = 'C:\\App\\AppGetionFournisseurs\\AppGetionFournisseurs_2.1\\Risque';
    const files = await fs.readdir(risqueDirPath);
    
    console.log('Mise à jour des scores de conformité...\n');
    
    for (const file of files) {
      try {
        const filePath = path.join(risqueDirPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        const score = await findConformityScore(content);
        
        if (score !== null) {
          // Trouver l'ID correspondant dans la table risque
          const nameWithoutExt = path.parse(file).name;
          const findIdQuery = `
            SELECT r.id, r.name, r.note_de_conformite 
            FROM risque r 
            WHERE r.name ILIKE $1 
            OR r.name ILIKE $2
            OR r.name ILIKE $3;
          `;
          
          const idResult = await pool.query(findIdQuery, [
            nameWithoutExt,
            `${nameWithoutExt}%`,
            `%${nameWithoutExt}%`
          ]);

          if (idResult.rows.length > 0) {
            const { id, name, note_de_conformite } = idResult.rows[0];
            
            // Mettre à jour le score
            const updateQuery = `
              UPDATE risque 
              SET note_de_conformite = $1 
              WHERE id = $2;
            `;
            
            await pool.query(updateQuery, [score, id]);
            
            console.log(`${name}: Score de conformité mis à jour de ${note_de_conformite} à ${score}`);
          }
        }
      } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${file}:`, error);
      }
    }

    console.log('\nMise à jour terminée.');

  } catch (error) {
    console.error('Erreur lors de la mise à jour des scores:', error);
  } finally {
    await pool.end();
  }
}

updateConformityScores();
