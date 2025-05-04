const pool = require('./db');

async function checkScores() {
  const client = await pool.connect();
  try {
    console.log('Vérification des scores dans la table fournisseurs_2023_sup_5000_add_2024...');
    
    // Vérifier le nom de la colonne Score
    const columnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'fournisseurs_2023_sup_5000_add_2024'
      ORDER BY ordinal_position;
    `;
    const columnsResult = await client.query(columnsQuery);
    console.log('Colonnes disponibles:', columnsResult.rows.map(row => row.column_name));
    
    // Vérifier si la colonne Score existe
    const scoreColumn = columnsResult.rows.find(row => 
      row.column_name.toLowerCase() === 'score' || 
      row.column_name === 'Score'
    );
    
    if (scoreColumn) {
      console.log(`Colonne score trouvée: ${scoreColumn.column_name}`);
      
      // Vérifier les valeurs de score
      const scoresQuery = `
        SELECT "${scoreColumn.column_name}" as score, COUNT(*) as count
        FROM fournisseurs_2023_sup_5000_add_2024
        GROUP BY "${scoreColumn.column_name}"
        ORDER BY "${scoreColumn.column_name}";
      `;
      
      const scoresResult = await client.query(scoresQuery);
      console.log('Distribution des scores:');
      scoresResult.rows.forEach(row => {
        console.log(`Score ${row.score === null ? 'NULL' : row.score}: ${row.count} fournisseurs`);
      });
      
      // Vérifier le nombre total de fournisseurs
      const countQuery = `SELECT COUNT(*) as total FROM fournisseurs_2023_sup_5000_add_2024;`;
      const countResult = await client.query(countQuery);
      console.log(`Nombre total de fournisseurs: ${countResult.rows[0].total}`);
      
      // Vérifier un échantillon de données
      const sampleQuery = `
        SELECT * FROM fournisseurs_2023_sup_5000_add_2024
        LIMIT 5;
      `;
      const sampleResult = await client.query(sampleQuery);
      console.log('Échantillon de données:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`Fournisseur ${index + 1}:`, row);
      });
    } else {
      console.log('Aucune colonne Score trouvée dans la table.');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des scores:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkScores().catch(err => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});
