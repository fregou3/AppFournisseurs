import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import DataTable from './DataTable';
import config from '../config';

const Groupings = () => {
  const [groupings, setGroupings] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupData, setGroupData] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(new Set());
  const [sourceTableName, setSourceTableName] = useState('');
  const [availableTables, setAvailableTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // États pour l'export
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [fileName, setFileName] = useState('');
  const [exportError, setExportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Charger la liste des tables disponibles
  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const response = await axios.get(`${config.apiUrl}/fournisseurs/tables`);
      const tablesList = response.data.tables || [];
      console.log('Tables disponibles:', tablesList);
      setAvailableTables(tablesList);
      
      // Sélectionner la première table disponible comme table source par défaut
      if (tablesList.length > 0 && !sourceTableName) {
        setSourceTableName(tablesList[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la récupération des tables disponibles',
        severity: 'error'
      });
    } finally {
      setLoadingTables(false);
    }
  };

  // Charger la liste des regroupements
  const fetchGroupings = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/groups`);
      console.log('Groupes reçus:', response.data);
      setGroupings(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des regroupements:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des regroupements',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchTables();
    fetchGroupings();
  }, []);

  // Charger les données d'un regroupement
  const handleViewGroup = async (groupName) => {
    try {
      const response = await axios.get(`${config.apiUrl}/groups/${groupName}`);
      console.log('Données du groupe reçues:', response.data);

      // Mapping des noms de colonnes de la DB vers les noms d'affichage
      const dbToDisplayName = {
        'id': 'id',
        'supplier_id': 'Supplier_ID',
        'procurement_orga': 'PROCUREMENT ORGA',
        'partners': 'PARTNERS',
        'evaluated_not_evaluated': 'Evaluated / Not Evaluated',
        'ecovadis_name': 'Ecovadis name',
        'ecovadis_score': 'Score Ecovadis',
        'date': 'Date',
        'ecovadis_id': 'Ecovadis ID',
        'organization_1': 'ORGANIZATION 1',
        'organization_2': 'ORGANIZATION 2',
        'organization_country': 'ORGANIZATION COUNTRY',
        'subsidiary': 'SUBSIDIARY',
        'original_name_partner': 'ORIGINAL NAME PARTNER',
        'country_of_supplier_contact': 'Country of Supplier Contact',
        'vat_number': 'VAT number',
        'activity_area': 'Activity Area',
        'annual_spend_k_euros_a_2023': 'Annual spend k€ A-2023',
        'supplier_contact_first_name': 'Supplier Contact First Name',
        'supplier_contact_last_name': 'Supplier Contact Last Name',
        'supplier_contact_email': 'Supplier Contact Email',
        'supplier_contact_phone': 'Supplier Contact Phone',
        'adresse': 'Adresse',
        'nature_tiers': 'NATURE DU TIERS',
        'localisation': 'localisation',
        'pays_intervention': "Pays d'intervention",
        'region_intervention': "Région d'intervention",
        'score': 'score'
      };

      // Convertir les noms de colonnes dans les données
      const convertedData = response.data.data.map(row => {
        const newRow = {};
        Object.entries(row).forEach(([key, value]) => {
          newRow[dbToDisplayName[key] || key] = value;
        });
        return newRow;
      });

      setGroupData(convertedData);
      setSelectedGroup(groupName);
      
      // Réinitialiser les colonnes visibles avec toutes les colonnes
      if (convertedData && convertedData.length > 0) {
        const allColumns = new Set(Object.keys(convertedData[0]));
        setVisibleColumns(allColumns);
      }
      
      // Appliquer les filtres et colonnes visibles
      const savedColumns = response.data.visibleColumns;
      const savedFilters = response.data.filters;
      const tableName = response.data.table_name;
      
      console.log('Données du groupe:', {
        savedColumns,
        savedFilters,
        tableName
      });
      
      // Mettre à jour le nom de la table source si disponible
      if (tableName) {
        setSourceTableName(tableName);
      }
      
      // Convertir les noms de colonnes dans les colonnes visibles
      if (savedColumns) {
        const convertedColumns = new Set(
          savedColumns.map(col => dbToDisplayName[col] || col)
        );
        setVisibleColumns(convertedColumns);
      }
      
      // Convertir les noms de colonnes dans les filtres
      if (savedFilters) {
        const convertedFilters = {};
        Object.entries(savedFilters).forEach(([key, values]) => {
          const displayKey = dbToDisplayName[key] || key;
          convertedFilters[displayKey] = values;
        });
        setFilters(convertedFilters);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du groupe:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors du chargement des données du groupe',
        severity: 'error'
      });
    }
  };

  // Supprimer un regroupement
  const handleDeleteGroup = async (groupName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le regroupement "${groupName}" ?`)) {
      try {
        await axios.delete(`${config.apiUrl}/groups/${groupName}`);
        setSnackbar({
          open: true,
          message: 'Regroupement supprimé avec succès',
          severity: 'success'
        });
        fetchGroupings();
      } catch (error) {
        console.error('Erreur lors de la suppression du groupe:', error);
        setSnackbar({
          open: true,
          message: 'Erreur lors de la suppression du groupe',
          severity: 'error'
        });
      }
    }
  };

  // Retour à la liste des regroupements
  const handleBackToList = async () => {
    setSelectedGroup(null);
    setGroupData([]);
    // Rafraîchir la liste des regroupements
    await fetchGroupings();
  };

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
        url: `${config.apiUrl}/groups/export/${exportFormat}`,
        method: 'POST',
        data: { groupName: selectedGroup },
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

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedGroup) {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToList}
          >
            Retour à la liste
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Sélecteur de table source */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="source-table-select-label">Table source</InputLabel>
              <Select
                labelId="source-table-select-label"
                id="source-table-select"
                value={sourceTableName}
                label="Table source"
                onChange={(e) => setSourceTableName(e.target.value)}
                disabled={loadingTables}
              >
                {availableTables.map((table) => (
                  <MenuItem key={table} value={table}>
                    {table}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={() => setExportDialogOpen(true)}
            >
              Exporter
            </Button>
          </Box>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Regroupement : {selectedGroup}
        </Typography>
        
        {/* Ajouter un log pour voir les données passées au DataTable */}
        {console.log('Données passées au DataTable:', {
          groupData,
          filters,
          visibleColumns: Array.from(visibleColumns),
          sourceTableName
        })}
        
        <DataTable 
          data={groupData} 
          isGroupView={true} 
          externalFilters={filters}
          setExternalFilters={setFilters}
          externalVisibleColumns={visibleColumns}
          setExternalVisibleColumns={setVisibleColumns}
          tableName={sourceTableName} // Ajouter la propriété tableName
        />

        {/* Dialog pour l'export */}
        <Dialog 
          open={exportDialogOpen} 
          onClose={handleCloseExportDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Exporter le regroupement</DialogTitle>
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
                  value={fileName}
                  onChange={(e) => {
                    setFileName(e.target.value);
                    setExportError('');
                  }}
                  placeholder="Entrez le nom du fichier"
                  error={!!exportError}
                  helperText={exportError || `Le fichier sera exporté au format ${exportFormat === 'excel' ? 'Excel (.xlsx)' : 'CSV (.csv)'}`}
                  disabled={isExporting}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseExportDialog}
              disabled={isExporting}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleExport} 
              variant="contained" 
              color="primary"
              disabled={!fileName || isExporting}
            >
              {isExporting ? 'Export en cours...' : 'Exporter'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Liste des regroupements
      </Typography>
      {groupings.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Aucun regroupement n'a été créé pour le moment.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom du groupe</TableCell>
                <TableCell align="center">Nombre d'enregistrements</TableCell>
                <TableCell align="center">Date de création</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupings.map((group) => (
                <TableRow key={group.name}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell align="center">{group.record_count}</TableCell>
                  <TableCell align="center">
                    {group.created_at ? formatDate(group.created_at) : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Voir le groupe">
                      <IconButton
                        onClick={() => handleViewGroup(group.name)}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer le groupe">
                      <IconButton
                        onClick={() => handleDeleteGroup(group.name)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Groupings;
