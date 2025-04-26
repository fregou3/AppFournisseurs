/**
 * Ce script remplace les appels API par des données fictives pour enrichir les visualisations.
 * À inclure dans le fichier index.js avant le rendu de l'application.
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import mockSuppliers from './components/mock-suppliers.json';

// Créer un adaptateur mock pour axios
const mock = new MockAdapter(axios);

// Intercepter les appels à l'API /fournisseurs
mock.onGet(/\/fournisseurs$/).reply(200, {
  data: mockSuppliers,
  total: mockSuppliers.length,
  page: 1,
  pageSize: mockSuppliers.length
});

// Laisser passer les autres requêtes
mock.onAny().passThrough();

console.log('API remplacée par des données fictives pour enrichir les visualisations');
