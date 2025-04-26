/**
 * Script pour enrichir les visualisations dans l'application
 * en remplaçant les fonctions d'API par des versions qui retournent des données fictives.
 */

// Créer un fichier de données fictives pour les visualisations
const fs = require('fs');
const path = require('path');

// Données fictives pour les fournisseurs
const mockSuppliers = Array(500).fill(0).map((_, i) => ({
  id: 10000 + i,
  'PARTNERS GROUP': `Supplier ${10000 + i}`,
  'ORGANIZATION ZONE': ['EUROPE', 'NORTH AMERICA', 'ASIA', 'SOUTH AMERICA', 'AFRICA', 'MIDDLE EAST', 'OCEANIA'][Math.floor(Math.random() * 7)],
  'ORGANIZATION 1': ['WESTERN EUROPE', 'EASTERN EUROPE', 'USA', 'CANADA', 'EAST ASIA', 'SOUTH ASIA', 'BRAZIL', 'ARGENTINA', 'SOUTH AFRICA', 'UAE', 'AUSTRALIA'][Math.floor(Math.random() * 11)],
  'ORGANIZATION COUNTRY': ['FRANCE', 'GERMANY', 'UNITED KINGDOM', 'ITALY', 'SPAIN', 'UNITED STATES', 'CANADA', 'CHINA', 'JAPAN', 'INDIA', 'BRAZIL', 'ARGENTINA', 'SOUTH AFRICA', 'UNITED ARAB EMIRATES', 'AUSTRALIA'][Math.floor(Math.random() * 15)],
  'Country of Supplier Contact': ['PARIS', 'BERLIN', 'LONDON', 'ROME', 'MADRID', 'NEW YORK', 'TORONTO', 'SHANGHAI', 'TOKYO', 'MUMBAI', 'SAO PAULO', 'BUENOS AIRES', 'JOHANNESBURG', 'DUBAI', 'SYDNEY'][Math.floor(Math.random() * 15)],
  'Activity Area': [
    'Four. / Presta. - Logistique',
    'Four. / Presta. - Matériel informatique',
    'Four. / Presta. - Sous-traitance production',
    'Four. / Presta. - Communication et média',
    'Four. / Presta. - Transport de marchandise et services liés',
    'Four. / Presta. - Fourniture de matières premières',
    'Four. / Presta. - Immobilier',
    'Four. / Presta. - Conseils (juridiques, stratégiques, etc.)',
    'Four. / Presta. - Fourniture de packaging',
    'Four. / Presta. - Promotion de la marque'
  ][Math.floor(Math.random() * 10)],
  score: Math.floor(Math.random() * 10) + 1
}));

// Créer le fichier de données fictives
const mockDataPath = path.join(__dirname, 'mock-suppliers.json');
fs.writeFileSync(mockDataPath, JSON.stringify(mockSuppliers, null, 2));
console.log(`Fichier de données fictives créé: ${mockDataPath}`);

// Créer un script pour remplacer l'API par des données fictives
const apiReplacerPath = path.join(__dirname, '..', 'api-replacer.js');
const apiReplacerContent = `/**
 * Ce script remplace les appels API par des données fictives pour enrichir les visualisations.
 * À inclure dans le fichier index.js avant le rendu de l'application.
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import mockSuppliers from './components/mock-suppliers.json';

// Créer un adaptateur mock pour axios
const mock = new MockAdapter(axios);

// Intercepter les appels à l'API /fournisseurs
mock.onGet(/\\/fournisseurs$/).reply(200, {
  data: mockSuppliers,
  total: mockSuppliers.length,
  page: 1,
  pageSize: mockSuppliers.length
});

// Laisser passer les autres requêtes
mock.onAny().passThrough();

console.log('API remplacée par des données fictives pour enrichir les visualisations');
`;

fs.writeFileSync(apiReplacerPath, apiReplacerContent);
console.log(`Script de remplacement d'API créé: ${apiReplacerPath}`);

// Créer un script pour modifier le fichier index.js
const modifyIndexPath = path.join(__dirname, '..', 'modify-index.js');
const modifyIndexContent = `/**
 * Ce script modifie le fichier index.js pour inclure l'API replacer
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.js');
const backupPath = \`\${indexPath}.backup.\${Date.now()}\`;

// Lire le contenu du fichier
console.log(\`Lecture du fichier \${indexPath}...\`);
const content = fs.readFileSync(indexPath, 'utf8');

// Créer une sauvegarde
fs.writeFileSync(backupPath, content);
console.log(\`Sauvegarde créée: \${backupPath}\`);

// Ajouter l'import de l'API replacer
const modifiedContent = content.replace(
  /import App from ['"]\.\/App['"];/,
  \`import App from './App';\\nimport './api-replacer'; // Enrichissement des visualisations avec des données fictives\`
);

// Écrire le contenu modifié
fs.writeFileSync(indexPath, modifiedContent);
console.log(\`Fichier \${indexPath} modifié avec succès\`);

console.log(\`
=== INSTRUCTIONS POUR FINALISER ===
1. Installez axios-mock-adapter avec la commande:
   npm install axios-mock-adapter --save-dev

2. Redémarrez le serveur frontend pour appliquer les modifications:
   npm start

3. Les visualisations seront maintenant enrichies avec des données fictives
   sans modifier les tables existantes dans la base de données.

4. Si vous souhaitez revenir à la version originale, vous pouvez restaurer la sauvegarde avec:
   cp "\${backupPath}" "\${indexPath}"
\`);
`;

fs.writeFileSync(modifyIndexPath, modifyIndexContent);
console.log(`Script de modification d'index.js créé: ${modifyIndexPath}`);

console.log(`
=== INSTRUCTIONS POUR ENRICHIR LES VISUALISATIONS ===
1. Installez axios-mock-adapter avec la commande:
   npm install axios-mock-adapter --save-dev

2. Exécutez le script de modification d'index.js:
   node src/modify-index.js

3. Redémarrez le serveur frontend:
   npm start

Les visualisations seront maintenant enrichies avec des données fictives
sans modifier les tables existantes dans la base de données.
`);
