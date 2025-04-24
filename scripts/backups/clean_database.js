const { Pool } = require('pg');
require('dotenv').config({ path: '../../backend/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function cleanDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Désactiver les vérifications de clé étrangère temporairement
    await client.query('SET CONSTRAINTS ALL DEFERRED');

    // Supprimer toutes les contraintes de clé étrangère
    const dropForeignKeysQuery = `
      DO $$ 
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT tc.table_schema, tc.constraint_name, tc.table_name
          FROM information_schema.table_constraints tc
          WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        )
        LOOP
          EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I CASCADE',
            r.table_schema, r.table_name, r.constraint_name);
        END LOOP;
      END $$;
    `;
    await client.query(dropForeignKeysQuery);

    // Supprimer toutes les contraintes de clé primaire
    const dropPrimaryKeysQuery = `
      DO $$ 
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT tc.table_schema, tc.constraint_name, tc.table_name
          FROM information_schema.table_constraints tc
          WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
        )
        LOOP
          EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I CASCADE',
            r.table_schema, r.table_name, r.constraint_name);
        END LOOP;
      END $$;
    `;
    await client.query(dropPrimaryKeysQuery);

    // Supprimer toutes les tables
    const dropTablesQuery = `
      DO $$ 
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public'
        )
        LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `;
    await client.query(dropTablesQuery);

    // Réactiver les vérifications de clé étrangère
    await client.query('SET CONSTRAINTS ALL IMMEDIATE');

    await client.query('COMMIT');
    console.log('Base de données nettoyée avec succès');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors du nettoyage de la base de données:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDatabase();
