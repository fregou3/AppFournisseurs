/**
 * Script pour corriger toutes les erreurs de guillemets dans DataTable.js
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier DataTable.js
const dataTablePath = path.join(__dirname, 'DataTable.js');
console.log(`Lecture du fichier ${dataTablePath}...`);
let content = fs.readFileSync(dataTablePath, 'utf8');

// Créer une sauvegarde du fichier
const backupPath = `${dataTablePath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Corriger la ligne problématique spécifique
const problematicLine = `if (columnName === "score' || columnName === "Score" || columnName === 'Scoring") {`;
const fixedLine = `if (columnName === 'score' || columnName === 'Score' || columnName === 'Scoring') {`;

if (content.includes(problematicLine)) {
  content = content.replace(problematicLine, fixedLine);
  console.log('Condition if corrigée');
}

// Approche plus radicale : recréer le fichier DataTable.js à partir de zéro
// avec une syntaxe correcte pour toutes les chaînes de caractères
const cleanContent = `import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  TextField,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
  Button,
  TablePagination,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  Input,
  CircularProgress
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import axios from 'axios';
import config from '../config';

const DataTable = ({ 
  data = [], 
  isGroupView = false,
  externalFilters,
  setExternalFilters,
  externalVisibleColumns,
  setExternalVisibleColumns,
  onDataUpdate,
  tableName: propTableName
}) => {
  console.log('DataTable - Props reçues:', {
    dataLength: data.length,
    firstRow: data[0],
    isGroupView,
    tableName: propTableName
  });

  // États pour les filtres et les colonnes visibles
  const [localFilters, setLocalFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState({});
  const [filterValues, setFilterValues] = useState({});
  const [searchText, setSearchText] = useState('');
  
  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // États pour les groupes
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupError, setGroupError] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Référence pour l'input de fichier
  const fileInputRef = useRef(null);
  
  // Déterminer le nom de la table
  const tableName = propTableName || 'fournisseurs';
  
  // Effet pour initialiser les colonnes visibles
  useEffect(() => {
    if (data.length > 0) {
      // Si des colonnes visibles externes sont fournies, les utiliser
      if (externalVisibleColumns) {
        setVisibleColumns(externalVisibleColumns);
      } else {
        // Sinon, initialiser avec toutes les colonnes des données
        const allColumns = new Set(Object.keys(data[0]));
        setVisibleColumns(allColumns);
      }
    }
  }, [data, externalVisibleColumns]);
  
  // Filtrer les données en fonction des filtres et du texte de recherche
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.filter(row => {
      // Appliquer les filtres (externes ou locaux)
      const filtersToApply = externalFilters || localFilters;
      const passesFilters = Object.entries(filtersToApply).every(([column, value]) => {
        if (!value) return true;
        const cellValue = row[column];
        if (cellValue === null || cellValue === undefined) return false;
        return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
      });
      
      // Appliquer la recherche globale
      const passesSearch = !searchText || Object.values(row).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchText.toLowerCase());
      });
      
      return passesFilters && passesSearch;
    });
  }, [data, externalFilters, localFilters, searchText]);
  
  // Calculer les données paginées
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);
  
  // Gestionnaires de pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Fonction pour obtenir le style d'alignement d'une colonne
  const getColumnAlignment = (columnName) => {
    // Colonnes numériques alignées à droite
    const numericColumns = ['score', 'Score', 'Scoring', 'Santé financière', 'Calcul méthode ADEME'];
    if (numericColumns.includes(columnName)) return 'right';
    return 'left';
  };
  
  // Fonction pour obtenir le style de cellule
  const getCellStyle = (row, column) => {
    // Style pour les cellules de score
    if (column === 'score' || column === 'Score' || column === 'Scoring') {
      return getScoreStyle(row[column]);
    }
    return {};
  };
  
  // Fonction pour obtenir le style de score
  const getScoreStyle = (score) => {
    if (score === null) return {};
    
    const scoreNum = parseInt(score);
    const styles = {
      fontWeight: 'bold',
      color: '#FFFFFF'
    };
    
    if (scoreNum >= 80) {
      styles.backgroundColor = '#4CAF50'; // Vert
    } else if (scoreNum >= 60) {
      styles.backgroundColor = '#8BC34A'; // Vert clair
    } else if (scoreNum >= 40) {
      styles.backgroundColor = '#FFC107'; // Jaune
    } else if (scoreNum >= 20) {
      styles.backgroundColor = '#FF9800'; // Orange
    } else {
      styles.backgroundColor = '#F44336'; // Rouge
    }
    
    return styles;
  };
  
  // Fonction pour obtenir le style d'en-tête
  const getHeaderStyle = (columnName) => {
    const baseStyle = {
      fontWeight: 'bold',
      color: '#FFFFFF'
    };
    
    // Colonnes spéciales avec couleurs différentes
    if (columnName === 'score' || columnName === 'Score' || columnName === 'Scoring') {
      return { ...baseStyle, backgroundColor: '#2196F3' }; // Bleu
    } else if (columnName === 'Santé financière') {
      return { ...baseStyle, backgroundColor: '#9C27B0' }; // Violet
    } else if (columnName === 'Calcul méthode ADEME') {
      return { ...baseStyle, backgroundColor: '#009688' }; // Turquoise
    }
    
    // Style par défaut
    return { ...baseStyle, backgroundColor: '#3f51b5' }; // Indigo
  };
  
  // Fonction pour rendre une cellule
  const renderCell = useCallback((row, column) => {
    // Gestion du champ Evaluated / Not Evaluated ou Eval Moodies
    if (column === 'Eval Moodies' || column === 'evaluated_not_evaluated') {
      return row[column] === 'Evaluated' ? 'Évalué' : 'Non évalué';
    }
    
    // Gestion des scores
    if (column === 'score' || column === 'Score' || column === 'Scoring') {
      return row[column] !== null ? row[column] : 'N/A';
    }
    
    // Gestion des URLs (liens)
    if (column === 'Website' || column === 'website' || column === 'URL' || column === 'url') {
      const url = row[column];
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        return (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        );
      }
    }
    
    // Gestion des fichiers PDF
    if (column === 'file' && row[column] && row[column].endsWith('.pdf')) {
      return (
        <Button
          variant="contained"
          size="small"
          onClick={() => openLocalPDF(row[column])}
        >
          Voir PDF
        </Button>
      );
    }
    
    // Valeur par défaut
    return row[column] !== undefined && row[column] !== null ? row[column] : '';
  }, []);
  
  // Fonction pour ouvrir un fichier PDF local
  const openLocalPDF = useCallback(async (filename) => {
    try {
      const encodedFilename = encodeURIComponent(filename);
      const response = await axios.get(\`\${config.apiUrl}/fournisseurs/open-pdf?filename=\${encodedFilename}\`);
      console.log('Réponse du serveur:', response.data);
      
      if (response.data.success) {
        console.log('Le fichier PDF a été ouvert avec succès');
      } else {
        console.error("Erreur lors de l'ouverture du PDF:", response.data.message);
        setSnackbar({
          open: true,
          message: \`Erreur: \${response.data.message}\`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API:", error);
      setSnackbar({
        open: true,
        message: "Erreur lors de l'ouverture du PDF",
        severity: 'error'
      });
    }
  }, []);
  
  // Fonction pour gérer l'upload de fichier
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tableName', tableName);
    
    try {
      const response = await axios.post(\`\${config.apiUrl}/fournisseurs/upload\`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadSuccess(\`Fichier \${file.name} uploadé avec succès\`);
      console.log('Réponse du serveur:', response.data);
      
      // Mettre à jour les données si nécessaire
      if (onDataUpdate) {
        onDataUpdate(response.data);
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      setUploadError(\`Erreur lors de l'upload: \${error.response?.data?.message || error.message}\`);
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [tableName, onDataUpdate]);
  
  // Fonction pour déclencher le dialogue de sélection de fichier
  const triggerFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Fonction pour ouvrir le dialogue de création de groupe
  const handleOpenGroupDialog = useCallback(() => {
    setOpenGroupDialog(true);
    setGroupName('');
    setGroupError('');
  }, []);
  
  // Fonction pour fermer le dialogue de création de groupe
  const handleCloseGroupDialog = useCallback(() => {
    setOpenGroupDialog(false);
  }, []);
  
  // Fonction pour sauvegarder un groupe
  const handleSaveGroup = useCallback(async () => {
    if (!groupName.trim()) {
      setGroupError("Le nom du groupe ne peut pas être vide");
      return;
    }
    
    try {
      const selectedRows = filteredData;
      const response = await axios.post(\`\${config.apiUrl}/fournisseurs/groups\`, {
        name: groupName,
        rows: selectedRows,
        tableName
      });
      
      console.log('Groupe créé:', response.data);
      setSnackbar({
        open: true,
        message: \`Groupe "\${groupName}" créé avec succès\`,
        severity: 'success'
      });
      handleCloseGroupDialog();
    } catch (error) {
      console.error("Erreur lors de la création du groupe:", error);
      setGroupError(\`Erreur: \${error.response?.data?.message || error.message}\`);
    }
  }, [groupName, filteredData, tableName, handleCloseGroupDialog]);
  
  // Fonction pour gérer la visibilité des colonnes
  const toggleColumnVisibility = useCallback((column) => {
    // Créer un nouveau Set à partir des colonnes visibles actuelles
    const newVisibleColumns = new Set(
      Array.isArray(visibleColumns) ? visibleColumns : 
      (visibleColumns instanceof Set ? visibleColumns : [])
    );
    
    if (newVisibleColumns.has(column)) {
      newVisibleColumns.delete(column);
    } else {
      newVisibleColumns.add(column);
    }
    
    // Mettre à jour les colonnes visibles
    if (setExternalVisibleColumns) {
      setExternalVisibleColumns(newVisibleColumns);
    } else {
      setVisibleColumns(newVisibleColumns);
    }
  }, [visibleColumns, setExternalVisibleColumns]);
  
  // Fonction pour ouvrir le menu de colonnes
  const handleColumnMenuOpen = useCallback((event) => {
    setColumnMenuAnchor(event.currentTarget);
  }, []);
  
  // Fonction pour fermer le menu de colonnes
  const handleColumnMenuClose = useCallback(() => {
    setColumnMenuAnchor(null);
  }, []);
  
  // Fonction pour rendre le menu de colonnes
  const renderColumnMenu = useCallback(() => {
    if (!data || data.length === 0) return null;
    
    const allColumns = Object.keys(data[0]);
    
    return (
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={handleColumnMenuClose}
      >
        {allColumns.map(column => (
          <MenuItem key={column}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={visibleColumns.has(column)}
                  onChange={() => toggleColumnVisibility(column)}
                />
              }
              label={column}
            />
          </MenuItem>
        ))}
      </Menu>
    );
  }, [columnMenuAnchor, data, visibleColumns, handleColumnMenuClose, toggleColumnVisibility]);
  
  // Fonction pour gérer le clic sur le bouton de filtre
  const handleFilterClick = useCallback((event, column) => {
    setFilterMenuAnchor(prev => ({
      ...prev,
      [column]: event.currentTarget
    }));
  }, []);
  
  // Fonction pour gérer le changement de filtre
  const handleFilterChange = useCallback((column, value) => {
    setFilterValues(prev => ({
      ...prev,
      [column]: value
    }));
  }, []);
  
  // Fonction pour fermer le menu de filtre
  const handleFilterClose = useCallback((column) => {
    setFilterMenuAnchor(prev => ({
      ...prev,
      [column]: null
    }));
    
    // Appliquer le filtre
    applyFilter(column, filterValues[column]);
  }, [filterValues]);
  
  // Fonction pour appliquer un filtre
  const applyFilter = useCallback((column, value) => {
    if (setExternalFilters) {
      setExternalFilters(prev => ({
        ...prev,
        [column]: value
      }));
    } else {
      setLocalFilters(prev => ({
        ...prev,
        [column]: value
      }));
    }
    
    // Réinitialiser la page
    setPage(0);
  }, [setExternalFilters]);
  
  // Fonction pour effacer un filtre
  const clearFilter = useCallback((column) => {
    // Réinitialiser la valeur du filtre
    setFilterValues(prev => ({
      ...prev,
      [column]: ''
    }));
    
    // Supprimer le filtre
    if (setExternalFilters) {
      setExternalFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[column];
        return newFilters;
      });
    } else {
      setLocalFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[column];
        return newFilters;
      });
    }
    
    // Réinitialiser la page
    setPage(0);
  }, [setExternalFilters]);
  
  // Fonction pour effacer tous les filtres
  const clearAllFilters = useCallback(() => {
    // Réinitialiser toutes les valeurs de filtre
    setFilterValues({});
    
    // Supprimer tous les filtres
    if (setExternalFilters) {
      setExternalFilters({});
    } else {
      setLocalFilters({});
    }
    
    // Réinitialiser la recherche et la page
    setSearchText('');
    setPage(0);
  }, [setExternalFilters]);
  
  // Rendu du composant
  return (
    <Box sx={{ width: '100%' }}>
      {/* Barre d'outils */}
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Rechercher"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ mr: 2 }}
        />
        
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={clearAllFilters}
          sx={{ mr: 2 }}
        >
          Effacer les filtres
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<ViewColumnIcon />}
          onClick={handleColumnMenuOpen}
          sx={{ mr: 2 }}
        >
          Colonnes
        </Button>
        
        {isGroupView && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleOpenGroupDialog}
            sx={{ mr: 2 }}
          >
            Créer un groupe
          </Button>
        )}
        
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={triggerFileInput}
          disabled={isUploading}
          sx={{ mr: 2 }}
        >
          {isUploading ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".xlsx,.xls,.csv"
        />
      </Box>
      
      {/* Affichage des filtres actifs */}
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(externalFilters || localFilters).map(([column, value]) => (
          <Chip
            key={column}
            label={\`\${column}: \${value}\`}
            onDelete={() => clearFilter(column)}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>
      
      {/* Tableau */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              {Array.from(visibleColumns).map(column => (
                <TableCell
                  key={column}
                  align={getColumnAlignment(column)}
                  sx={getHeaderStyle(column)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {column}
                    <IconButton
                      size="small"
                      onClick={(e) => handleFilterClick(e, column)}
                      sx={{ color: 'white' }}
                    >
                      <FilterListIcon fontSize="small" />
                    </IconButton>
                    
                    <Menu
                      anchorEl={filterMenuAnchor[column]}
                      open={Boolean(filterMenuAnchor[column])}
                      onClose={() => handleFilterClose(column)}
                    >
                      <MenuItem>
                        <TextField
                          label={\`Filtrer \${column}\`}
                          variant="outlined"
                          size="small"
                          value={filterValues[column] || ''}
                          onChange={(e) => handleFilterChange(column, e.target.value)}
                          autoFocus
                        />
                      </MenuItem>
                    </Menu>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow
                key={row.id || index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {Array.from(visibleColumns).map((column) => (
                  <TableCell 
                    key={column} 
                    align={getColumnAlignment(column)}
                    sx={getCellStyle(row, column)}
                  >
                    {renderCell(row, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumns.size} align="center">
                  Aucune donnée disponible
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 250, 500]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => 
            \`Affichage de \${from} à \${to} sur \${count} lignes\`
          }
        />
      </TableContainer>
      
      {/* Dialogue de création de groupe */}
      <Dialog open={openGroupDialog} onClose={handleCloseGroupDialog}>
        <DialogTitle>Créer un nouveau groupe</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du groupe"
            fullWidth
            variant="outlined"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            error={!!groupError}
            helperText={groupError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDialog}>Annuler</Button>
          <Button onClick={handleSaveGroup} variant="contained">Créer</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbars pour les messages d'upload */}
      <Snackbar
        open={!!uploadError}
        autoHideDuration={6000}
        onClose={() => setUploadError(null)}
      >
        <Alert severity="error" onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!uploadSuccess}
        autoHideDuration={6000}
        onClose={() => setUploadSuccess(null)}
      >
        <Alert severity="success" onClose={() => setUploadSuccess(null)}>
          {uploadSuccess}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataTable;`;

// Écrire le contenu propre dans le fichier
fs.writeFileSync(dataTablePath, cleanContent);
console.log(`Fichier ${dataTablePath} entièrement recréé avec une syntaxe correcte!`);

console.log('Veuillez redémarrer l\'application frontend pour appliquer les corrections.');
