/**
 * Script pour vérifier l'accès aux données et la pagination
 */

const pool = require('./db');
const express = require('express');
const cors = require('cors');
const app = express();

// Activer CORS
app.use(cors());

// Middleware pour parser le JSON
app.use(express.json());

// Route pour tester la pagination
app.get('/test-pagination/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { page = 1, pageSize = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    console.log('Test de pagination pour la table:', tableName);
    console.log('Paramètres:', { page, pageSize, offset, limit });
    
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
        console.log('Table non trouvée:', tableName);
        return res.json({ 
          success: false,
          error: 'Table non trouvée',
          data: [],
          pagination: {
            page: parseInt(page),
            pageSize: limit,
            totalRows: 0,
            totalPages: 0
          }
        });
      }
      
      // Compter le nombre total de lignes
      const countQuery = `SELECT COUNT(*) FROM "${tableName}"`;
      const countResult = await client.query(countQuery);
      const totalRows = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalRows / limit);
      
      console.log('Informations de pagination:', { totalRows, totalPages });
      
      // Récupérer les données avec pagination
      const query = `SELECT * FROM "${tableName}" ORDER BY id LIMIT $1 OFFSET $2`;
      const result = await client.query(query, [limit, offset]);
      
      console.log(`${result.rows.length} lignes récupérées sur un total de ${totalRows}`);
      
      // Renvoyer les données avec les informations de pagination
      res.json({ 
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          totalRows,
          totalPages
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors du test de pagination:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du test de pagination',
      details: error.message
    });
  }
});

// Route pour récupérer toutes les lignes d'une table (sans pagination)
app.get('/all-rows/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    
    console.log('Récupération de toutes les lignes de la table:', tableName);
    
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
        console.log('Table non trouvée:', tableName);
        return res.json({ 
          success: false,
          error: 'Table non trouvée',
          count: 0,
          data: []
        });
      }
      
      // Compter le nombre total de lignes
      const countQuery = `SELECT COUNT(*) FROM "${tableName}"`;
      const countResult = await client.query(countQuery);
      const totalRows = parseInt(countResult.rows[0].count);
      
      console.log(`Nombre total de lignes dans la table: ${totalRows}`);
      
      // Récupérer toutes les données
      const query = `SELECT * FROM "${tableName}" ORDER BY id`;
      const result = await client.query(query);
      
      console.log(`${result.rows.length} lignes récupérées`);
      
      // Renvoyer les données
      res.json({ 
        success: true,
        count: result.rows.length,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des données',
      details: error.message
    });
  }
});

// Démarrer le serveur sur un port différent
const PORT = 5006;
app.listen(PORT, () => {
  console.log(`Serveur de test démarré sur http://localhost:${PORT}`);
  console.log('Routes disponibles:');
  console.log(`- GET http://localhost:${PORT}/test-pagination/:tableName?page=1&pageSize=50`);
  console.log(`- GET http://localhost:${PORT}/all-rows/:tableName`);
  console.log('Exemple:');
  console.log(`- http://localhost:${PORT}/test-pagination/fournisseurs_fournisseurs_v18?page=1&pageSize=50`);
  console.log(`- http://localhost:${PORT}/all-rows/fournisseurs_fournisseurs_v18`);
});
