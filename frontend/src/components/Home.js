import React, { useState, useEffect, useCallback } from 'react';
import { Box, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem, Typography, Paper, Button, Tooltip, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, Radio, FormControlLabel, TextField } from '@mui/material';
import axios from 'axios';
import DataTable from './DataTable';
import config from '../config';
import CalculateIcon from '@mui/icons-material/Calculate';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const Home = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [loadingTables, setLoadingTables] = useState(false);
  const [defaultTable, setDefaultTable] = useState('');
  const [settingDefaultTable, setSettingDefaultTable] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [calculatingScores, setCalculatingScores] = useState(false);
  const [calculTask, setCalculTask] = useState(null);
  const [calculProgress, setCalculProgress] = useState(0);
  
  // Gestion des filtres et des colonnes visibles
  const [filters, setFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [savedFilterSettings, setSavedFilterSettings] = useState({});
  
  // États pour l'export
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [fileName, setFileName] = useState('');
  const [exportError, setExportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Fonction pour récupérer la table par défaut
  const fetchDefaultTable = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/settings/default-table`);
      if (response.data.defaultTable) {
        setDefaultTable(response.data.defaultTable);
        return response.data.defaultTable;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la table par défaut:', error);
      return null;
    }
  };

  // Fonction pour définir la table par défaut
  const setAsDefaultTable = async () => {
    if (!selectedTable) return;
    
    try {
      setSettingDefaultTable(true);
      const response = await axios.post(`${config.apiUrl}/settings/default-table`, { tableName: selectedTable });
      setDefaultTable(selectedTable);
      setNotification({
        open: true,
        message: `Table ${selectedTable} définie comme table par défaut`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la définition de la table par défaut:', error);
      setNotification({
        open: true,
        message: `Erreur lors de la définition de la table par défaut: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    } finally {
      setSettingDefaultTable(false);
    }
  };

  // Fonction pour récupérer la liste des tables
  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const response = await axios.get(`${config.apiUrl}/fournisseurs/tables`);
      const tablesList = response.data.tables || [];
      setTables(tablesList);
      
      // Récupérer la table par défaut
      const defaultTableName = await fetchDefaultTable();
      
      // Sélectionner la table par défaut si elle existe et est dans la liste
      if (defaultTableName && tablesList.includes(defaultTableName)) {
        setSelectedTable(defaultTableName);
      } else if (tablesList.length > 0) {
        // Sinon, sélectionner la première table disponible
        setSelectedTable(tablesList[0]);
      } else {
        setError("Aucune table disponible. Veuillez vérifier la configuration de la base de données.");
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      setError("Erreur lors de la récupération des tables disponibles. Veuillez réessayer ultérieurement.");
    } finally {
      setLoadingTables(false);
    }
  };

  // Fonction pour charger les données de la table sélectionnée
  const fetchData = async (tableName) => {
    setLoading(true);
    setError(null);
    try {
      // Utiliser une grande taille de page pour récupérer toutes les lignes en une seule requête
      const url = tableName === 'fournisseurs' 
        ? `${config.apiUrl}/fournisseurs?pageSize=15000` 
        : `${config.apiUrl}/fournisseurs/table/${tableName}?pageSize=15000`;
      
      console.log('Fetching all data from:', url);
      const response = await axios.get(url);
      console.log('Response received:', response.data);
      
      // S'assurer que data est toujours un tableau
      let allData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination
        allData = response.data.data;
        console.log(`Données récupérées (format paginé): ${allData.length} lignes`);
      } else if (Array.isArray(response.data)) {
        // Format tableau simple
        allData = response.data;
        console.log(`Données récupérées (format tableau): ${allData.length} lignes`);
      } else if (response.data && typeof response.data === 'object') {
        // Si c'est un objet mais pas un tableau, essayer de le convertir
        try {
          allData = Object.values(response.data);
          console.log(`Données récupérées (format objet): ${allData.length} lignes`);
        } catch (e) {
          console.error('Impossible de convertir les données en tableau:', e);
          allData = [];
        }
      } else {
        console.error('Format de données non reconnu:', response.data);
        allData = [];
      }
      
      console.log(`Total des données récupérées: ${allData.length} lignes`);
      setData(Array.isArray(allData) ? allData : []);
    } catch (error) {
      console.error(`Erreur lors du chargement des données de la table ${tableName}:`, error);
      setError(`Erreur lors du chargement des données de la table ${tableName}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire de changement de table
  const handleTableChange = (event) => {
    const newTable = event.target.value;
    setSelectedTable(newTable);
  };
  
  // Fonction pour vérifier l'état d'une tâche de calcul des scores
  const checkTaskStatus = async (taskId) => {
    try {
      const response = await axios.get(`${config.apiUrl}/fournisseurs/calculate-scores/status/${taskId}`);
      const task = response.data;
      
      setCalculTask(task);
      
      // Mettre à jour la notification en fonction du statut
      if (task.status === 'completed') {
        const { stats } = task;
        setNotification({
          open: true,
          message: `Calcul des scores terminé : ${stats.updated} scores mis à jour, ${stats.unchanged} inchangés, ${stats.errors} erreurs sur ${stats.total} fournisseurs`,
          severity: 'success'
        });
        
        // Recharger les données pour afficher les nouveaux scores
        fetchData(selectedTable);
        setCalculatingScores(false);
        
        // Arrêter la vérification
        return true;
      } else if (task.status === 'error' || task.status === 'completed_with_errors') {
        setNotification({
          open: true,
          message: `Erreur lors du calcul des scores: ${task.error?.message || 'Erreur inconnue'}`,
          severity: 'error'
        });
        setCalculatingScores(false);
        
        // Arrêter la vérification
        return true;
      } else {
        // Continuer la vérification
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      setCalculatingScores(false);
      return true; // Arrêter la vérification en cas d'erreur
    }
  };
  
  // Fonction pour calculer les scores de la table sélectionnée
  const calculateScores = useCallback(async () => {
    if (!selectedTable) {
      setNotification({
        open: true,
        message: 'Veuillez sélectionner une table',
        severity: 'warning'
      });
      return;
    }
    
    try {
      // Afficher une notification de début de calcul
      setNotification({
        open: true,
        message: 'Démarrage du calcul des scores...',
        severity: 'info'
      });
      
      // Utiliser la route fournisseurs existante (version asynchrone)
      const response = await axios.post(`${config.apiUrl}/fournisseurs/calculate-scores/${selectedTable}`);
      
      // Récupérer l'ID de la tâche
      const { taskId } = response.data;
      
      // Mettre à jour l'interface pour indiquer que le calcul est en cours
      setNotification({
        open: true,
        message: 'Calcul des scores en cours... Cela peut prendre plusieurs minutes.',
        severity: 'info'
      });
      
      // Vérifier périodiquement l'état de la tâche
      const checkInterval = setInterval(async () => {
        const isCompleted = await checkTaskStatus(taskId);
        if (isCompleted) {
          clearInterval(checkInterval);
        }
      }, 3000); // Vérifier toutes les 3 secondes
      
    } catch (error) {
      console.error('Erreur lors du calcul des scores:', error);
      setNotification({
        open: true,
        message: `Erreur lors du démarrage du calcul des scores: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setCalculatingScores(false);
    }
  }, [selectedTable, fetchData]);
  
  // Fonction pour gérer l'export
  const handleExport = async () => {
    if (!fileName) {
      setExportError('Veuillez spécifier un nom de fichier');
      return;
    }

    setIsExporting(true);
    try {
      const extension = exportFormat === 'excel' ? '.xlsx' : '.csv';
      const fullFileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;

      const response = await axios({
        url: `${config.apiUrl}/fournisseurs/export/${exportFormat}`,
        method: 'POST',
        data: { 
          tableName: selectedTable,
          filters: filters,
          visibleColumns: Array.from(visibleColumns)
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: exportFormat === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fullFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: `Export ${exportFormat.toUpperCase()} réussi`,
        severity: 'success'
      });
      setExportDialogOpen(false);
      setFileName('');
      setExportError('');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      setExportError('Erreur lors de l\'export. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  // Réinitialiser les états lors de la fermeture du dialogue
  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
    setFileName('');
    setExportError('');
    setIsExporting(false);
  };
  
  // Fonction pour sauvegarder les paramètres de filtres et colonnes visibles (conservée mais non utilisée)
  const saveFilterSettings = useCallback(() => {
    setSavedFilterSettings(prev => ({
      ...prev,
      [selectedTable]: {
        filters,
        visibleColumns
      }
    }));
  }, [selectedTable, filters, visibleColumns]);

  // Effet pour charger la liste des tables au chargement du composant
  useEffect(() => {
    fetchTables();
  }, []);

  // Effet pour charger les données lorsque la table sélectionnée change
  useEffect(() => {
    if (selectedTable) {
      fetchData(selectedTable);
      
      // Charger les filtres et colonnes sauvegardés pour cette table
      if (savedFilterSettings[selectedTable]) {
        setFilters(savedFilterSettings[selectedTable].filters || {});
        setVisibleColumns(savedFilterSettings[selectedTable].visibleColumns || {});
      } else {
        // Si aucun paramètre n'est sauvegardé, réinitialiser
        setFilters({});
        setVisibleColumns({});
      }
    }
  }, [selectedTable, savedFilterSettings]);
  
  // Afficher un message de chargement pendant la récupération des tables
  if (loadingTables) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Chargement des tables disponibles...
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Notification pour les actions de table par défaut */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component="div">
            Sélectionner la table à afficher :
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl sx={{ minWidth: 250 }}>
              <InputLabel id="table-select-label">Table</InputLabel>
              <Select
                labelId="table-select-label"
                id="table-select"
                value={selectedTable}
                label="Table"
                onChange={handleTableChange}
                disabled={loadingTables || loading}
              >
                {tables.map((table) => (
                  <MenuItem key={table} value={table}>
                    {table === defaultTable ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StarIcon sx={{ color: 'gold', mr: 1 }} fontSize="small" />
                        {table}
                      </Box>
                    ) : (
                      table
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Tooltip title={selectedTable === defaultTable ? "Déjà définie comme table par défaut" : "Définir comme table par défaut"}>
              <span> {/* Wrapper pour que le Tooltip fonctionne même si le bouton est désactivé */}
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={setAsDefaultTable}
                  disabled={loadingTables || loading || settingDefaultTable || selectedTable === defaultTable || !selectedTable}
                  sx={{ height: 40 }}
                  startIcon={selectedTable === defaultTable ? <StarIcon sx={{ color: 'gold' }} /> : <StarBorderIcon />}
                >
                  {settingDefaultTable ? <CircularProgress size={24} /> : "Table par défaut"}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<CalculateIcon />}
          onClick={calculateScores}
          disabled={calculatingScores || !selectedTable}
        >
          {calculatingScores ? <CircularProgress size={24} color="inherit" /> : 'Calculer les scores'}
        </Button>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={<FileDownloadIcon />}
          onClick={() => setExportDialogOpen(true)}
        >
          Exporter
        </Button>
      </Box>
      
      <DataTable 
        data={data} 
        externalFilters={filters}
        setExternalFilters={setFilters}
        externalVisibleColumns={visibleColumns}
        setExternalVisibleColumns={setVisibleColumns}
        onDataUpdate={(updatedData) => setData(updatedData)}
        tableName={selectedTable}
      />
      
      {/* Dialog pour l'export */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={handleCloseExportDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Exporter les données</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Format d'export
            </Typography>
            <RadioGroup
              value={exportFormat}
              onChange={(e) => {
                setExportFormat(e.target.value);
                setFileName('');
                setExportError('');
              }}
              row
            >
              <FormControlLabel 
                value="excel" 
                control={<Radio />} 
                label="Excel (.xlsx)" 
              />
              <FormControlLabel 
                value="csv" 
                control={<Radio />} 
                label="CSV (.csv)" 
              />
            </RadioGroup>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Nom du fichier
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={`export_${selectedTable || 'donnees'}_${new Date().toISOString().split('T')[0]}`}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                error={!!exportError}
                helperText={exportError}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportDialog} disabled={isExporting}>
            Annuler
          </Button>
          <Button 
            onClick={handleExport} 
            variant="contained" 
            color="primary"
            disabled={isExporting}
          >
            {isExporting ? <CircularProgress size={24} /> : 'Exporter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;
