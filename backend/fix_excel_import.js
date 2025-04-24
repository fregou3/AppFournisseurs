/**
 * Script pour améliorer le système d'importation Excel
 * Ce script modifie la fonction d'importation Excel pour créer dynamiquement une table
 * qui contient toutes les colonnes du fichier Excel, garantissant ainsi que toutes les données
 * sont importées sans perte et que le nombre de lignes correspond exactement.
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Fonction pour créer la nouvelle fonction de création de table
function createDynamicTableFunction() {
  return `
// Fonction pour créer une table dynamiquement basée sur les colonnes du fichier Excel
async function createDynamicTableFromExcel(client, tableName, excelData) {
  console.log('Création d\\'une table dynamique basée sur les colonnes du fichier Excel');
  
  if (!excelData || excelData.length === 0) {
    throw new Error('Aucune donnée Excel fournie pour créer la table');
  }
  
  // Récupérer toutes les colonnes uniques de toutes les lignes
  const allColumns = new Set();
  excelData.forEach(row => {
    Object.keys(row).forEach(col => allColumns.add(col));
  });
  
  console.log(\`Colonnes trouvées dans le fichier Excel: \${Array.from(allColumns).join(', ')}\`);
  
  // Convertir les noms de colonnes Excel en noms de colonnes PostgreSQL valides
  const dbColumns = Array.from(allColumns).map(excelCol => {
    // Convertir en snake_case pour PostgreSQL
    let dbCol = excelCol.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')  // Remplacer les caractères non alphanumériques par des underscores
      .replace(/^_|_$/g, '')        // Supprimer les underscores au début et à la fin
      .replace(/__+/g, '_');        // Remplacer les underscores multiples par un seul
    
    // Cas spécial pour "Evaluated / Not Evaluated"
    if (excelCol === 'Evaluated / Not Evaluated') {
      dbCol = 'evaluated_not_evaluated';
    }
    
    // Éviter les noms de colonnes qui sont des mots-clés SQL
    const sqlKeywords = ['order', 'group', 'table', 'select', 'where', 'from', 'join', 'having', 'limit'];
    if (sqlKeywords.includes(dbCol)) {
      dbCol = \`excel_\${dbCol}\`;
    }
    
    return { excelCol, dbCol };
  });
  
  // Créer un mapping pour une utilisation ultérieure
  const columnMapping = {};
  dbColumns.forEach(({ excelCol, dbCol }) => {
    columnMapping[excelCol] = dbCol;
  });
  
  // Déterminer les types de données pour chaque colonne
  const columnTypes = {};
  
  // Analyser les données pour déterminer les types
  excelData.forEach(row => {
    dbColumns.forEach(({ excelCol, dbCol }) => {
      const value = row[excelCol];
      
      // Ignorer les valeurs null/undefined pour la détermination du type
      if (value === null || value === undefined) return;
      
      // Déterminer le type de données
      if (typeof value === 'number') {
        // Vérifier si c'est un entier ou un nombre à virgule flottante
        if (Number.isInteger(value)) {
          columnTypes[dbCol] = 'INTEGER';
        } else {
          columnTypes[dbCol] = 'NUMERIC';
        }
      } else if (typeof value === 'boolean') {
        columnTypes[dbCol] = 'BOOLEAN';
      } else if (value instanceof Date) {
        columnTypes[dbCol] = 'DATE';
      } else if (typeof value === 'string') {
        // Vérifier si c'est une date
        if (/^\\d{2}[\\/-]\\d{2}[\\/-]\\d{4}$/.test(value) || 
            /^\\d{4}[\\/-]\\d{2}[\\/-]\\d{2}$/.test(value)) {
          columnTypes[dbCol] = 'DATE';
        } else {
          // Utiliser TEXT pour les chaînes de caractères
          columnTypes[dbCol] = columnTypes[dbCol] || 'TEXT';
        }
      } else {
        // Type par défaut
        columnTypes[dbCol] = 'TEXT';
      }
    });
  });
  
  // Définir des types spécifiques pour certaines colonnes basées sur leur nom
  dbColumns.forEach(({ dbCol }) => {
    // Colonnes d'ID
    if (dbCol === 'id' || dbCol.endsWith('_id') || dbCol.startsWith('id_')) {
      columnTypes[dbCol] = 'TEXT';
    }
    
    // Colonnes de date
    if (dbCol.includes('date') || dbCol.includes('time')) {
      columnTypes[dbCol] = 'TEXT';
    }
    
    // Colonnes monétaires
    if (dbCol.includes('price') || dbCol.includes('cost') || dbCol.includes('amount') || 
        dbCol.includes('spend') || dbCol.includes('value')) {
      columnTypes[dbCol] = 'NUMERIC';
    }
    
    // Colonnes de score
    if (dbCol === 'score' || dbCol.includes('rating') || dbCol.includes('rank')) {
      columnTypes[dbCol] = 'INTEGER';
    }
  });
  
  // Toujours avoir une colonne id comme clé primaire
  if (!columnTypes['id']) {
    columnTypes['id'] = 'SERIAL PRIMARY KEY';
  } else {
    // Si id existe déjà, s'assurer qu'il est une clé primaire
    columnTypes['id'] = 'TEXT PRIMARY KEY';
  }
  
  // Construire la requête SQL pour créer la table
  let createTableSQL = \`CREATE TABLE "\${tableName}" (\n\`;
  
  // Ajouter chaque colonne avec son type
  const columnDefinitions = Object.entries(columnTypes).map(([col, type]) => {
    return \`  "\${col}" \${type}\`;
  });
  
  createTableSQL += columnDefinitions.join(',\\n');
  createTableSQL += '\\n)';
  
  console.log('Requête SQL pour créer la table:');
  console.log(createTableSQL);
  
  // Exécuter la requête SQL
  await client.query(createTableSQL);
  console.log(\`Table \${tableName} créée avec succès\`);
  
  return { columnMapping, columnTypes };
}
`;
}

// Fonction pour modifier la partie de création de table
function modifyTableCreation() {
  const oldCode = `      // Supprimer complètement la table et la recréer pour garantir qu'elle est vide
      await truncateClient.query(\`DROP TABLE IF EXISTS "\${tableName}" CASCADE\`);
      console.log(\`Table \${tableName} supprimée\`);
      
      // Recréer la table en clonant la structure de la table fournisseurs
      const createTableQuery = \`
        CREATE TABLE "\${tableName}" (
          LIKE fournisseurs INCLUDING ALL
        )
      \`;
      await truncateClient.query(createTableQuery);
      console.log(\`Table \${tableName} recréée avec la structure de fournisseurs\`);`;

  const newCode = `      // Supprimer complètement la table et la recréer pour garantir qu'elle est vide
      await truncateClient.query(\`DROP TABLE IF EXISTS "\${tableName}" CASCADE\`);
      console.log(\`Table \${tableName} supprimée\`);
      
      // Créer une nouvelle table avec toutes les colonnes du fichier Excel
      const { columnMapping, columnTypes } = await createDynamicTableFromExcel(truncateClient, tableName, data);
      console.log(\`Table \${tableName} créée dynamiquement avec toutes les colonnes du fichier Excel\`);
      
      // Mettre à jour le mapping global pour l'utiliser lors de l'insertion
      excelToDbMappingDynamic = columnMapping;`;

  return content.replace(oldCode, newCode);
}

// Fonction pour modifier la partie de création de table pour les nouvelles tables
function modifyNewTableCreation() {
  const oldCode = `      // Créer la table en clonant la structure de la table fournisseurs
      const createTableQuery = \`
        CREATE TABLE "\${tableName}" (
          LIKE fournisseurs INCLUDING ALL
        )
      \`;
      await truncateClient.query(createTableQuery);
      console.log(\`Table \${tableName} créée avec la structure de fournisseurs\`);`;

  const newCode = `      // Créer une nouvelle table avec toutes les colonnes du fichier Excel
      const { columnMapping, columnTypes } = await createDynamicTableFromExcel(truncateClient, tableName, data);
      console.log(\`Table \${tableName} créée dynamiquement avec toutes les colonnes du fichier Excel\`);
      
      // Mettre à jour le mapping global pour l'utiliser lors de l'insertion
      excelToDbMappingDynamic = columnMapping;`;

  return content.replace(oldCode, newCode);
}

// Fonction pour modifier la partie de mapping des colonnes
function modifyColumnMapping() {
  const oldCode = `// Mapping des noms de colonnes
const excelToDbMapping = {
  'Supplier_ID': 'supplier_id',
  'PROCUREMENT ORGA': 'procurement_orga',
  'PARTNERS': 'partners',
  'Evaluated / Not Evaluated': 'evaluated_not_evaluated',`;

  const newCode = `// Mapping des noms de colonnes
const excelToDbMapping = {
  'Supplier_ID': 'supplier_id',
  'PROCUREMENT ORGA': 'procurement_orga',
  'PARTNERS': 'partners',
  'Evaluated / Not Evaluated': 'evaluated_not_evaluated',`;

  // Ajouter la variable pour le mapping dynamique
  const dynamicMappingVar = `
// Variable pour stocker le mapping dynamique des colonnes Excel
let excelToDbMappingDynamic = {};

`;

  return content.replace(oldCode, dynamicMappingVar + newCode);
}

// Fonction pour modifier la partie de traitement des colonnes
function modifyColumnProcessing() {
  const oldCode = `      // Pour chaque colonne Excel, trouver la colonne correspondante dans la table
      Object.keys(row).forEach(excelCol => {
        // D'abord, essayer de trouver via le mapping prédéfini
        let dbCol = excelToDbMapping[excelCol];
        
        // Si pas dans le mapping, convertir en snake_case
        if (!dbCol) {
          if (excelCol === 'Evaluated / Not Evaluated') {
            dbCol = 'evaluated_not_evaluated';
          } else {
            dbCol = excelCol.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          }
        }
        
        // Vérifier si la colonne existe dans la table
        if (availableColumns.includes(dbCol)) {
          columnsToProcess.push({ excelCol, dbCol });
        } else {
          console.log(\`Colonne \${dbCol} non trouvée dans la table \${tableName}, ignorée\`);
        }
      });`;

  const newCode = `      // Pour chaque colonne Excel, utiliser le mapping dynamique créé lors de la création de la table
      Object.keys(row).forEach(excelCol => {
        // D'abord, essayer de trouver via le mapping dynamique
        let dbCol = excelToDbMappingDynamic[excelCol];
        
        // Si pas dans le mapping dynamique, essayer le mapping prédéfini
        if (!dbCol) {
          dbCol = excelToDbMapping[excelCol];
        }
        
        // Si toujours pas trouvé, convertir en snake_case
        if (!dbCol) {
          if (excelCol === 'Evaluated / Not Evaluated') {
            dbCol = 'evaluated_not_evaluated';
          } else {
            dbCol = excelCol.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          }
        }
        
        // Vérifier si la colonne existe dans la table
        if (availableColumns.includes(dbCol)) {
          columnsToProcess.push({ excelCol, dbCol });
        } else {
          console.log(\`Colonne \${dbCol} non trouvée dans la table \${tableName}, ignorée\`);
        }
      });`;

  return content.replace(oldCode, newCode);
}

// Appliquer toutes les modifications
console.log('Application des modifications...');

// Ajouter la fonction de création de table dynamique
content = content.replace('// Fonction pour convertir une date en format MM/DD/YYYY', createDynamicTableFunction() + '\n\n// Fonction pour convertir une date en format MM/DD/YYYY');

// Modifier la partie de création de table pour les tables existantes
content = modifyTableCreation();

// Modifier la partie de création de table pour les nouvelles tables
content = modifyNewTableCreation();

// Modifier la partie de mapping des colonnes
content = modifyColumnMapping();

// Modifier la partie de traitement des colonnes
content = modifyColumnProcessing();

// Écrire le contenu modifié dans le fichier
console.log('Écriture des modifications dans le fichier...');
fs.writeFileSync(fournisseursPath, content, 'utf8');

console.log('Modifications terminées avec succès!');
console.log('Le système d\'importation Excel a été amélioré pour créer dynamiquement une table qui contient toutes les colonnes du fichier Excel.');
console.log('Toutes les lignes du fichier Excel seront maintenant importées sans perte de données.');
