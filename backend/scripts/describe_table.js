/**
 * Script pour décrire la structure d'une table dans la base de données
 * Utilisation: node describe_table.js [nom_de_la_table]
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Récupérer le nom de la table depuis les arguments de la ligne de commande
const tableName = process.argv[2] || 'system_group_metadata';

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function describeTable(tableName) {
  const client = await pool.connect();
  try {
    console.log(`Connexion à la base de données établie`);
    
    // Vérifier si la table existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `;
    
    const tableExists = await client.query(checkTableQuery, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      console.error(`La table "${tableName}" n'existe pas dans la base de données.`);
      return;
    }
    
    // Récupérer les informations sur les colonnes
    const columnsQuery = `
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        column_default, 
        is_nullable,
        pg_catalog.col_description(
          ('"' || table_name || '"')::regclass::oid, 
          ordinal_position
        ) as column_description
      FROM 
        information_schema.columns
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position;
    `;
    
    const columnsResult = await client.query(columnsQuery, [tableName]);
    
    console.log(`\nStructure de la table "${tableName}" :`);
    console.log('='.repeat(80));
    
    columnsResult.rows.forEach(column => {
      let dataType = column.data_type;
      if (column.character_maximum_length) {
        dataType += `(${column.character_maximum_length})`;
      }
      
      console.log(`Colonne: ${column.column_name}`);
      console.log(`  Type: ${dataType}`);
      console.log(`  Nullable: ${column.is_nullable === 'YES' ? 'Oui' : 'Non'}`);
      console.log(`  Valeur par défaut: ${column.column_default || 'Aucune'}`);
      console.log(`  Description: ${column.column_description || 'Aucune description'}`);
      console.log('-'.repeat(80));
    });
    
    // Récupérer les informations sur les contraintes
    const constraintsQuery = `
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE
        tc.table_name = $1
      ORDER BY
        tc.constraint_name,
        kcu.column_name;
    `;
    
    const constraintsResult = await client.query(constraintsQuery, [tableName]);
    
    if (constraintsResult.rows.length > 0) {
      console.log(`\nContraintes de la table "${tableName}" :`);
      console.log('='.repeat(80));
      
      constraintsResult.rows.forEach(constraint => {
        console.log(`Contrainte: ${constraint.constraint_name}`);
        console.log(`  Type: ${constraint.constraint_type}`);
        console.log(`  Colonne: ${constraint.column_name}`);
        
        if (constraint.constraint_type === 'FOREIGN KEY') {
          console.log(`  Référence: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
        }
        
        console.log('-'.repeat(80));
      });
    }
    
    // Récupérer les informations sur les index
    const indexesQuery = `
      SELECT
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        tablename = $1
      ORDER BY
        indexname;
    `;
    
    const indexesResult = await client.query(indexesQuery, [tableName]);
    
    if (indexesResult.rows.length > 0) {
      console.log(`\nIndex de la table "${tableName}" :`);
      console.log('='.repeat(80));
      
      indexesResult.rows.forEach(index => {
        console.log(`Index: ${index.indexname}`);
        console.log(`  Définition: ${index.indexdef}`);
        console.log('-'.repeat(80));
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de la description de la table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la fonction principale
describeTable(tableName).catch(err => {
  console.error('Erreur non gérée:', err);
  process.exit(1);
});
