/**
 * Script pour tester la pagination de la table fournisseurs_fournisseurs_v18
 */

const axios = require('axios');

async function testPagination() {
  try {
    console.log('Test de la pagination pour la table fournisseurs_fournisseurs_v18');
    
    // Tester la première page
    console.log('\nTest de la première page (1-50):');
    const response1 = await axios.get('http://127.0.0.1:5005/fournisseurs/table/fournisseurs_fournisseurs_v18?page=1&pageSize=50');
    
    console.log('Statut de la réponse:', response1.status);
    console.log('Nombre de lignes récupérées:', response1.data.data ? response1.data.data.length : 'N/A');
    console.log('Informations de pagination:', response1.data.pagination || 'N/A');
    
    // Tester la deuxième page
    console.log('\nTest de la deuxième page (51-100):');
    const response2 = await axios.get('http://127.0.0.1:5005/fournisseurs/table/fournisseurs_fournisseurs_v18?page=2&pageSize=50');
    
    console.log('Statut de la réponse:', response2.status);
    console.log('Nombre de lignes récupérées:', response2.data.data ? response2.data.data.length : 'N/A');
    console.log('Informations de pagination:', response2.data.pagination || 'N/A');
    
    // Tester une page au milieu
    console.log('\nTest d\'une page au milieu (501-550):');
    const response3 = await axios.get('http://127.0.0.1:5005/fournisseurs/table/fournisseurs_fournisseurs_v18?page=11&pageSize=50');
    
    console.log('Statut de la réponse:', response3.status);
    console.log('Nombre de lignes récupérées:', response3.data.data ? response3.data.data.length : 'N/A');
    console.log('Informations de pagination:', response3.data.pagination || 'N/A');
    
    // Tester la dernière page
    const lastPage = Math.ceil(6688 / 50);
    console.log(`\nTest de la dernière page (${lastPage}):`, );
    const response4 = await axios.get(`http://127.0.0.1:5005/fournisseurs/table/fournisseurs_fournisseurs_v18?page=${lastPage}&pageSize=50`);
    
    console.log('Statut de la réponse:', response4.status);
    console.log('Nombre de lignes récupérées:', response4.data.data ? response4.data.data.length : 'N/A');
    console.log('Informations de pagination:', response4.data.pagination || 'N/A');
    
    console.log('\nTest terminé avec succès!');
  } catch (error) {
    console.error('Erreur lors du test de pagination:', error.message);
    if (error.response) {
      console.error('Détails de la réponse:', error.response.data);
    }
  }
}

testPagination();
