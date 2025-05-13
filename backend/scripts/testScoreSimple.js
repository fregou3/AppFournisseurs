const { calculEvaluationPremierNiveau } = require('./calculEvaluationPremierNiveau');

// Cas de test 1: Score faible
const cas1 = {
    natureTiers: "Four. / Presta. - Maintenance informatique",
    localisation: "France",
    regionIntervention: "France - Siège",
    paysIntervention: "France"
};

// Cas de test 2: Score moyen
const cas2 = {
    natureTiers: "Four. / Presta. - Télécommunications",
    localisation: "France",
    regionIntervention: "Marchés internationaux - Europe",
    paysIntervention: "France"
};

// Cas de test 3: Score avec point supplémentaire pour localisation France
const cas3 = {
    natureTiers: "Four. / Presta. - Télécommunications",
    localisation: "France",
    regionIntervention: "Marchés internationaux - APAC",
    paysIntervention: "Singapour"
};

// Cas de test 4: Score élevé sans point supplémentaire pour localisation France
const cas4 = {
    natureTiers: "Bénéficiaire d'actions de sponsoring / mécénat",
    localisation: "France",
    regionIntervention: "Marchés internationaux - Future Growth Markets",
    paysIntervention: "Suisse"
};

// Cas de test 5: Score avec nature du tiers à 5 points
const cas5 = {
    natureTiers: "Four. / Presta. - Logistique",
    localisation: "France",
    regionIntervention: "Marchés internationaux - APAC",
    paysIntervention: "Chine"
};

// Cas de test 6: Score avec région non standard
const cas6 = {
    natureTiers: "Four. / Presta. - Maintenance informatique",
    localisation: "France",
    regionIntervention: "Autre région",
    paysIntervention: "France"
};

// Cas de test 7: Score avec localisation non France
const cas7 = {
    natureTiers: "Four. / Presta. - Télécommunications",
    localisation: "Allemagne",
    regionIntervention: "Marchés internationaux - APAC",
    paysIntervention: "Japon"
};

// Exécution des tests
console.log('=== TESTS DE CALCUL DE SCORE ===');

// Test cas 1
const score1 = calculEvaluationPremierNiveau(
    cas1.natureTiers,
    cas1.localisation,
    cas1.regionIntervention,
    cas1.paysIntervention
);
console.log('Cas 1: Score calculé =', score1);
console.log('  Nature du tiers:', cas1.natureTiers);
console.log('  Localisation:', cas1.localisation);
console.log('  Région d\'intervention:', cas1.regionIntervention);
console.log('  Pays d\'intervention:', cas1.paysIntervention);
console.log('  Score attendu selon la macro de référence: 2');
console.log('');

// Test cas 2
const score2 = calculEvaluationPremierNiveau(
    cas2.natureTiers,
    cas2.localisation,
    cas2.regionIntervention,
    cas2.paysIntervention
);
console.log('Cas 2: Score calculé =', score2);
console.log('  Nature du tiers:', cas2.natureTiers);
console.log('  Localisation:', cas2.localisation);
console.log('  Région d\'intervention:', cas2.regionIntervention);
console.log('  Pays d\'intervention:', cas2.paysIntervention);
console.log('  Score attendu selon la macro de référence: 4');
console.log('');

// Test cas 3
const score3 = calculEvaluationPremierNiveau(
    cas3.natureTiers,
    cas3.localisation,
    cas3.regionIntervention,
    cas3.paysIntervention
);
console.log('Cas 3: Score calculé =', score3);
console.log('  Nature du tiers:', cas3.natureTiers);
console.log('  Localisation:', cas3.localisation);
console.log('  Région d\'intervention:', cas3.regionIntervention);
console.log('  Pays d\'intervention:', cas3.paysIntervention);
console.log('  Score attendu selon la macro de référence: 7');
console.log('');

// Test cas 4
const score4 = calculEvaluationPremierNiveau(
    cas4.natureTiers,
    cas4.localisation,
    cas4.regionIntervention,
    cas4.paysIntervention
);
console.log('Cas 4: Score calculé =', score4);
console.log('  Nature du tiers:', cas4.natureTiers);
console.log('  Localisation:', cas4.localisation);
console.log('  Région d\'intervention:', cas4.regionIntervention);
console.log('  Pays d\'intervention:', cas4.paysIntervention);
console.log('  Score attendu selon la macro de référence: 13');
console.log('');

// Test cas 5
const score5 = calculEvaluationPremierNiveau(
    cas5.natureTiers,
    cas5.localisation,
    cas5.regionIntervention,
    cas5.paysIntervention
);
console.log('Cas 5: Score calculé =', score5);
console.log('  Nature du tiers:', cas5.natureTiers);
console.log('  Localisation:', cas5.localisation);
console.log('  Région d\'intervention:', cas5.regionIntervention);
console.log('  Pays d\'intervention:', cas5.paysIntervention);
console.log('  Score attendu selon la macro de référence: 9');
console.log('');

// Test cas 6
const score6 = calculEvaluationPremierNiveau(
    cas6.natureTiers,
    cas6.localisation,
    cas6.regionIntervention,
    cas6.paysIntervention
);
console.log('Cas 6: Score calculé =', score6);
console.log('  Nature du tiers:', cas6.natureTiers);
console.log('  Localisation:', cas6.localisation);
console.log('  Région d\'intervention:', cas6.regionIntervention);
console.log('  Pays d\'intervention:', cas6.paysIntervention);
console.log('  Score attendu selon la macro de référence: 2');
console.log('');

// Test cas 7
const score7 = calculEvaluationPremierNiveau(
    cas7.natureTiers,
    cas7.localisation,
    cas7.regionIntervention,
    cas7.paysIntervention
);
console.log('Cas 7: Score calculé =', score7);
console.log('  Nature du tiers:', cas7.natureTiers);
console.log('  Localisation:', cas7.localisation);
console.log('  Région d\'intervention:', cas7.regionIntervention);
console.log('  Pays d\'intervention:', cas7.paysIntervention);
console.log('  Score attendu selon la macro de référence: 6');
console.log('');
