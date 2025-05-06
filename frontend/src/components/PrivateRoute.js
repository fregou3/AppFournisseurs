import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import config from '../config';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const hostname = window.location.hostname;
  const fullUrl = window.location.href;
  
  // Ajouter un log pour déboguer
  useEffect(() => {
    console.log('%c=== DÉBOGAGE AUTHENTIFICATION ===', 'background: #f00; color: #fff; font-size: 16px; padding: 5px;');
    console.log('URL complète:', fullUrl);
    console.log('Hostname détecté:', hostname);
    console.log('isAuthenticated:', localStorage.getItem('isAuthenticated'));
    console.log('lastLoginTime:', localStorage.getItem('lastLoginTime'));
  }, [fullUrl, hostname]);
  
  // Vérifier si nous sommes sur un environnement de production
  const isProductionEnvironment = (
    hostname === 'supplier-prd.communify.solutions' || 
    hostname === 'app2.communify.solutions'
  );
  
  console.log('Est-ce un environnement de production?', isProductionEnvironment);
  
  // En environnement de développement, désactiver l'authentification
  if (!isProductionEnvironment) {
    console.log('%cEnvironnement de développement détecté, authentification désactivée', 'color: green; font-weight: bold;');
    return children || <Navigate to="/login" state={{ from: location }} />;
  }
  
  // En environnement de production, activer l'authentification
  console.log('%cEnvironnement de production détecté, authentification activée', 'color: red; font-weight: bold;');
  
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const lastLoginTime = localStorage.getItem('lastLoginTime');

  console.log('Vérification de l\'authentification:', isAuthenticated);
  console.log('Dernière connexion:', lastLoginTime);

  // Vérifier si la session a expiré (3 heures)
  if (lastLoginTime) {
    const loginTime = new Date(lastLoginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    console.log('Heures écoulées depuis la dernière connexion:', hoursDiff);
    
    if (hoursDiff > 3) {
      console.log('%cSession expirée, redirection vers la page de login', 'color: red; font-weight: bold;');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastLoginTime');
      
      // Utiliser React Router pour la redirection
      console.log('Session expirée, redirection vers la page de login');
      console.log('baseUrl de la configuration:', config.baseUrl);
      
      // Supprimer les informations d'authentification
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('lastLoginTime');
      
      // Afficher une alerte
      alert('Votre session a expiré. Vous allez être redirigé vers la page de connexion.');
      
      // Rediriger vers la page de login en utilisant le baseUrl de la configuration
      window.location.href = `${config.baseUrl}/login`;
      return null;
    }
  }

  if (!isAuthenticated) {
    console.log('%cUtilisateur non authentifié, redirection vers la page de login', 'color: red; font-weight: bold;');
    
    // Afficher une alerte
    alert('Authentification requise. Vous allez être redirigé vers la page de connexion.');
    
    // Rediriger vers la page de login en utilisant le baseUrl de la configuration
    console.log('Redirection vers:', `${config.baseUrl}/login`);
    window.location.href = `${config.baseUrl}/login`;
    return null;
  }

  console.log('%cUtilisateur authentifié, accès autorisé', 'color: green; font-weight: bold;');
  return children || <Navigate to="/login" state={{ from: location }} />;
};

export default PrivateRoute;
