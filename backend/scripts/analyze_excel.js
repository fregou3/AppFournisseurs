const XLSX = require('xlsx');
const path = require('path');

function analyzeExcel() {
    try {
        // Chemin vers le fichier Excel
        const filePath = 'C:/App/AppGetionFournisseurs/AppGetionFournisseurs_2.2/240222_Procédure Evaluation Tiers_WIP.xlsm';
        
        // Lire le fichier Excel
        const workbook = XLSX.readFile(filePath);
        
        // Accéder à l'onglet spécifique
        const sheetName = 'III.2. Evaluation de 2e niveau';
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        console.log('Structure de l\'onglet:');
        jsonData.forEach((row, index) => {
            if (row.length > 0) {
                console.log(`Ligne ${index + 1}:`, row);
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier Excel:', error);
    }
}

analyzeExcel();
