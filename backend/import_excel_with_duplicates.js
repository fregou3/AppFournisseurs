/**
 * Script pour importer le fichier Fournisseurs_2024.xlsx dans la base de données
 * en gérant correctement les colonnes en double et en préservant toutes les colonnes,
 * même celles qui sont vides
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion à la base de données
const dbConfig = {
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gestion_fournisseurs',
  password: process.env.DB_PASSWORD || 'admin123',
  port: parseInt(process.env.DB_PORT || '5435'),
};

// Créer un pool de connexions
const pool = new Pool(dbConfig);

// Chemin du fichier Excel
const excelFilePath = path.join(__dirname, '..', '20042025', 'Fournisseurs_2024.xlsx');

// Nom de la table à créer
const tableName = 'fournisseurs_2024';

/**
 * Fonction pour normaliser les noms de colonnes
 * @param {string} columnName - Nom de la colonne à normaliser
 * @returns {string} - Nom normalisé
 */
function normalizeColumnName(columnName) {
  if (!columnName) return 'column_undefined';
  
  // Cas spéciaux - préserver la casse pour certaines colonnes importantes
  const preserveCaseColumns = ['Score', 'ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Status'];
  
  for (const specialCol of preserveCaseColumns) {
    if (columnName.toLowerCase() === specialCol.toLowerCase()) {
      return specialCol;
    }
  }
  
  // Pour les autres colonnes, normaliser en minuscules avec underscores
  return columnName.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`Importation du fichier ${excelFilePath} dans la table ${tableName}...`);
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(excelFilePath)) {
    console.error(`Le fichier ${excelFilePath} n'existe pas.`);
    process.exit(1);
  }
  
  // Lire le fichier Excel
  console.log(`Lecture du fichier Excel: ${excelFilePath}`);
  const workbook = XLSX.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Obtenir la plage de cellules du fichier Excel
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  // Extraire les en-têtes de colonnes (première ligne)
  const originalHeaders = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({r: range.s.r, c: C});
    const cell = worksheet[cellAddress];
    if (cell && cell.v) {
      originalHeaders.push(cell.v.toString());
    } else {
      // En-tête vide, utiliser un nom générique
      originalHeaders.push(`Column_${C}`);
    }
  }
  
  console.log(`En-têtes originaux trouvés dans le fichier Excel: ${originalHeaders.join(', ')}`);
  
  // Vérifier si la colonne Score existe
  const scoreExists = originalHeaders.some(header => 
    header === 'Score' || header === 'SCORE' || header === 'score'
  );
  
  if (!scoreExists) {
    console.log('Colonne Score non trouvée dans le fichier Excel. Ajout de la colonne Score.');
    originalHeaders.push('Score');
  }
  
  // Créer un mapping des en-têtes originaux vers les noms de colonnes PostgreSQL
  // en gérant les doublons
  const columnMapping = {};
  const normalizedHeaders = [];
  const pgColumnNames = new Set();
  
  originalHeaders.forEach((header, index) => {
    let pgColumnName = normalizeColumnName(header);
    
    // Gérer les doublons en ajoutant un suffixe numérique
    let suffix = 1;
    let originalPgColumnName = pgColumnName;
    while (pgColumnNames.has(pgColumnName)) {
      pgColumnName = `${originalPgColumnName}_${suffix}`;
      suffix++;
    }
    
    pgColumnNames.add(pgColumnName);
    columnMapping[header] = pgColumnName;
    normalizedHeaders.push({
      original: header,
      normalized: pgColumnName,
      index
    });
  });
  
  console.log('\nMapping des colonnes:');
  for (const [original, normalized] of Object.entries(columnMapping)) {
    console.log(`${original} -> ${normalized}`);
  }
  
  // Lire toutes les données du fichier Excel
  const rawData = XLSX.utils.sheet_to_json(worksheet, { 
    raw: true, 
    defval: null,
    blankrows: false
  });
  
  // Créer un nouvel ensemble de données avec toutes les colonnes normalisées
  const data = [];
  for (const row of rawData) {
    const newRow = {};
    
    // Ajouter chaque colonne avec son nom normalisé
    for (const [original, normalized] of Object.entries(columnMapping)) {
      newRow[normalized] = row[original] !== undefined ? row[original] : null;
    }
    
    data.push(newRow);
  }
  
  console.log(`\nNombre de lignes lues: ${data.length}`);
  console.log(`Nombre de colonnes: ${Object.keys(columnMapping).length}`);
  
  // Connexion à la base de données
  const client = await pool.connect();
  
  try {
    // Commencer une transaction
    await client.query('BEGIN');
    
    // Supprimer la table si elle existe déjà
    await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    console.log(`Table ${tableName} supprimée si elle existait`);
    
    // Créer la table avec toutes les colonnes du fichier Excel
    let createTableSQL = `CREATE TABLE "${tableName}" (
      id SERIAL PRIMARY KEY,
    `;
    
    // Ajouter chaque colonne avec le type TEXT
    const columnDefinitions = Object.values(columnMapping).map(pgCol => {
      return `"${pgCol}" TEXT`;
    });
    
    createTableSQL += columnDefinitions.join(',\n      ');
    createTableSQL += '\n    )';
    
    console.log('\nRequête SQL pour créer la table:');
    console.log(createTableSQL);
    
    // Exécuter la requête SQL pour créer la table
    await client.query(createTableSQL);
    console.log(`\nTable ${tableName} créée avec succès`);
    
    // Insérer les données ligne par ligne
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const [index, row] of data.entries()) {
      try {
        // Préparer les colonnes et les valeurs pour l'insertion
        const insertColumns = Object.keys(row);
        const insertValues = Object.values(row);
        const placeholders = insertValues.map((_, i) => `$${i + 1}`);
        
        // Construire la requête d'insertion
        const insertQuery = `
          INSERT INTO "${tableName}" (${insertColumns.map(col => `"${col}"`).join(', ')})
          VALUES (${placeholders.join(', ')})
        `;
        
        // Exécuter la requête d'insertion
        await client.query(insertQuery, insertValues);
        insertedCount++;
        
        // Afficher la progression
        if (insertedCount % 100 === 0 || insertedCount === data.length) {
          console.log(`Progression: ${insertedCount}/${data.length} lignes insérées (${Math.round(insertedCount / data.length * 100)}%)`);
        }
      } catch (error) {
        console.error(`Erreur lors de l'insertion de la ligne ${index + 1}:`, error);
        errorCount++;
      }
    }
    
    // Valider la transaction
    await client.query('COMMIT');
    
    console.log(`\nImportation terminée avec succès:`);
    console.log(`- ${insertedCount} lignes insérées`);
    console.log(`- ${errorCount} erreurs`);
    
    // Vérifier que la colonne Score existe dans la table
    const scoreColumnName = columnMapping['Score'] || 'Score';
    const checkScoreQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name = $2
    `;
    const scoreResult = await client.query(checkScoreQuery, [tableName, scoreColumnName]);
    
    if (scoreResult.rows.length > 0) {
      console.log(`\nLa colonne Score (${scoreColumnName}) existe bien dans la table ${tableName}.`);
    } else {
      console.log(`\nATTENTION: La colonne Score (${scoreColumnName}) n'existe pas dans la table ${tableName}.`);
    }
    
    // Lister toutes les colonnes de la table
    const listColumnsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;
    const columnsResult = await client.query(listColumnsQuery, [tableName]);
    
    console.log(`\nColonnes de la table ${tableName}:`);
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}`);
    });
    
  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await client.query('ROLLBACK');
    console.error('Erreur lors de l\'importation:', error);
  } finally {
    // Libérer le client
    client.release();
  }
  
  // Fermer la connexion à la base de données
  await pool.end();
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
