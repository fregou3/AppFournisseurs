import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import config from '../config';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Vérifier si nous sommes sur un environnement de production
  useEffect(() => {
    // Vérifier si nous sommes déjà authentifiés
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    
    console.log('=== VÉRIFICATION AUTHENTIFICATION LOGIN.JS ===');
    console.log('Hostname:', config.hostname);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('lastLoginTime:', lastLoginTime);
    
    // Si nous sommes déjà authentifiés, rediriger vers la page d'accueil
    if (isAuthenticated && lastLoginTime) {
      // Vérifier si la session a expiré (3 heures)
      const loginTime = new Date(lastLoginTime);
      const now = new Date();
      const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
      
      console.log('Heures écoulées depuis la dernière connexion:', hoursDiff);
      
      if (hoursDiff <= 3) {
        console.log('Session valide, redirection vers la page d\'accueil');
        navigate('/');
      } else {
        console.log('Session expirée, suppression des informations d\'authentification');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('lastLoginTime');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (username === 'AppFournisseurs@clarins.com' && password === 'App2025Clarins') {
      // Stocker l'état d'authentification
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      
      const from = location.state?.from?.pathname || '/';
      navigate(from);
    } else {
      setError('Identifiants invalides');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 2
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h5">
              Connexion
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Email"
              name="username"
              autoComplete="email"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Se connecter
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
