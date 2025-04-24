const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gestion_fournisseurs',
  password: 'admin123',
  port: 5435,
});

// Obtenir les détails d'un fournisseur
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM details WHERE id = $1', [id]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ details: 'Aucun détail disponible' });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour les détails d'un fournisseur
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { details } = req.body;
    
    // Vérifier si l'enregistrement existe déjà
    const checkResult = await pool.query('SELECT * FROM details WHERE id = $1', [id]);
    
    if (checkResult.rows.length > 0) {
      // Mise à jour
      await pool.query(
        'UPDATE details SET details = $1 WHERE id = $2',
        [details, id]
      );
    } else {
      // Insertion
      await pool.query(
        'INSERT INTO details (id, details) VALUES ($1, $2)',
        [id, details]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des détails:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
