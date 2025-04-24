/**
 * Script pour vérifier et ajouter la colonne Score à une table si elle n'existe pas
 */

const { Pool } = require('pg');
const config = require('../config');

// Configuration de la connexion à la base de données
const pool = new Pool(config.db);

/**
 * Vérifie si une colonne existe dans une table
 * @param {string} tableName - Nom de la table
 * @param {string} columnName - Nom de la colonne
 * @returns {Promise<boolean>} - True si la colonne existe, false sinon
 */
async function columnExists(tableName, columnName) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name = $2
    `;
    const result = await client.query(query, [tableName, columnName.toLowerCase()]);
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

/**
 * Ajoute une colonne à une table si elle n'existe pas
 * @param {string} tableName - Nom de la table
 * @param {string} columnName - Nom de la colonne à ajouter
 * @param {string} dataType - Type de données de la colonne (par défaut TEXT)
 * @returns {Promise<boolean>} - True si la colonne a été ajoutée, false sinon
 */
async function addColumnIfNotExists(tableName, columnName, dataType = 'TEXT') {
  const client = await pool.connect();
  try {
    // Vérifier si la colonne existe déjà
    const exists = await columnExists(tableName, columnName);
    if (!exists) {
      // Ajouter la colonne
      const query = `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${dataType}`;
      await client.query(query);
      console.log(`Colonne "${columnName}" ajoutée à la table "${tableName}"`);
      return true;
    } else {
      console.log(`Colonne "${columnName}" existe déjà dans la table "${tableName}"`);
      return false;
    }
  } catch (error) {
    console.error(`Erreur lors de l'ajout de la colonne "${columnName}" à la table "${tableName}":`, error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Fonction principale
 */
async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node add_score_column.js <tableName>');
    process.exit(1);
  }

  const tableName = process.argv[2];
  console.log(`Vérification de la colonne "Score" dans la table "${tableName}"...`);

  try {
    // Vérifier si la table existe
    const client = await pool.connect();
    try {
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `;
      const tableExists = await client.query(tableExistsQuery, [tableName]);
      
      if (!tableExists.rows[0].exists) {
        console.error(`La table "${tableName}" n'existe pas.`);
        process.exit(1);
      }
    } finally {
      client.release();
    }

    // Ajouter la colonne Score si elle n'existe pas
    const added = await addColumnIfNotExists(tableName, 'Score');
    
    if (added) {
      console.log(`La colonne "Score" a été ajoutée à la table "${tableName}".`);
      console.log(`Vous pouvez maintenant exécuter le script calculateScoresForTable.js pour calculer les scores.`);
    } else {
      console.log(`Aucune modification n'a été apportée à la table "${tableName}".`);
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    // Fermer la connexion à la base de données
    await pool.end();
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
