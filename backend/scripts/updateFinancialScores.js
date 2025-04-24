const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

async function updateFinancialScores() {
  try {
    // Récupérer les scores financiers
    const scoresQuery = `
      SELECT id, note_risque_financier 
      FROM risque 
      WHERE note_risque_financier > 0;
    `;
    
    const result = await pool.query(scoresQuery);
    
    console.log('\nMise à jour des notes de risque financier :\n');
    
    // Pour chaque score, mettre à jour la colonne note_risque_financier
    for (const row of result.rows) {
      const updateQuery = `
        UPDATE risque 
        SET note_risque_financier = $1
        WHERE id = $2;
      `;
      
      await pool.query(updateQuery, [row.note_risque_financier, row.id]);
      console.log(`ID ${row.id.toString().padStart(3, ' ')} : Note financière mise à jour → ${row.note_risque_financier}/20`);
    }
    
    console.log('\nMise à jour terminée.');
    console.log(`Total des mises à jour effectuées : ${result.rows.length}`);

  } catch (error) {
    console.error('Erreur lors de la mise à jour des scores:', error);
  } finally {
    await pool.end();
  }
}

updateFinancialScores();
