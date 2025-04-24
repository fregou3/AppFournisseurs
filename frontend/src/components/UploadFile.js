import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import config from '../config';

const UploadFile = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [openDialog, setOpenDialog] = useState(false);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [loadingTables, setLoadingTables] = useState(false);
  const [createNewTable, setCreateNewTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [autoTableName, setAutoTableName] = useState('');

  // Charger la liste des tables au chargement du composant
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const response = await axios.get(`${config.apiUrl}/fournisseurs/tables`);
      setTables(response.data.tables || []);
      
      // Sélectionner la première table par défaut s'il y en a
      if (response.data.tables && response.data.tables.length > 0) {
        setSelectedTable(response.data.tables[0]);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleTableChange = (event) => {
    setSelectedTable(event.target.value);
  };

  const handleCreateNewTableChange = (event) => {
    setCreateNewTable(event.target.checked);
    if (!event.target.checked) {
      // Si on désactive la création de nouvelle table, réinitialiser le nom et sélectionner une table existante
      setNewTableName('');
      if (tables.length > 0) {
        setSelectedTable(tables[0]);
      }
    } else {
      // Si on active la création de nouvelle table, désélectionner la table existante
      setSelectedTable('');
      // Proposer un nom de table par défaut basé sur la date
      const today = new Date();
      const dateStr = today.getFullYear() + '_' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '_' + 
                     String(today.getDate()).padStart(2, '0');
      setNewTableName(`fournisseurs_${dateStr}`);
    }
  };

  const handleNewTableNameChange = (event) => {
    let value = event.target.value;
    
    // S'assurer que le nom commence par "fournisseurs"
    if (!value.startsWith('fournisseurs')) {
      value = 'fournisseurs_' + value.replace(/^fournisseurs_?/i, '');
    }
    
    // Remplacer les caractères non valides par des underscores
    value = value.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    
    setNewTableName(value);
  };

  // Fonction pour générer un nom de table à partir du nom du fichier
  const generateTableNameFromFile = (fileName) => {
    // Extraire le nom du fichier sans l'extension
    const baseName = fileName.replace(/\.[^\.]+$/, '');
    
    // Convertir en format valide pour un nom de table PostgreSQL
    let tableName = 'fournisseurs_' + baseName.toLowerCase()
      .replace(/[^a-z0-9]/g, '_') // Remplacer les caractères non alphanumériques par des underscores
      .replace(/_{2,}/g, '_')     // Remplacer les séquences d'underscores par un seul
      .replace(/^_|_$/g, '');     // Supprimer les underscores au début et à la fin
    
    return tableName;
  };
  
  // Fonction appelée lorsqu'un fichier est sélectionné dans l'input
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Générer un nom de table à partir du nom du fichier
      const generatedTableName = generateTableNameFromFile(file.name);
      setAutoTableName(generatedTableName);
      
      // Si l'utilisateur est en mode création de table, proposer ce nom
      if (createNewTable && !newTableName) {
        setNewTableName(generatedTableName);
      }
    } else {
      setSelectedFile(null);
      setAutoTableName('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setMessage('No file selected');
      setSeverity('error');
      return;
    }
    
    // Mettre à jour le fichier sélectionné et générer un nom de table
    handleFileSelect(event);

    // Vérifier que la table est sélectionnée ou qu'une nouvelle table est spécifiée
    if (!createNewTable && !selectedTable) {
      setMessage('Aucune table sélectionnée');
      setSeverity('error');
      return;
    }
    
    // Vérifier que le nom de la nouvelle table est valide
    if (createNewTable && (!newTableName || newTableName.length < 3)) {
      setMessage('Nom de table invalide');
      setSeverity('error');
      return;
    }

    // Vérifier le type de fichier
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream' // Pour gérer certains navigateurs qui ne définissent pas correctement le type MIME
    ];
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setMessage('Please select an Excel file (.xlsx or .xls)');
      setSeverity('error');
      return;
    }

    try {
      setLoading(true);
      const tableName = createNewTable ? newTableName : selectedTable;
      setMessage(`Importation du fichier dans la table ${tableName}...`);
      setSeverity('info');

      const formData = new FormData();
      formData.append('file', file);
      // Ajouter le nom de la table comme champ de formulaire
      formData.append('tableName', tableName);
      // Toujours désactiver la déduplication pour garantir le même nombre de lignes
      formData.append('preventDuplicates', 'false');

      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        table: selectedTable,
        url: `${config.apiUrl}/fournisseurs/upload`
      });

      // Utiliser axios pour envoyer le fichier et le nom de la table
      const response = await axios.post(`${config.apiUrl}/fournisseurs/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      console.log('Upload response:', response.data);
      setMessage(response.data.message || 'File uploaded successfully');
      setSeverity('success');
      
      // Réinitialiser le champ de fichier
      event.target.value = '';
      
    } catch (error) {
      console.error('Upload error:', error.response || error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.details || 
                         error.message || 
                         'Error uploading file';
      setMessage(errorMessage);
      setSeverity('error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearTable = async () => {
    if (!selectedTable) {
      setMessage('Aucune table sélectionnée');
      setSeverity('error');
      setOpenDialog(false);
      return;
    }

    try {
      setLoading(true);
      setMessage(`Suppression des données de la table ${selectedTable}...`);
      setSeverity('info');

      const response = await axios.post(`${config.apiUrl}/fournisseurs/truncate/${selectedTable}`);
      setMessage(response.data.message || `Table ${selectedTable} vidée avec succès`);
      setSeverity('success');
    } catch (error) {
      console.error('Clear error:', error.response || error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.details || 
                         error.message || 
                         'Erreur lors de la suppression des données';
      setMessage(errorMessage);
      setSeverity('error');
    } finally {
      setLoading(false);
      setOpenDialog(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" component="h2">
          Upload Excel File
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={createNewTable}
                onChange={handleCreateNewTableChange}
                name="createNewTable"
                color="primary"
                disabled={loading}
              />
            }
            label="Créer une nouvelle table"
            sx={{ alignSelf: 'flex-start', maxWidth: 400, width: '100%' }}
          />


          {createNewTable ? (
            <TextField
              fullWidth
              label="Nom de la nouvelle table"
              variant="outlined"
              value={newTableName}
              onChange={handleNewTableNameChange}
              helperText="Le nom doit commencer par 'fournisseurs' et ne contenir que des lettres, chiffres et underscores"
              sx={{ maxWidth: 400 }}
              disabled={loading}
            />
          ) : (
            <FormControl fullWidth sx={{ maxWidth: 400 }}>
              <InputLabel id="upload-table-select-label">Table cible</InputLabel>
              <Select
                labelId="upload-table-select-label"
                id="upload-table-select"
                value={selectedTable}
                label="Table cible"
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
          )}
          
          <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'center' }}>
            <Button
              variant="contained"
              component="label"
              startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <CloudUploadIcon />}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Choose File'}
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
            </Button>
            
            {selectedFile && !selectedTable && !createNewTable && (
              <Alert severity="info" sx={{ mt: 2, width: '100%', maxWidth: 400 }}>
                Aucune table sélectionnée. Une nouvelle table <strong>{autoTableName}</strong> sera automatiquement créée à partir du nom du fichier.
              </Alert>
            )}

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setOpenDialog(true)}
              disabled={loading}
            >
              Clear Table
            </Button>
          </Box>
        </Box>

        {message && (
          <Alert severity={severity} sx={{ width: '100%' }}>
            {message}
          </Alert>
        )}
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Confirm Clear Table</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={createNewTable}
                  onChange={handleCreateNewTableChange}
                  name="createNewTable"
                  color="primary"
                />
              }
              label="Créer une nouvelle table"
              sx={{ mb: 2 }}
            />

            {createNewTable ? (
              <TextField
                fullWidth
                label="Nom de la nouvelle table"
                variant="outlined"
                value={newTableName}
                onChange={handleNewTableNameChange}
                helperText="Le nom doit commencer par 'fournisseurs' et ne contenir que des lettres, chiffres et underscores"
                sx={{ mb: 2 }}
              />
            ) : (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="table-select-label">Table</InputLabel>
                <Select
                  labelId="table-select-label"
                  id="table-select"
                  value={selectedTable}
                  label="Table"
                  onChange={handleTableChange}
                  disabled={loadingTables}
                >
                  {tables.map((table) => (
                    <MenuItem key={table} value={table}>
                      {table}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              Attention : Cette action supprimera toutes les données de la table sélectionnée et ne peut pas être annulée.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleClearTable} color="error" disabled={loading || !selectedTable}>
            {loading ? <CircularProgress size={24} /> : 'Clear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UploadFile;
