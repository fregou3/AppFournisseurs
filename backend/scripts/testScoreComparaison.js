const { calculEvaluationPremierNiveau } = require('./calculEvaluationPremierNiveau');

// Fonction pour afficher les résultats du test
function afficherResultat(cas, scoreCalcule, scoreAttendu) {
    const resultat = scoreCalcule === scoreAttendu ? 'SUCCÈS' : 'ÉCHEC';
    console.log(`Cas ${cas.numero}: ${resultat}`);
    console.log(`  Nature du tiers: ${cas.natureTiers}`);
    console.log(`  Localisation: ${cas.localisation}`);
    console.log(`  Région d'intervention: ${cas.regionIntervention}`);
    console.log(`  Pays d'intervention: ${cas.paysIntervention}`);
    console.log(`  Score calculé: ${scoreCalcule}`);
    console.log(`  Score attendu: ${scoreAttendu}`);
    console.log('');
}

// Définition des cas de test avec les scores attendus selon la macro de référence
const casTests = [
    // Cas 1: Exemple de base avec score faible
    {
        numero: 1,
        natureTiers: "Four. / Presta. - Maintenance informatique",
        localisation: "France",
        regionIntervention: "France - Siège",
        paysIntervention: "France",
        scoreAttendu: 2 // 1 (nature) + 1 (région)
    },
    
    // Cas 2: Exemple avec score moyen
    {
        numero: 2,
        natureTiers: "Four. / Presta. - Télécommunications",
        localisation: "France",
        regionIntervention: "Marchés internationaux - Europe",
        paysIntervention: "France",
        scoreAttendu: 4 // 3 (nature) + 1 (région)
    },
    
    // Cas 3: Exemple avec point supplémentaire pour localisation France
    {
        numero: 3,
        natureTiers: "Four. / Presta. - Télécommunications",
        localisation: "France",
        regionIntervention: "Marchés internationaux - APAC",
        paysIntervention: "Singapour",
        scoreAttendu: 7 // 3 (nature) + 3 (région) + 1 (point France avec APAC)
    },
    
    // Cas 4: Exemple avec score élevé
    {
        numero: 4,
        natureTiers: "Bénéficiaire d'actions de sponsoring / mécénat",
        localisation: "France",
        regionIntervention: "Marchés internationaux - Future Growth Markets",
        paysIntervention: "Suisse",
        scoreAttendu: 13 // 10 (nature) + 3 (région) + 0 (pas de point France car nature spécifique)
    },
    
    // Cas 5: Exemple avec nature du tiers à 5 points
    {
        numero: 5,
        natureTiers: "Four. / Presta. - Logistique",
        localisation: "France",
        regionIntervention: "Marchés internationaux - APAC",
        paysIntervention: "Chine",
        scoreAttendu: 9 // 5 (nature) + 3 (région) + 1 (point France avec APAC)
    },
    
    // Cas 6: Exemple avec région non standard
    {
        numero: 6,
        natureTiers: "Four. / Presta. - Maintenance informatique",
        localisation: "France",
        regionIntervention: "Autre région",
        paysIntervention: "France",
        scoreAttendu: 2 // 1 (nature) + 0 (région) + 1 (point France avec région non standard)
    },
    
    // Cas 7: Exemple avec localisation non France
    {
        numero: 7,
        natureTiers: "Four. / Presta. - Télécommunications",
        localisation: "Allemagne",
        regionIntervention: "Marchés internationaux - APAC",
        paysIntervention: "Japon",
        scoreAttendu: 6 // 3 (nature) + 3 (région) + 0 (pas de point France)
    }
];

// Exécution des tests
console.log('=== TESTS DE COMPARAISON DES SCORES ===');
console.log('Comparaison entre notre implémentation et la macro de référence');
console.log('');

let testsReussis = 0;
let testsEchoues = 0;

casTests.forEach(cas => {
    const scoreCalcule = calculEvaluationPremierNiveau(
        cas.natureTiers,
        cas.localisation,
        cas.regionIntervention,
        cas.paysIntervention
    );
    
    if (scoreCalcule === cas.scoreAttendu) {
        testsReussis++;
    } else {
        testsEchoues++;
    }
    
    afficherResultat(cas, scoreCalcule, cas.scoreAttendu);
});

console.log('=== RÉSUMÉ DES TESTS ===');
console.log(`Tests réussis: ${testsReussis}/${casTests.length}`);
console.log(`Tests échoués: ${testsEchoues}/${casTests.length}`);
console.log('');

if (testsEchoues === 0) {
    console.log('SUCCÈS: Tous les tests ont réussi! Notre implémentation est alignée avec la macro de référence.');
} else {
    console.log('ÉCHEC: Certains tests ont échoué. Des ajustements sont nécessaires pour aligner notre implémentation avec la macro de référence.');
}
