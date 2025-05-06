import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Home from './components/Home';
import UploadFile from './components/UploadFile';
import Groupings from './components/Groupings';
import Header from './components/Header';
import Analyse from './components/Analyse';
import Evaluation2 from './components/Evaluation2';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Compare from './components/Compare';
import SimpleDataView from './components/SimpleDataView';
import ConfigDebug from './components/ConfigDebug';
import config from './config';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth={false} sx={{ padding: 2 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

function App() {
  const location = useLocation();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  // Vérifier l'authentification au chargement de l'application
  useEffect(() => {
    // Vérifier si nous sommes sur un environnement de production
    const isProductionServer = config.hostname === 'supplier-prd.communify.solutions' || 
                              config.hostname === 'app2.communify.solutions';
    
    console.log('=== VÉRIFICATION AUTHENTIFICATION APP.JS ===');
    console.log('Hostname:', config.hostname);
    console.log('Est-ce un serveur de production?', isProductionServer);
    console.log('Path actuel:', location.pathname);
    console.log('isAuthenticated:', localStorage.getItem('isAuthenticated'));
    
    // Si nous sommes sur un environnement de production et que ce n'est pas la page de login
    if (isProductionServer && !location.pathname.includes('/login')) {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      
      console.log('Vérification de l\'authentification:', isAuthenticated);
      console.log('Dernière connexion:', lastLoginTime);
      
      // Vérifier si la session a expiré (3 heures)
      let sessionExpired = false;
      if (lastLoginTime) {
        const loginTime = new Date(lastLoginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        console.log('Heures écoulées depuis la dernière connexion:', hoursDiff);
        sessionExpired = hoursDiff > 3;
      }
      
      // Si l'utilisateur n'est pas authentifié ou si la session a expiré
      if (!isAuthenticated || sessionExpired) {
        console.log('Utilisateur non authentifié ou session expirée, redirection vers la page de login');
        
        // Supprimer les informations d'authentification
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('lastLoginTime');
        
        // Rediriger vers la page de login
        window.location.href = `${config.baseUrl}/login`;
        return;
      }
    }
    
    setIsAuthChecked(true);
  }, [location]);
  
  // Attendre que la vérification d'authentification soit terminée
  if (!isAuthChecked && location.pathname !== '/login') {
    return <div>Vérification de l'authentification...</div>;
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Route de login */}
        <Route path="/login" element={<Login />} />
        
        {/* Route pour le composant SimpleDataView */}
        <Route path="/simple-view" element={
          <PrivateRoute>
            <PrivateLayout>
              <Container maxWidth={false} sx={{ padding: 2 }}>
                <SimpleDataView />
              </Container>
            </PrivateLayout>
          </PrivateRoute>
        } />
        
        {/* Route pour le diagnostic de configuration */}
        <Route path="/debug" element={
          <PrivateRoute>
            <PrivateLayout>
              <Container maxWidth={false} sx={{ padding: 2 }}>
                <ConfigDebug />
              </Container>
            </PrivateLayout>
          </PrivateRoute>
        } />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <Container maxWidth={false} sx={{ padding: 2 }}>
                  <Home />
                </Container>
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <Container maxWidth={false} sx={{ padding: 2 }}>
                  <UploadFile />
                </Container>
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/groupings"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <Container maxWidth={false} sx={{ padding: 2 }}>
                  <Groupings />
                </Container>
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/analyse"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <Container maxWidth={false} sx={{ padding: 2 }}>
                  <Analyse />
                </Container>
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/evaluation2"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <Container maxWidth={false} sx={{ padding: 2 }}>
                  <Evaluation2 />
                </Container>
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/compare"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <Container maxWidth={false} sx={{ padding: 2 }}>
                  <Compare />
                </Container>
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
