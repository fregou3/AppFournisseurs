/**
 * Script de diagnostic pour la création de groupes
 * Ce script aide à identifier les problèmes liés à la création de groupes
 * en vérifiant les tables et colonnes existantes dans la base de données.
 */

const { Pool } = require('pg');
const config = require('../config');

// Créer une connexion à la base de données
const pool = new Pool(config.db);

// Fonction pour lister toutes les tables de la base de données
async function listAllTables() {
  try {
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('\n=== TABLES DISPONIBLES ===');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.tablename}`);
    });
    
    return result.rows.map(row => row.tablename);
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    return [];
  }
}

// Fonction pour lister toutes les colonnes d'une table
async function listColumnsForTable(tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);
    
    console.log(`\n=== COLONNES DE LA TABLE "${tableName}" ===`);
    if (result.rows.length === 0) {
      console.log('Aucune colonne trouvée (la table n\'existe peut-être pas)');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.column_name} (${row.data_type})`);
      });
    }
    
    return result.rows.map(row => row.column_name);
  } catch (error) {
    console.error(`Erreur lors de la récupération des colonnes pour la table "${tableName}":`, error);
    return [];
  }
}

// Fonction pour vérifier si les colonnes demandées existent dans une table
async function checkColumnsExistence(tableName, requestedColumns) {
  const existingColumns = await listColumnsForTable(tableName);
  
  console.log('\n=== VÉRIFICATION DES COLONNES DEMANDÉES ===');
  
  const existingSet = new Set(existingColumns.map(col => col.toLowerCase()));
  const missingColumns = [];
  const foundColumns = [];
  
  requestedColumns.forEach(col => {
    // Vérifier avec insensibilité à la casse
    if (existingSet.has(col.toLowerCase())) {
      // Trouver la version exacte du nom de colonne (avec la casse correcte)
      const exactColumn = existingColumns.find(
        existingCol => existingCol.toLowerCase() === col.toLowerCase()
      );
      foundColumns.push({ requested: col, actual: exactColumn });
    } else {
      missingColumns.push(col);
    }
  });
  
  console.log('\nColonnes trouvées:');
  if (foundColumns.length === 0) {
    console.log('Aucune');
  } else {
    foundColumns.forEach(col => {
      if (col.requested !== col.actual) {
        console.log(`- "${col.requested}" (trouvée sous le nom "${col.actual}")`);
      } else {
        console.log(`- "${col.requested}"`);
      }
    });
  }
  
  console.log('\nColonnes manquantes:');
  if (missingColumns.length === 0) {
    console.log('Aucune');
  } else {
    missingColumns.forEach(col => {
      console.log(`- "${col}"`);
    });
  }
  
  return { foundColumns, missingColumns };
}

// Fonction principale
async function main() {
  try {
    console.log('=== DIAGNOSTIC DE CRÉATION DE GROUPE ===');
    
    // Lister toutes les tables
    const tables = await listAllTables();
    
    // Demander à l'utilisateur de choisir une table
    const tableName = process.argv[2];
    if (!tableName) {
      console.log('\nUtilisation: node diagnose_group_creation.js <nom_table> [colonne1,colonne2,...]');
      console.log('Exemple: node diagnose_group_creation.js fournisseurs_2023 "Pays d\'intervention","Nature du tiers"');
      process.exit(1);
    }
    
    if (!tables.includes(tableName)) {
      console.log(`\nATTENTION: La table "${tableName}" n'existe pas dans la base de données.`);
      console.log('Veuillez choisir une table parmi celles listées ci-dessus.');
      process.exit(1);
    }
    
    // Récupérer les colonnes demandées
    let requestedColumns = [];
    if (process.argv[3]) {
      requestedColumns = process.argv[3].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    }
    
    if (requestedColumns.length === 0) {
      // Si aucune colonne n'est spécifiée, vérifier toutes les colonnes
      await listColumnsForTable(tableName);
    } else {
      // Vérifier si les colonnes demandées existent
      await checkColumnsExistence(tableName, requestedColumns);
    }
    
    // Vérifier la structure de la table system_group_metadata
    console.log('\n=== VÉRIFICATION DE LA TABLE SYSTEM_GROUP_METADATA ===');
    const metadataExists = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'system_group_metadata'
        AND table_schema = 'public'
      )
    `);
    
    if (metadataExists.rows[0].exists) {
      console.log('La table system_group_metadata existe.');
      
      // Vérifier les colonnes de la table
      await listColumnsForTable('system_group_metadata');
    } else {
      console.log('La table system_group_metadata n\'existe pas.');
    }
    
  } catch (error) {
    console.error('Erreur lors du diagnostic:', error);
  } finally {
    // Fermer la connexion à la base de données
    await pool.end();
  }
}

// Exécuter la fonction principale
main();
