// Détection de l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isDevServer = window.location.hostname === 'app2.communify.solutions';

// Détecter si nous sommes en environnement de développement local Windows
const isWindowsDev = isLocalhost && navigator.userAgent.indexOf('Windows') !== -1;

// Afficher des informations de débogage
console.log('Environnement de détection:');
console.log('- process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('- isProduction:', isProduction);
console.log('- isLocalhost:', isLocalhost);
console.log('- isDevServer:', isDevServer);
console.log('- window.location.hostname:', window.location.hostname);
console.log('- window.location.origin:', window.location.origin);

// Configuration des URLs en fonction de l'environnement
const config = {
  // Configuration de l'URL de l'API en fonction de l'environnement :
  // - En développement local Windows : utiliser le proxy configuré dans setupProxy.js
  // - En développement local Linux : utiliser l'URL directe du backend
  // - En production ou sur le serveur de développement : utiliser le chemin relatif géré par Nginx
  apiUrl: isProduction || isDevServer
    ? (isLocalhost ? 'http://localhost:5005' : '/fournisseurs/api')
    : '/api',
  
  // Base URL pour les liens et redirections
  baseUrl: (isProduction || isDevServer) && !isLocalhost ? '/fournisseurs' : '',
  
  // Autres configurations spécifiques à l'environnement
  env: process.env.NODE_ENV || 'development',
  
  // Informations sur l'hôte pour le débogage
  hostname: window.location.hostname,
  origin: window.location.origin
};

console.log('Configuration chargée:', config);

export default config;
