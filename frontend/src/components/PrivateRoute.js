import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const hostname = window.location.hostname;
  
  // Vérifier si nous sommes sur un environnement de production
  const isProductionEnvironment = (
    hostname === 'supplier-prd.communify.solutions' || 
    hostname === 'app2.communify.solutions'
  );
  
  // En environnement de développement, désactiver l'authentification
  if (!isProductionEnvironment) {
    console.log('Environnement de développement détecté, authentification désactivée');
    return children || <Navigate to="/login" state={{ from: location }} />;
  }
  
  // En environnement de production, activer l'authentification
  console.log('Environnement de production détecté, authentification activée');
  
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const lastLoginTime = localStorage.getItem('lastLoginTime');

  // Vérifier si la session a expiré (3 heures)
  if (lastLoginTime) {
    const loginTime = new Date(lastLoginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 3) {
      console.log('Session expirée, redirection vers la page de login');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastLoginTime');
      
      // Construire l'URL de redirection en fonction du domaine
      const loginUrl = `https://${hostname}/fournisseurs/login`;
      
      // Rediriger vers la page de login
      window.location.href = loginUrl;
      return null;
    }
  }

  if (!isAuthenticated) {
    console.log('Utilisateur non authentifié, redirection vers la page de login');
    
    // Construire l'URL de redirection en fonction du domaine
    const loginUrl = `https://${hostname}/fournisseurs/login`;
    
    // Rediriger vers la page de login
    window.location.href = loginUrl;
    return null;
  }

  return children || <Navigate to="/login" state={{ from: location }} />;
};

export default PrivateRoute;
