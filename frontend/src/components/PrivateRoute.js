import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  
  // Désactiver temporairement l'authentification pour le développement
  return children || <Navigate to="/login" state={{ from: location }} />;

  // Code d'authentification normal
  /*
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const lastLoginTime = localStorage.getItem('lastLoginTime');

  // Vérifier si la session a expiré (3 heures)
  if (lastLoginTime) {
    const loginTime = new Date(lastLoginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 3) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastLoginTime');
      return <Navigate to="/login" state={{ from: location }} />;
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return children || <Navigate to="/login" state={{ from: location }} />;
  */
};

export default PrivateRoute;
