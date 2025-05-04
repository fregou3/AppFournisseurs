import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, TextField, Alert } from '@mui/material';
import axios from 'axios';
import config from '../config';

const ConfigDebug = () => {
  const [apiStatus, setApiStatus] = useState('Non testé');
  const [apiResponse, setApiResponse] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [testResults, setTestResults] = useState([]);

  // Informations sur l'environnement
  const envInfo = {
    nodeEnv: process.env.NODE_ENV || 'non défini',
    hostname: window.location.hostname,
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    userAgent: navigator.userAgent,
    apiUrl: config.apiUrl,
    baseUrl: config.baseUrl,
    fullConfig: JSON.stringify(config, null, 2)
  };

  const testEndpoints = [
    { name: 'Liste des tables', url: `${config.apiUrl}/fournisseurs/tables` },
    { name: 'Table par défaut', url: `${config.apiUrl}/settings/default-table` },
    { name: 'Statut du serveur', url: `${config.apiUrl}/status` }
  ];

  const testApi = async (endpoint) => {
    try {
      setApiStatus('Test en cours...');
      const response = await axios.get(endpoint.url);
      
      const result = {
        name: endpoint.name,
        url: endpoint.url,
        status: 'Succès',
        statusCode: response.status,
        data: JSON.stringify(response.data, null, 2).substring(0, 500) + (JSON.stringify(response.data, null, 2).length > 500 ? '...' : '')
      };
      
      setTestResults(prev => [...prev, result]);
      setApiStatus('Test réussi');
      setApiResponse(response.data);
    } catch (error) {
      console.error('Erreur lors du test de l\'API:', error);
      
      const result = {
        name: endpoint.name,
        url: endpoint.url,
        status: 'Échec',
        statusCode: error.response?.status || 'N/A',
        error: error.message,
        details: error.response?.data ? JSON.stringify(error.response.data) : 'Pas de détails disponibles'
      };
      
      setTestResults(prev => [...prev, result]);
      setApiStatus('Test échoué');
      setApiResponse(null);
    }
  };

  const testCustomUrl = async () => {
    if (!customUrl) return;
    
    try {
      setApiStatus('Test en cours...');
      const response = await axios.get(customUrl);
      
      const result = {
        name: 'URL personnalisée',
        url: customUrl,
        status: 'Succès',
        statusCode: response.status,
        data: JSON.stringify(response.data, null, 2).substring(0, 500) + (JSON.stringify(response.data, null, 2).length > 500 ? '...' : '')
      };
      
      setTestResults(prev => [...prev, result]);
      setApiStatus('Test réussi');
      setApiResponse(response.data);
    } catch (error) {
      console.error('Erreur lors du test de l\'URL personnalisée:', error);
      
      const result = {
        name: 'URL personnalisée',
        url: customUrl,
        status: 'Échec',
        statusCode: error.response?.status || 'N/A',
        error: error.message,
        details: error.response?.data ? JSON.stringify(error.response.data) : 'Pas de détails disponibles'
      };
      
      setTestResults(prev => [...prev, result]);
      setApiStatus('Test échoué');
      setApiResponse(null);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setApiStatus('Non testé');
    setApiResponse(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Diagnostic de Configuration
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informations sur l'environnement
        </Typography>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {`NODE_ENV: ${envInfo.nodeEnv}
Hostname: ${envInfo.hostname}
Est localhost: ${envInfo.isLocalhost}
User Agent: ${envInfo.userAgent}
API URL: ${envInfo.apiUrl}
Base URL: ${envInfo.baseUrl}
Configuration complète: ${envInfo.fullConfig}`}
        </pre>
      </Paper>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test des endpoints API
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          {testEndpoints.map((endpoint, index) => (
            <Button 
              key={index}
              variant="contained" 
              sx={{ mr: 1, mb: 1 }}
              onClick={() => testApi(endpoint)}
            >
              Tester {endpoint.name}
            </Button>
          ))}
          <Button 
            variant="outlined" 
            color="secondary" 
            sx={{ mb: 1 }}
            onClick={clearResults}
          >
            Effacer les résultats
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            label="URL personnalisée"
            variant="outlined"
            fullWidth
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            sx={{ mr: 1 }}
          />
          <Button 
            variant="contained" 
            onClick={testCustomUrl}
            disabled={!customUrl}
          >
            Tester
          </Button>
        </Box>
      </Paper>
      
      {testResults.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Résultats des tests
          </Typography>
          
          {testResults.map((result, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>{result.name}</strong> - {result.url}
              </Typography>
              
              <Alert severity={result.status === 'Succès' ? 'success' : 'error'} sx={{ mb: 1 }}>
                {result.status} {result.statusCode && `(${result.statusCode})`}
              </Alert>
              
              {result.status === 'Succès' ? (
                <Box>
                  <Typography variant="subtitle2">Réponse:</Typography>
                  <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                    {result.data}
                  </pre>
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle2">Erreur:</Typography>
                  <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                    {result.error}
                    {result.details && `\n\nDétails: ${result.details}`}
                  </pre>
                </Box>
              )}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default ConfigDebug;
