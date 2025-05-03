// Détection de l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Détecter si nous sommes en environnement de développement local Windows
const isWindowsDev = isLocalhost && navigator.userAgent.indexOf('Windows') !== -1;

// Configuration des URLs en fonction de l'environnement
const config = {
  // Configuration de l'URL de l'API en fonction de l'environnement :
  // - En développement local Windows : utiliser le proxy configuré dans setupProxy.js
  // - En développement local Linux : utiliser l'URL directe du backend
  // - En production : utiliser le chemin relatif géré par Nginx
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
