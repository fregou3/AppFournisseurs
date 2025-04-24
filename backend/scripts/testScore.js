const { calculEvaluationPremierNiveau } = require('./calculEvaluationPremierNiveau');

// Valeurs de test
const natureTier = 'Four. / Presta. - Conseils (juridiques, stratégiques, etc.)';
const localisation = 'France';
const regionIntervention = 'Marchés internationaux - Europe';
const paysIntervention = 'France';

// Calculer le score
const score = calculEvaluationPremierNiveau(natureTier, localisation, regionIntervention, paysIntervention);

// Afficher les résultats
console.log('Paramètres d\'entrée :');
console.log('Nature du tiers:', natureTier);
console.log('Localisation:', localisation);
console.log('Région d\'intervention:', regionIntervention);
console.log('Pays d\'intervention:', paysIntervention);
console.log('\nScore calculé:', score);
