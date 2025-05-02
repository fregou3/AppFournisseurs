import React, { useState, useEffect, useCallback } from 'react';
import { Box, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem, Typography, Paper, Button } from '@mui/material';
import axios from 'axios';
import DataTable from './DataTable';
import config from '../config';
import SaveIcon from '@mui/icons-material/Save';

const Home = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [loadingTables, setLoadingTables] = useState(false);
  
  // Gestion des filtres et des colonnes visibles
  const [filters, setFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [savedFilterSettings, setSavedFilterSettings] = useState({});

  // Fonction pour récupérer la liste des tables
  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const response = await axios.get(`${config.apiUrl}/fournisseurs/tables`);
      const tablesList = response.data.tables || [];
      setTables(tablesList);
      
      // Toujours sélectionner la première table disponible
      if (tablesList.length > 0) {
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
  
  // Fonction pour sauvegarder les paramètres de filtres et colonnes visibles
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
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" component="div">
            Sélectionner la table à afficher :
          </Typography>
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
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveFilterSettings}
        >
          Sauvegarder les filtres et colonnes
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
    </Box>
  );
};

export default Home;
