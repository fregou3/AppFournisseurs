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
  const [selectedTable, setSelectedTable] = useState('fournisseurs');
  const [loadingTables, setLoadingTables] = useState(false);
  
  // Gestion des filtres et des colonnes visibles
  const [filters, setFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [savedFilterSettings, setSavedFilterSettings] = useState({});

  // Fonction pour récupérer la liste des tables
  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const response = await axios.get(`${config.apiUrl}/fournisseurs/tables`);
      const tablesList = response.data.tables || [];
      setTables(tablesList);
      
      // Si la table sélectionnée n'est pas dans la liste et qu'il y a des tables disponibles, sélectionner la première
      if (tablesList.length > 0 && !tablesList.includes(selectedTable)) {
        setSelectedTable(tablesList[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
    } finally {
      setLoadingTables(false);
    }
  };

  // Fonction pour charger les données de la table sélectionnée
  const fetchData = async (tableName, page = currentPage, size = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      // Si le nom de la table est 'fournisseurs', utiliser la route standard
      // Sinon, utiliser une route spécifique pour la table sélectionnée
      const url = tableName === 'fournisseurs' 
        ? `${config.apiUrl}/fournisseurs?page=${page}&pageSize=${size}` 
        : `${config.apiUrl}/fournisseurs/table/${tableName}?page=${page}&pageSize=${size}`;
      
      console.log('Fetching data from:', url);
      const response = await axios.get(url);
      console.log('Response received:', response.data);
      
      // Traiter les données en fonction du format de réponse
      if (response.data && Array.isArray(response.data.data)) {
        // Format avec pagination explicite
        setData(response.data.data);
        
        // Mettre à jour les informations de pagination
        if (response.data.pagination) {
          setTotalRows(response.data.pagination.totalRows || 0);
          setTotalPages(response.data.pagination.totalPages || 0);
          setCurrentPage(response.data.pagination.page || 1);
          setPageSize(response.data.pagination.pageSize || size);
        }
      } else if (Array.isArray(response.data)) {
        // Format tableau simple (ancienne API)
        setData(response.data);
        // Pour la table fournisseurs, nous n'avons pas d'informations de pagination
        // Nous utilisons donc la taille du tableau comme nombre total de lignes
        setTotalRows(response.data.length);
        setTotalPages(Math.ceil(response.data.length / size));
      } else {
        console.error('Format de données non reconnu:', response.data);
        setData([]);
        setTotalRows(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement des données de la table ${tableName}:`, error);
      setError(`Erreur lors du chargement des données de la table ${tableName}`);
      // En cas d'erreur, initialiser data avec un tableau vide pour éviter l'erreur "data is not iterable"
      setData([]);
      setTotalRows(0);
      setTotalPages(0);
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

  // Fonction pour changer de page
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchData(selectedTable, newPage, pageSize);
    }
  };

  // Fonction pour changer la taille de page
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Revenir à la première page
    fetchData(selectedTable, 1, newSize);
  };

  // Effet pour charger la liste des tables au chargement du composant
  useEffect(() => {
    fetchTables();
  }, []);

  // Effet pour charger les données lorsque la table sélectionnée change
  useEffect(() => {
    if (selectedTable) {
      // Réinitialiser la pagination lors du changement de table
      setCurrentPage(1);
      fetchData(selectedTable, 1, pageSize);
      
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
  }, [selectedTable, savedFilterSettings, pageSize]);

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
      
      {/* Contrôles de pagination */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2">
            Affichage de {data.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} à {Math.min(currentPage * pageSize, totalRows)} sur {totalRows} lignes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel id="page-size-select-label">Lignes par page</InputLabel>
            <Select
              labelId="page-size-select-label"
              id="page-size-select"
              value={pageSize}
              label="Lignes par page"
              onChange={(e) => handlePageSizeChange(e.target.value)}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={250}>250</MenuItem>
              <MenuItem value={500}>500</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              onClick={() => handlePageChange(1)} 
              disabled={currentPage === 1}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'<<'}
            </Button>
            <Button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'<'}
            </Button>
            <Typography variant="body1" sx={{ mx: 2 }}>
              Page {currentPage} sur {totalPages}
            </Typography>
            <Button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages || totalPages === 0}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'>'}
            </Button>
            <Button 
              onClick={() => handlePageChange(totalPages)} 
              disabled={currentPage === totalPages || totalPages === 0}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {'>>'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;