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

async function extractScore(text, type) {
  text = text.toLowerCase().replace(/\r\n/g, '\n');
  
  // Rechercher tous les scores au format XX/20
  const scoreRegex = /(\d+)\/20/g;
  let match;
  const scores = [];
  
  while ((match = scoreRegex.exec(text)) !== null) {
    const score = parseInt(match[1]);
    if (score >= 0 && score <= 20) {
      // Extraire le contexte avant et après le score (50 caractères)
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + 50);
      const context = text.substring(start, end);
      
      scores.push({
        score,
        index: match.index,
        context,
        globalIndex: match.index
      });
    }
  }

  // Mots-clés pour identifier le type de score
  const keywords = {
    financier: [
      'risque financier',
      'note financière',
      'score financier',
      'evaluation financière',
      'évaluation financière',
      'analyse financière',
      'santé financière',
      'situation financière',
      'financier'
    ],
    conformite: [
      'risque de conformité',
      'note de conformité',
      'score de conformité',
      'evaluation de conformité',
      'évaluation de conformité',
      'conformité',
      'compliance',
      'conformite'
    ]
  };

  // Pour chaque score trouvé, analyser son contexte
  for (const scoreInfo of scores) {
    const contextWords = scoreInfo.context.split(/\s+/);
    const targetKeywords = keywords[type];

    // Vérifier si des mots-clés du type recherché sont présents dans le contexte
    const hasRelevantKeywords = targetKeywords.some(keyword => 
      scoreInfo.context.includes(keyword)
    );

    if (hasRelevantKeywords) {
      // Calculer la "force" de l'association en fonction de la proximité des mots-clés
      let keywordFound = false;
      for (const keyword of targetKeywords) {
        const keywordIndex = text.indexOf(keyword, Math.max(0, scoreInfo.globalIndex - 100));
        if (keywordIndex !== -1 && Math.abs(keywordIndex - scoreInfo.globalIndex) < 100) {
          keywordFound = true;
          break;
        }
      }

      if (keywordFound) {
        return scoreInfo.score;
      }
    }
  }

  return null;
}

async function updateScoresById(id, financialScore, complianceScore) {
  try {
    const updateQuery = `
      UPDATE risque 
      SET note_risque_financier = $1, note_de_conformite = $2
      WHERE id = $3
      RETURNING name;
    `;
    
    const result = await pool.query(updateQuery, [financialScore, complianceScore, id]);
    
    if (result.rows.length > 0) {
      console.log(`\n${result.rows[0].name}:`);
      console.log(`  Score financier mis à jour → ${financialScore}`);
      console.log(`  Score conformité mis à jour → ${complianceScore}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'ID ${id}:`, error);
    return false;
  }
}

async function updateRisqueScores() {
  try {
    // Mettre à jour les scores spécifiques par ID
    const specificScores = [
      { id: 14, financial: 15, compliance: 15 },
      { id: 15, financial: 14, compliance: 10 },
      { id: 17, financial: 10, compliance: 8 },
      { id: 18, financial: 10, compliance: 5 }
    ];

    console.log('Mise à jour des scores spécifiques...\n');
    for (const score of specificScores) {
      await updateScoresById(score.id, score.financial, score.compliance);
    }

    // Continuer avec la mise à jour basée sur les fichiers
    const risqueDirPath = 'C:\\App\\AppGetionFournisseurs\\AppGetionFournisseurs_2.1\\Risque';
    const files = await fs.readdir(risqueDirPath);
    
    console.log('\nMise à jour des scores depuis les fichiers...\n');
    let updatedCount = 0;
    let totalFiles = 0;
    
    for (const file of files) {
      try {
        const filePath = path.join(risqueDirPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Extraire les scores
        const finScore = await extractScore(content, 'financier');
        const confScore = await extractScore(content, 'conformite');
        
        if (finScore !== null || confScore !== null) {
          // Trouver l'ID correspondant dans la table risque
          const nameWithoutExt = path.parse(file).name;
          const findIdQuery = `
            SELECT r.id, r.name, r.note_risque_financier, r.note_de_conformite 
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
            const { id, name, note_risque_financier, note_de_conformite } = idResult.rows[0];
            
            // Ne pas mettre à jour si l'ID est dans specificScores
            if (!specificScores.some(score => score.id === id)) {
              // Construire la requête de mise à jour
              let updateFields = [];
              let updateValues = [];
              let valueIndex = 1;

              if (finScore !== null) {
                updateFields.push(`note_risque_financier = $${valueIndex}`);
                updateValues.push(finScore);
                valueIndex++;
              }

              if (confScore !== null) {
                updateFields.push(`note_de_conformite = $${valueIndex}`);
                updateValues.push(confScore);
                valueIndex++;
              }

              if (updateFields.length > 0) {
                updateValues.push(id);
                const updateQuery = `
                  UPDATE risque 
                  SET ${updateFields.join(', ')}
                  WHERE id = $${valueIndex}
                `;
                
                await pool.query(updateQuery, updateValues);
                
                console.log(`${name}:`);
                if (finScore !== null) {
                  console.log(`  Score financier mis à jour: ${note_risque_financier} → ${finScore}`);
                }
                if (confScore !== null) {
                  console.log(`  Score conformité mis à jour: ${note_de_conformite} → ${confScore}`);
                }
                updatedCount++;
              }
            }
          }
        }
        totalFiles++;
      } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${file}:`, error);
      }
    }

    console.log('\nRécapitulatif:');
    console.log(`Total des fichiers traités: ${totalFiles}`);
    console.log(`Nombre de mises à jour effectuées: ${updatedCount}`);
    console.log('Mise à jour terminée.');

  } catch (error) {
    console.error('Erreur lors de la mise à jour des scores:', error);
  } finally {
    await pool.end();
  }
}

updateRisqueScores();
