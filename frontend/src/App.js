import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Route pour le composant SimpleDataView */}
        <Route path="/simple-view" element={
          <PrivateLayout>
            <Container maxWidth={false} sx={{ padding: 2 }}>
              <SimpleDataView />
            </Container>
          </PrivateLayout>
        } />
        
        {/* Route pour le diagnostic de configuration */}
        <Route path="/debug" element={
          <PrivateLayout>
            <Container maxWidth={false} sx={{ padding: 2 }}>
              <ConfigDebug />
            </Container>
          </PrivateLayout>
        } />
        
        <Route
          path="/"
          element={
            <PrivateLayout>
              <Container maxWidth={false} sx={{ padding: 2 }}>
                <Home />
              </Container>
            </PrivateLayout>
          }
        />
        <Route
          path="/upload"
          element={
            <PrivateLayout>
              <Container maxWidth={false} sx={{ padding: 2 }}>
                <UploadFile />
              </Container>
            </PrivateLayout>
          }
        />
        <Route
          path="/groupings"
          element={
            <PrivateLayout>
              <Container maxWidth={false} sx={{ padding: 2 }}>
                <Groupings />
              </Container>
            </PrivateLayout>
          }
        />
        <Route
          path="/analyse"
          element={
            <PrivateLayout>
              <Container maxWidth={false} sx={{ padding: 2 }}>
                <Analyse />
              </Container>
            </PrivateLayout>
          }
        />
        <Route
          path="/evaluation2"
          element={
            <PrivateLayout>
              <Container maxWidth={false} sx={{ padding: 2 }}>
                <Evaluation2 />
              </Container>
            </PrivateLayout>
          }
        />
        <Route
          path="/compare"
          element={
            <PrivateLayout>
              <Container maxWidth={false} sx={{ padding: 2 }}>
                <Compare />
              </Container>
            </PrivateLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
