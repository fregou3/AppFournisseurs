const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

async function displayFinancialScores() {
  try {
    const query = `
      SELECT 
        r.id,
        r.name,
        r.note_risque_financier,
        r.note_de_conformite
      FROM risque r
      WHERE r.note_risque_financier > 0
      ORDER BY r.note_risque_financier DESC, r.name ASC;
    `;
    
    const result = await pool.query(query);
    
    console.log('\nListe complète des fournisseurs avec note de risque financier :\n');
    console.log('ID  | Note Fin. | Note Conf. | Nom du fournisseur');
    console.log('-'.repeat(100));
    
    result.rows.forEach(row => {
      const id = row.id.toString().padStart(3, ' ');
      const finScore = (row.note_risque_financier || '').toString().padStart(2, ' ');
      const confScore = (row.note_de_conformite || '').toString().padStart(2, ' ');
      
      console.log(
        `${id} |    ${finScore}/20 |     ${confScore}/20 | ${row.name}`
      );
    });
    
    console.log('\nStatistiques :');
    console.log('-'.repeat(50));
    
    // Calculer les statistiques
    const stats = {
      total: result.rows.length,
      notesSup10: result.rows.filter(r => r.note_risque_financier >= 10).length,
      notesInf5: result.rows.filter(r => r.note_risque_financier <= 5).length,
      moyenne: result.rows.reduce((sum, r) => sum + r.note_risque_financier, 0) / result.rows.length
    };
    
    console.log(`Total des fournisseurs avec note financière : ${stats.total}`);
    console.log(`Nombre de notes >= 10/20 : ${stats.notesSup10}`);
    console.log(`Nombre de notes <= 5/20 : ${stats.notesInf5}`);
    console.log(`Moyenne des notes : ${stats.moyenne.toFixed(2)}/20`);

  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error);
  } finally {
    await pool.end();
  }
}

displayFinancialScores();
