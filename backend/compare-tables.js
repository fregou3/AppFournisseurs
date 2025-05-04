const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

async function compareTableStructures() {
  const client = await pool.connect();
  
  try {
    console.log('Comparaison des structures des tables...');
    
    // Récupérer la structure de la première table
    const structure1 = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'fournisseurs_2023_sup_5000'
      ORDER BY ordinal_position
    `);
    
    // Récupérer la structure de la deuxième table
    const structure2 = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'fournisseurs_2023_sup_5000_add_2024'
      ORDER BY ordinal_position
    `);
    
    console.log('Structure de la table fournisseurs_2023_sup_5000:');
    console.log(`Nombre de colonnes: ${structure1.rows.length}`);
    
    console.log('Structure de la table fournisseurs_2023_sup_5000_add_2024:');
    console.log(`Nombre de colonnes: ${structure2.rows.length}`);
    
    // Comparer les colonnes
    const columns1 = structure1.rows.map(row => row.column_name);
    const columns2 = structure2.rows.map(row => row.column_name);
    
    // Colonnes présentes dans la première table mais pas dans la deuxième
    const uniqueToTable1 = columns1.filter(col => !columns2.includes(col));
    
    // Colonnes présentes dans la deuxième table mais pas dans la première
    const uniqueToTable2 = columns2.filter(col => !columns1.includes(col));
    
    console.log('Colonnes uniquement dans fournisseurs_2023_sup_5000:', uniqueToTable1);
    console.log('Colonnes uniquement dans fournisseurs_2023_sup_5000_add_2024:', uniqueToTable2);
    
    // Comparer le nombre d'enregistrements
    const count1 = await client.query(`SELECT COUNT(*) FROM fournisseurs_2023_sup_5000`);
    const count2 = await client.query(`SELECT COUNT(*) FROM fournisseurs_2023_sup_5000_add_2024`);
    
    console.log(`Nombre d'enregistrements dans fournisseurs_2023_sup_5000: ${count1.rows[0].count}`);
    console.log(`Nombre d'enregistrements dans fournisseurs_2023_sup_5000_add_2024: ${count2.rows[0].count}`);
    
    // Vérifier si les données sont identiques
    // Nous allons comparer quelques colonnes clés sur quelques enregistrements
    if (columns1.includes('id') && columns2.includes('id')) {
      console.log('Comparaison de quelques enregistrements basée sur l\'ID...');
      
      // Récupérer quelques IDs de la première table
      const ids = await client.query(`
        SELECT id FROM fournisseurs_2023_sup_5000 LIMIT 5
      `);
      
      for (const row of ids.rows) {
        const id = row.id;
        
        // Récupérer l'enregistrement dans les deux tables
        const record1 = await client.query(`
          SELECT * FROM fournisseurs_2023_sup_5000 WHERE id = $1
        `, [id]);
        
        const record2 = await client.query(`
          SELECT * FROM fournisseurs_2023_sup_5000_add_2024 WHERE id = $1
        `, [id]);
        
        if (record1.rows.length === 0 || record2.rows.length === 0) {
          console.log(`ID ${id} non trouvé dans l'une des tables`);
          continue;
        }
        
        // Comparer quelques colonnes importantes
        const commonColumns = columns1.filter(col => columns2.includes(col));
        let differences = [];
        
        for (const col of commonColumns) {
          if (record1.rows[0][col] !== record2.rows[0][col]) {
            differences.push({
              column: col,
              value1: record1.rows[0][col],
              value2: record2.rows[0][col]
            });
          }
        }
        
        if (differences.length > 0) {
          console.log(`Différences trouvées pour l'ID ${id}:`);
          console.log(differences);
        } else {
          console.log(`Aucune différence trouvée pour l'ID ${id}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de la comparaison des tables:', error);
  } finally {
    client.release();
    pool.end();
  }
}

compareTableStructures();
