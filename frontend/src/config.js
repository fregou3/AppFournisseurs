// Détection de l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Configuration des URLs en fonction de l'environnement
const config = {
  // En développement local, on utilise l'URL directe du backend
  // En production, on utilise le chemin relatif qui sera géré par Nginx
  apiUrl: isProduction 
    ? (isLocalhost ? 'http://localhost:5005' : '/fournisseurs/api')
    : '/api',
  
  // Base URL pour les liens et redirections
  baseUrl: isProduction && !isLocalhost ? '/fournisseurs' : '',
  
  // Autres configurations spécifiques à l'environnement
  env: process.env.NODE_ENV || 'development'
};

console.log('Configuration chargée:', config);

export default config;
