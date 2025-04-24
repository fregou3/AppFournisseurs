const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

async function displayRisqueTable() {
  try {
    const query = `
      SELECT r.id, r.name, 
             r.note_risque_financier, 
             r.note_de_conformite,
             f.organization_zone,
             SUBSTRING(r.detail_risque, 1, 150) as extrait_detail
      FROM risque r
      JOIN fournisseurs f ON r.id = f.id
      ORDER BY r.note_risque_financier DESC, r.note_de_conformite DESC
      LIMIT 15;
    `;

    const result = await pool.query(query);
    
    console.log('\nTop 15 des fournisseurs par niveau de risque :\n');
    console.log('ID | Nom | Zone | Risque Fin. | Conformité | Extrait');
    console.log('-'.repeat(120));
    
    result.rows.forEach(row => {
      console.log(
        `${row.id.toString().padEnd(3)} | ` +
        `${row.name.padEnd(30)} | ` +
        `${(row.organization_zone || '').padEnd(10)} | ` +
        `${row.note_risque_financier.toString().padEnd(11)} | ` +
        `${row.note_de_conformite.toString().padEnd(10)} | ` +
        `${row.extrait_detail.replace(/\n/g, ' ').substring(0, 50)}...`
      );
    });

    // Statistiques sur les notes
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(NULLIF(note_risque_financier, 0)) as nb_risque_fin,
        COUNT(NULLIF(note_de_conformite, 0)) as nb_conformite,
        ROUND(AVG(note_risque_financier)::numeric, 2) as moy_risque_fin,
        ROUND(AVG(note_de_conformite)::numeric, 2) as moy_conformite,
        MAX(note_risque_financier) as max_risque_fin,
        MAX(note_de_conformite) as max_conformite
      FROM risque;
    `;

    const stats = await pool.query(statsQuery);
    const statsRow = stats.rows[0];

    console.log('\nStatistiques des notes :');
    console.log('-'.repeat(50));
    console.log(`Nombre total d'entrées : ${statsRow.total}`);
    console.log(`Entrées avec note financière > 0 : ${statsRow.nb_risque_fin}`);
    console.log(`Entrées avec note conformité > 0 : ${statsRow.nb_conformite}`);
    console.log(`Moyenne risque financier : ${statsRow.moy_risque_fin}`);
    console.log(`Moyenne conformité : ${statsRow.moy_conformite}`);
    console.log(`Maximum risque financier : ${statsRow.max_risque_fin}`);
    console.log(`Maximum conformité : ${statsRow.max_conformite}`);

  } catch (error) {
    console.error('Erreur lors de l\'affichage de la table risque:', error);
  } finally {
    await pool.end();
  }
}

displayRisqueTable();
