import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  Divider,
  Chip
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import axios from 'axios';
import config from '../config';

const Compare = () => {
  // États pour les tables sélectionnées
  const [tables, setTables] = useState([]);
  const [selectedTable1, setSelectedTable1] = useState('');
  const [selectedTable2, setSelectedTable2] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Charger la liste des tables disponibles
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.apiUrl}/fournisseurs/tables`);
        if (response.data && response.data.tables) {
          setTables(response.data.tables);
          if (response.data.tables.length > 1) {
            setSelectedTable1(response.data.tables[0]);
            setSelectedTable2(response.data.tables[1]);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tables:', error);
        setError('Erreur lors du chargement des tables');
        setSnackbar({
          open: true,
          message: 'Erreur lors du chargement des tables',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  // Fonction pour récupérer toutes les données d'une table avec pagination
  const fetchAllTableData = async (tableName) => {
    let allData = [];
    let currentPage = 1;
    const pageSize = 1000; // Récupérer un grand nombre de lignes à la fois
    let hasMoreData = true;

    while (hasMoreData) {
      const response = await axios.get(`${config.apiUrl}/fournisseurs/table/${tableName}`, {
        params: {
          page: currentPage,
          pageSize: pageSize
        }
      });

      const { data, totalCount } = response.data;
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        // Vérifier si nous avons récupéré toutes les données
        if (allData.length >= totalCount) {
          hasMoreData = false;
        } else {
          currentPage++;
        }
      } else {
        hasMoreData = false;
      }
    }

    return allData;
  };

  // Fonction pour comparer les tables
  const compareTables = async () => {
    if (!selectedTable1 || !selectedTable2) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner deux tables à comparer',
        severity: 'warning'
      });
      return;
    }

    if (selectedTable1 === selectedTable2) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner deux tables différentes',
        severity: 'warning'
      });
      return;
    }

    try {
      setTableLoading(true);
      setError(null);
      setCompareResult(null);

      // Afficher un message pour indiquer que la récupération des données est en cours
      setSnackbar({
        open: true,
        message: 'Récupération de toutes les données des tables...',
        severity: 'info'
      });

      // Récupérer toutes les données des deux tables avec pagination
      const [table1Data, table2Data] = await Promise.all([
        fetchAllTableData(selectedTable1),
        fetchAllTableData(selectedTable2)
      ]);

      // Informer l'utilisateur du nombre de lignes récupérées
      setSnackbar({
        open: true,
        message: `Comparaison de ${table1Data.length} lignes de ${selectedTable1} avec ${table2Data.length} lignes de ${selectedTable2}`,
        severity: 'info'
      });

      // Comparer les données
      const result = compareTableData(table1Data, table2Data);
      setCompareResult(result);

    } catch (error) {
      console.error('Erreur lors de la comparaison des tables:', error);
      setError('Erreur lors de la comparaison des tables');
      setSnackbar({
        open: true,
        message: 'Erreur lors de la comparaison des tables',
        severity: 'error'
      });
    } finally {
      setTableLoading(false);
    }
  };

  // Fonction pour normaliser les valeurs pour la comparaison insensible à la casse
  const normalizeValue = (value) => {
    // Si la valeur est une chaîne, la convertir en minuscules pour la comparaison
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    // Sinon, retourner la valeur telle quelle
    return value;
  };

  // Fonction pour comparer les données des tables
  const compareTableData = (table1Data, table2Data) => {
    // Obtenir toutes les colonnes uniques des deux tables
    const allColumns = new Set();
    if (table1Data.length > 0) {
      Object.keys(table1Data[0]).forEach(col => {
        // Exclure la colonne "ID" de la comparaison
        if (col.toLowerCase() !== 'id') {
          allColumns.add(col);
        }
      });
    }
    if (table2Data.length > 0) {
      Object.keys(table2Data[0]).forEach(col => {
        // Exclure la colonne "ID" de la comparaison
        if (col.toLowerCase() !== 'id') {
          allColumns.add(col);
        }
      });
    }

    // Créer un index pour les données de la table 2 basé sur supplier_id
    const table2Index = {};
    table2Data.forEach(row => {
      if (row.supplier_id) {
        table2Index[row.supplier_id] = row;
      }
    });

    // Comparer les lignes
    const comparisonResults = [];
    
    // Lignes présentes dans la table 1
    table1Data.forEach(row1 => {
      const supplierId = row1.supplier_id;
      if (!supplierId) return;

      const row2 = table2Index[supplierId];
      const differences = {};
      let hasDifferences = false;

      if (row2) {
        // Le fournisseur existe dans les deux tables, comparer les colonnes
        allColumns.forEach(column => {
          const value1 = row1[column] !== undefined ? row1[column] : null;
          const value2 = row2[column] !== undefined ? row2[column] : null;
          
          // Normaliser les valeurs pour une comparaison insensible à la casse
          const normalizedValue1 = normalizeValue(value1);
          const normalizedValue2 = normalizeValue(value2);

          // Comparer les valeurs normalisées
          if (normalizedValue1 !== normalizedValue2) {
            differences[column] = {
              table1: value1,
              table2: value2
            };
            hasDifferences = true;
          }
        });

        comparisonResults.push({
          supplierId,
          existsInTable1: true,
          existsInTable2: true,
          differences,
          hasDifferences
        });
      } else {
        // Le fournisseur n'existe que dans la table 1
        comparisonResults.push({
          supplierId,
          existsInTable1: true,
          existsInTable2: false,
          differences: {},
          hasDifferences: true
        });
      }
    });

    // Lignes présentes uniquement dans la table 2
    table2Data.forEach(row2 => {
      const supplierId = row2.supplier_id;
      if (!supplierId) return;

      // Vérifier si ce fournisseur a déjà été traité (existe dans la table 1)
      const alreadyProcessed = comparisonResults.some(result => result.supplierId === supplierId);
      
      if (!alreadyProcessed) {
        comparisonResults.push({
          supplierId,
          existsInTable1: false,
          existsInTable2: true,
          differences: {},
          hasDifferences: true
        });
      }
    });

    // Statistiques
    const stats = {
      totalRows: comparisonResults.length,
      rowsWithDifferences: comparisonResults.filter(r => r.hasDifferences).length,
      onlyInTable1: comparisonResults.filter(r => r.existsInTable1 && !r.existsInTable2).length,
      onlyInTable2: comparisonResults.filter(r => !r.existsInTable1 && r.existsInTable2).length,
      columnsWithMostDifferences: calculateColumnDifferenceStats(comparisonResults)
    };

    return {
      table1Name: selectedTable1,
      table2Name: selectedTable2,
      columns: Array.from(allColumns),
      results: comparisonResults,
      stats
    };
  };

  // Calculer les statistiques de différences par colonne
  const calculateColumnDifferenceStats = (results) => {
    const columnDiffs = {};
    
    results.forEach(result => {
      if (result.existsInTable1 && result.existsInTable2) {
        Object.keys(result.differences).forEach(column => {
          if (!columnDiffs[column]) {
            columnDiffs[column] = 0;
          }
          columnDiffs[column]++;
        });
      }
    });

    // Trier les colonnes par nombre de différences
    return Object.entries(columnDiffs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([column, count]) => ({ column, count }));
  };

  // Filtrer les résultats pour n'afficher que les différences si demandé
  const getFilteredResults = () => {
    if (!compareResult) return [];
    
    if (showOnlyDifferences) {
      return compareResult.results.filter(result => result.hasDifferences);
    }
    
    return compareResult.results;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Comparaison de Tables
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="table1-label">Table 1</InputLabel>
            <Select
              labelId="table1-label"
              value={selectedTable1}
              label="Table 1"
              onChange={(e) => setSelectedTable1(e.target.value)}
              disabled={loading}
            >
              {tables.map((table) => (
                <MenuItem key={`table1-${table}`} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="table2-label">Table 2</InputLabel>
            <Select
              labelId="table2-label"
              value={selectedTable2}
              label="Table 2"
              onChange={(e) => setSelectedTable2(e.target.value)}
              disabled={loading}
            >
              {tables.map((table) => (
                <MenuItem key={`table2-${table}`} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<CompareArrowsIcon />}
            onClick={compareTables}
            disabled={loading || tableLoading || !selectedTable1 || !selectedTable2}
          >
            {tableLoading ? <CircularProgress size={24} /> : 'Comparer'}
          </Button>
        </Box>
        
        {compareResult && (
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnlyDifferences}
                onChange={(e) => setShowOnlyDifferences(e.target.checked)}
              />
            }
            label="Afficher uniquement les différences"
          />
        )}
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {compareResult && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résumé de la comparaison
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Chip 
                label={`Total: ${compareResult.stats.totalRows} lignes`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`Différences: ${compareResult.stats.rowsWithDifferences} lignes`} 
                color="warning" 
                variant="outlined"
              />
              <Chip 
                label={`Uniquement dans ${compareResult.table1Name}: ${compareResult.stats.onlyInTable1} lignes`} 
                color="error" 
                variant="outlined"
              />
              <Chip 
                label={`Uniquement dans ${compareResult.table2Name}: ${compareResult.stats.onlyInTable2} lignes`} 
                color="error" 
                variant="outlined"
              />
            </Box>
            
            {compareResult.stats.columnsWithMostDifferences.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Colonnes avec le plus de différences:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {compareResult.stats.columnsWithMostDifferences.map(({ column, count }) => (
                    <Chip 
                      key={column}
                      label={`${column}: ${count} différences`} 
                      color="info" 
                      size="small"
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Supplier ID</TableCell>
                  <TableCell>Status</TableCell>
                  {compareResult.columns.map(column => (
                    column !== 'supplier_id' && (
                      <TableCell key={column}>{column}</TableCell>
                    )
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredResults().map((result) => (
                  <TableRow 
                    key={result.supplierId}
                    sx={{
                      backgroundColor: !result.existsInTable1 || !result.existsInTable2 
                        ? '#fff8e1' // jaune clair pour les lignes qui n'existent que dans une table
                        : 'inherit'
                    }}
                  >
                    <TableCell>{result.supplierId}</TableCell>
                    <TableCell>
                      {!result.existsInTable1 && (
                        <Chip 
                          label={`Uniquement dans ${compareResult.table2Name}`} 
                          color="error" 
                          size="small"
                        />
                      )}
                      {!result.existsInTable2 && (
                        <Chip 
                          label={`Uniquement dans ${compareResult.table1Name}`} 
                          color="error" 
                          size="small"
                        />
                      )}
                      {result.existsInTable1 && result.existsInTable2 && (
                        result.hasDifferences ? (
                          <Chip 
                            label="Différences" 
                            color="warning" 
                            size="small"
                          />
                        ) : (
                          <Chip 
                            label="Identique" 
                            color="success" 
                            size="small"
                          />
                        )
                      )}
                    </TableCell>
                    {compareResult.columns.map(column => {
                      if (column === 'supplier_id') return null;
                      
                      const hasDiff = result.differences && result.differences[column];
                      
                      return (
                        <TableCell 
                          key={column}
                          sx={{
                            backgroundColor: hasDiff ? '#ffebee' : 'inherit', // rouge très clair pour les cellules avec différences
                            position: 'relative'
                          }}
                        >
                          {!result.existsInTable1 ? (
                            <Typography variant="body2" color="text.secondary">
                              {result.existsInTable2 && compareResult.results.find(r => 
                                r.supplierId === result.supplierId && r.existsInTable2
                              )?.[column]}
                            </Typography>
                          ) : !result.existsInTable2 ? (
                            <Typography variant="body2" color="text.secondary">
                              {result.existsInTable1 && compareResult.results.find(r => 
                                r.supplierId === result.supplierId && r.existsInTable1
                              )?.[column]}
                            </Typography>
                          ) : hasDiff ? (
                            <Box>
                              <Typography variant="body2" color="error">
                                {compareResult.table1Name}: {result.differences[column].table1 !== null ? result.differences[column].table1 : '(vide)'}
                              </Typography>
                              <Divider sx={{ my: 0.5 }} />
                              <Typography variant="body2" color="primary">
                                {compareResult.table2Name}: {result.differences[column].table2 !== null ? result.differences[column].table2 : '(vide)'}
                              </Typography>
                            </Box>
                          ) : (
                            result.existsInTable1 && result.existsInTable2 && (
                              <Typography variant="body2">
                                {result.differences[column]?.table1 !== undefined 
                                  ? result.differences[column].table1 
                                  : result.existsInTable1 && compareResult.results.find(r => 
                                    r.supplierId === result.supplierId && r.existsInTable1
                                  )?.[column]}
                              </Typography>
                            )
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Compare;
