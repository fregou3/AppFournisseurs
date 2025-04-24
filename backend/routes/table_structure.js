const express = require('express');
const router = express.Router();
const pool = require('../db');

// Route pour récupérer la structure d'une table (noms et ordre des colonnes)
router.get('/columns/:tableName', async (req, res) => {
  const { tableName } = req.params;
  const client = await pool.connect();
  
  try {
    // Vérifier si la table existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    if (!tableCheck.rows[0].exists) {
      return res.status(404).json({ error: `La table ${tableName} n'existe pas.` });
    }
    
    // Récupérer les informations sur les colonnes avec leur ordre
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type,
        ordinal_position
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public' 
        AND table_name = $1
      ORDER BY 
        ordinal_position
    `;
    
    const result = await client.query(columnsQuery, [tableName]);
    
    // Formater les résultats
    const columns = result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      position: row.ordinal_position
    }));
    
    res.json({ columns });
    
  } catch (error) {
    console.error(`Erreur lors de la récupération de la structure de la table ${tableName}:`, error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la structure de la table' });
  } finally {
    client.release();
  }
});

module.exports = router;
