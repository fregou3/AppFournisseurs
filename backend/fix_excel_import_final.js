/**
 * Script pour garantir que toutes les lignes du fichier Excel sont importées dans la base de données
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier à modifier
const fournisseursPath = path.join(__dirname, 'routes', 'fournisseurs.js');

// Lire le contenu du fichier
console.log(`Lecture du fichier ${fournisseursPath}...`);
let content = fs.readFileSync(fournisseursPath, 'utf8');

// Fonction pour modifier la partie de lecture du fichier Excel
function modifyExcelReading() {
  const oldCode = `    // Lire le fichier Excel
    const workbook = XLSX.read(req.files.file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Utiliser l'option raw: true pour garantir que toutes les données sont lues telles quelles
    // et defval: null pour que les cellules vides soient null plutôt qu'ignorées
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true, 
      defval: null,
      blankrows: true  // Inclure les lignes vides
    });`;

  const newCode = `    // Lire le fichier Excel
    const workbook = XLSX.read(req.files.file.data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Déterminer le nombre réel de lignes dans le fichier Excel
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const totalExcelRows = range.e.r - range.s.r + 1; // +1 car les indices commencent à 0
    console.log(\`Nombre total de lignes dans le fichier Excel (selon la plage): \${totalExcelRows}\`);
    
    // Utiliser toutes les options possibles pour garantir que toutes les lignes sont lues
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      raw: true,                // Conserver les valeurs brutes
      defval: null,             // Valeur par défaut pour les cellules vides
      blankrows: true,          // Inclure les lignes vides
      header: 1,                // Utiliser la première ligne comme en-tête
      range: range              // Utiliser toute la plage du fichier
    });
    
    // Convertir les données pour qu'elles soient compatibles avec le format attendu
    const formattedData = [];
    const headers = data[0];    // Première ligne = en-têtes
    
    // Parcourir toutes les lignes de données (à partir de la deuxième ligne)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const formattedRow = {};
      
      // Créer un objet avec les en-têtes comme clés
      for (let j = 0; j < headers.length; j++) {
        if (headers[j]) {  // Ignorer les colonnes sans en-tête
          formattedRow[headers[j]] = row[j];
        }
      }
      
      // Vérifier si la ligne n'est pas complètement vide
      const hasValues = Object.values(formattedRow).some(val => 
        val !== null && val !== undefined && val !== ''
      );
      
      if (hasValues || req.body.includeEmptyRows === 'true') {
        formattedData.push(formattedRow);
      }
    }
    
    console.log(\`Nombre de lignes lues après formatage: \${formattedData.length}\`);
    console.log(\`Différence avec le nombre total de lignes: \${totalExcelRows - formattedData.length - 1}\`); // -1 pour la ligne d'en-tête
    
    // Utiliser formattedData au lieu de data
    const data = formattedData;`;

  return content.replace(oldCode, newCode);
}

// Fonction pour modifier la partie d'insertion des données
function modifyDataInsertion() {
  const oldCode = `  // Préparer et insérer les données ligne par ligne
  for (const [index, row] of data.entries()) {
    const insertClient = await pool.connect();
    let mappedRow = {};`;

  const newCode = `  // Utiliser une transaction pour toute l'importation
  const globalClient = await pool.connect();
  try {
    await globalClient.query('BEGIN');
    
    console.log(\`Début de l'importation de \${data.length} lignes...\`);
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    
    // Préparer et insérer les données ligne par ligne
    for (const [index, row] of data.entries()) {
      let mappedRow = {};`;

  return content.replace(oldCode, newCode);
}

// Fonction pour modifier la fin de la boucle d'insertion
function modifyInsertionEnd() {
  const oldCode = `    } finally {
      insertClient.release();
    }
  }`;

  const newCode = `    }
      
      // Afficher la progression toutes les 100 lignes
      if ((index + 1) % 100 === 0 || index === data.length - 1) {
        console.log(\`Progression: \${index + 1}/\${data.length} lignes traitées (\${Math.round((index + 1) / data.length * 100)}%)\`);
      }
    }
    
    // Valider la transaction
    await globalClient.query('COMMIT');
    console.log(\`Importation terminée: \${successCount} succès, \${errorCount} erreurs, \${skipCount} ignorées\`);
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await globalClient.query('ROLLBACK');
    console.error(\`Erreur globale lors de l'importation: \${error.message}\`);
    throw error;
  } finally {
    globalClient.release();
  }`;

  return content.replace(oldCode, newCode);
}

// Fonction pour modifier la vérification finale
function modifyFinalCheck() {
  const oldCode = `  // Vérifier le nombre final de lignes dans la table
  try {
    const verifyClient = await pool.connect();
    const countQuery = \`SELECT COUNT(*) FROM "\${tableName}"\`;
    const countResult = await verifyClient.query(countQuery);
    const finalRowCount = parseInt(countResult.rows[0].count);`;

  const newCode = `  // Vérifier le nombre final de lignes dans la table
  try {
    const verifyClient = await pool.connect();
    const countQuery = \`SELECT COUNT(*) FROM "\${tableName}"\`;
    const countResult = await verifyClient.query(countQuery);
    const finalRowCount = parseInt(countResult.rows[0].count);
    
    // Compter les lignes par type
    const supplierIdQuery = \`SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN supplier_id IS NOT NULL THEN 1 END) as with_supplier_id,
      COUNT(CASE WHEN supplier_id IS NULL THEN 1 END) as without_supplier_id,
      COUNT(CASE WHEN supplier_id LIKE 'TEMP_%' THEN 1 END) as with_temp_id
    FROM "\${tableName}"\`;
    
    const supplierIdResult = await verifyClient.query(supplierIdQuery);
    const stats = supplierIdResult.rows[0];
    
    console.log(\`Statistiques détaillées:
    - Total: \${stats.total}
    - Avec supplier_id: \${stats.with_supplier_id}
    - Sans supplier_id: \${stats.without_supplier_id}
    - Avec ID temporaire: \${stats.with_temp_id}
    \`);`;

  return content.replace(oldCode, newCode);
}

// Appliquer toutes les modifications
console.log('Application des modifications...');

// Modifier la partie de lecture du fichier Excel
content = modifyExcelReading();

// Modifier la partie d'insertion des données
content = modifyDataInsertion();

// Modifier la fin de la boucle d'insertion
content = modifyInsertionEnd();

// Modifier la vérification finale
content = modifyFinalCheck();

// Écrire le contenu modifié dans le fichier
console.log('Écriture des modifications dans le fichier...');
fs.writeFileSync(fournisseursPath, content, 'utf8');

console.log('Modifications terminées avec succès!');
console.log('Le système d\'importation Excel a été amélioré pour garantir que toutes les lignes du fichier Excel sont importées.');
console.log('Principales améliorations:');
console.log('1. Lecture complète du fichier Excel avec toutes les options nécessaires');
console.log('2. Utilisation d\'une transaction globale pour l\'ensemble de l\'importation');
console.log('3. Meilleur suivi de la progression et des statistiques d\'importation');
console.log('4. Vérification détaillée du nombre de lignes importées');
