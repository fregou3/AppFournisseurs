const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3001/api/test-group';

// Données de test
const testData = {
  name: 'test_group_debug',
  filters: {
    organization_2: ['APAC'],
    // Test avec une colonne qui pourrait ne pas exister
    // evaluated___not_evaluated: ['Yes']  // Notez les 3 underscores
  },
  visibleColumns: [
    'id', 'supplier_id', 'procurement_orga', 'partners', 
    'evaluated_not_evaluated', // Notez les 2 underscores (correct)
    'ecovadis_name', 'ecovadis_score', 'date', 
    'organization_1', 'organization_2', 'score'
    // Test avec une colonne qui pourrait ne pas exister
    // 'notation_esg'
  ]
};

// Fonction pour tester la création de groupe
async function testGroupCreation() {
  console.log('Envoi de la requête de test avec les données suivantes:');
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    const response = await axios.post(API_URL, testData);
    console.log('Réponse réussie:', response.data);
  } catch (error) {
    console.error('Erreur lors de la requête:');
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'état
      // qui ne fait pas partie de la plage 2xx
      console.error('Statut:', error.response.status);
      console.error('Données:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('Pas de réponse reçue:', error.request);
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('Erreur:', error.message);
    }
  }
}

// Exécuter le test
testGroupCreation();
