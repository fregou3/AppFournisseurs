/**
 * Script pour déboguer la récupération des données de la table fournisseurs_fournisseurs_v18
 */

const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function debugTableV18() {
  console.log('Débogage de la table fournisseurs_fournisseurs_v18');
  
  const client = await pool.connect();
  try {
    // Vérifier si la table existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'fournisseurs_fournisseurs_v18'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('La table fournisseurs_fournisseurs_v18 n\'existe pas');
      return;
    }
    
    console.log('La table fournisseurs_fournisseurs_v18 existe');
    
    // Compter le nombre total de lignes
    const countResult = await client.query('SELECT COUNT(*) FROM fournisseurs_fournisseurs_v18');
    const totalRows = parseInt(countResult.rows[0].count);
    
    console.log(`Nombre total de lignes dans la table: ${totalRows}`);
    
    // Récupérer les 5 premières lignes pour vérifier la structure
    const sampleResult = await client.query('SELECT * FROM fournisseurs_fournisseurs_v18 LIMIT 5');
    console.log('Échantillon de données:');
    console.log(JSON.stringify(sampleResult.rows, null, 2));
    
    // Vérifier la route /fournisseurs/table/:tableName
    console.log('\nVérification de la route /fournisseurs/table/:tableName:');
    
    // Construire manuellement la requête SQL qui serait exécutée
    const tableName = 'fournisseurs_fournisseurs_v18';
    const page = 1;
    const pageSize = 50;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);
    
    const query = `SELECT * FROM "${tableName}" ORDER BY id LIMIT ${limit} OFFSET ${offset}`;
    console.log('Requête SQL:', query);
    
    // Exécuter la requête
    const result = await client.query(query);
    console.log(`Nombre de lignes récupérées: ${result.rows.length}`);
    
    // Vérifier si toutes les lignes ont été récupérées
    if (result.rows.length < limit && result.rows.length < totalRows) {
      console.log('ATTENTION: Moins de lignes que prévu ont été récupérées!');
    }
    
    // Vérifier si la table fournisseurs standard contient bien toutes les lignes
    console.log('\nVérification de la table fournisseurs standard:');
    const fournisseursCountResult = await client.query('SELECT COUNT(*) FROM fournisseurs');
    const fournisseursTotalRows = parseInt(fournisseursCountResult.rows[0].count);
    
    console.log(`Nombre total de lignes dans la table fournisseurs: ${fournisseursTotalRows}`);
    
    // Comparer les structures des deux tables
    console.log('\nComparaison des structures des tables:');
    const columnsV18Result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'fournisseurs_fournisseurs_v18'
      ORDER BY ordinal_position
    `);
    
    const columnsFournisseursResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'fournisseurs'
      ORDER BY ordinal_position
    `);
    
    console.log(`Nombre de colonnes dans fournisseurs_fournisseurs_v18: ${columnsV18Result.rowCount}`);
    console.log(`Nombre de colonnes dans fournisseurs: ${columnsFournisseursResult.rowCount}`);
    
    // Vérifier si les données sont correctement importées dans la table v18
    console.log('\nVérification des données importées dans la table v18:');
    const importCheckQuery = `
      SELECT 
        (SELECT COUNT(*) FROM fournisseurs_fournisseurs_v18 WHERE "Supplier_ID" IS NOT NULL) AS with_supplier_id,
        (SELECT COUNT(*) FROM fournisseurs_fournisseurs_v18 WHERE "Supplier_ID" IS NULL) AS without_supplier_id
    `;
    
    const importCheckResult = await client.query(importCheckQuery);
    console.log('Résultats de la vérification:');
    console.log(JSON.stringify(importCheckResult.rows[0], null, 2));
    
  } catch (error) {
    console.error('Erreur lors du débogage:', error);
  } finally {
    client.release();
    pool.end();
  }
}

debugTableV18();
