/**
 * Script pour corriger l'erreur de useMemo dans renderScoreCell
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier DataTable.js à corriger
const dataTablePath = path.join(__dirname, 'DataTable.js');
console.log(`Lecture du fichier ${dataTablePath}...`);
let content = fs.readFileSync(dataTablePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Trouver et corriger l'erreur dans renderScoreCell
const renderScoreCellPattern = /const renderScoreCell = \(score\) => \{\s*if \(score === null\) return '';\s*\s*const style = getScoreStyle\(score\);\s*\s*\/\/ Fonctions de gestion de la pagination[\s\S]+?displayedData = useMemo[\s\S]+?\}, \[filteredData, page, rowsPerPage\]\);/;

// Nouveau contenu pour renderScoreCell
const fixedRenderScoreCell = `const renderScoreCell = (score) => {
    if (score === null) return '';
    
    const style = getScoreStyle(score);
    
    return (
      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {score}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {style.label}
            </Typography>
          </Box>
        }
        sx={{
          backgroundColor: style.backgroundColor,
          color: style.color,
          fontWeight: 'bold',
          minWidth: '120px',
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />
    );
  };
  
  // Fonctions de gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculer les données à afficher en fonction de la pagination
  const displayedData = useMemo(() => {
    setTotalRows(filteredData.length);
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);`;

// Remplacer le contenu problématique
if (renderScoreCellPattern.test(content)) {
  content = content.replace(renderScoreCellPattern, fixedRenderScoreCell);
  console.log('Fonction renderScoreCell corrigée');
} else {
  console.log('Pattern renderScoreCell non trouvé, recherche d\'un pattern alternatif...');
  
  // Recherche manuelle de la fonction renderScoreCell
  const renderScoreCellStart = content.indexOf('const renderScoreCell = (score) => {');
  
  if (renderScoreCellStart !== -1) {
    // Trouver la fin de la fonction renderScoreCell
    const renderScoreCellEnd = content.indexOf('};', renderScoreCellStart) + 2;
    
    // Trouver où insérer les fonctions de pagination
    const nextFunctionStart = content.indexOf('const', renderScoreCellEnd);
    
    if (nextFunctionStart !== -1) {
      // Extraire la fonction renderScoreCell correcte
      const correctRenderScoreCell = content.substring(renderScoreCellStart, renderScoreCellEnd);
      
      // Ajouter les fonctions de pagination après renderScoreCell
      const paginationFunctions = `
  
  // Fonctions de gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculer les données à afficher en fonction de la pagination
  const displayedData = useMemo(() => {
    setTotalRows(filteredData.length);
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);
`;
      
      // Construire le nouveau contenu
      const beforeRenderScoreCell = content.substring(0, renderScoreCellStart);
      const afterRenderScoreCell = content.substring(nextFunctionStart);
      
      content = beforeRenderScoreCell + correctRenderScoreCell + paginationFunctions + afterRenderScoreCell;
      console.log('Fonction renderScoreCell corrigée manuellement');
    } else {
      console.log('Impossible de trouver la fin de la fonction renderScoreCell');
    }
  } else {
    console.log('Fonction renderScoreCell non trouvée');
    
    // Rechercher où ajouter les fonctions de pagination
    const beforeReturnPattern = /return \(/;
    const beforeReturnMatch = content.match(beforeReturnPattern);
    
    if (beforeReturnMatch) {
      const beforeReturnPos = content.indexOf(beforeReturnMatch[0]);
      
      // Ajouter les fonctions de pagination avant le return
      const paginationFunctions = `
  // Fonctions de gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculer les données à afficher en fonction de la pagination
  const displayedData = useMemo(() => {
    setTotalRows(filteredData.length);
    return filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

`;
      
      // Construire le nouveau contenu
      const beforeReturn = content.substring(0, beforeReturnPos);
      const afterReturn = content.substring(beforeReturnPos);
      
      content = beforeReturn + paginationFunctions + afterReturn;
      console.log('Fonctions de pagination ajoutées avant le return');
    } else {
      console.log('Pattern return non trouvé');
    }
  }
}

// Remplacer filteredData.map par displayedData.map
const filteredDataMapPattern = /filteredData\.map\(\(row, index\) => \(/g;
if (content.includes('displayedData')) {
  content = content.replace(filteredDataMapPattern, 'displayedData.map((row, index) => (');
  console.log('Boucle de rendu modifiée pour utiliser displayedData');
}

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(dataTablePath, content);
console.log(`Fichier ${dataTablePath} corrigé avec succès!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
