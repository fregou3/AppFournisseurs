const { calculEvaluationPremierNiveau } = require('./calculEvaluationPremierNiveau');

// Test cases
const testCases = [
    {
        natureTier: 'Client - Wholesalers',
        localisation: 'France',
        regionIntervention: 'France - Siège',
        paysIntervention: 'Europe',
        expectedScore: 11 // 10 (base) + 1 (max location score)
    },
    {
        natureTier: 'Four. / Presta. - Électricité et gaz',
        localisation: 'Russie',
        regionIntervention: 'Marchés internationaux - APAC',
        paysIntervention: 'Asie',
        expectedScore: 4 // 1 (base) + 3 (max location score)
    },
    {
        natureTier: 'Agents publics',
        localisation: 'Allemagne',
        regionIntervention: 'Marchés internationaux - Europe',
        paysIntervention: 'Europe',
        expectedScore: 6 // 5 (base) + 1 (max location score)
    },
    {
        natureTier: 'Four. / Presta. - Baux et loyers',
        localisation: 'Angola',
        regionIntervention: 'France - Siège',
        paysIntervention: 'Angola',
        expectedScore: 7 // 5 (base) + 2 (max location score: Angola=2)
    },
    {
        natureTier: 'Bénéficiaire d\'actions de sponsoring / mécénat',
        localisation: 'Iran',
        regionIntervention: 'France - Siège',
        paysIntervention: 'Comores',
        expectedScore: 12 // 10 (base) + 2 (max location score: Iran=2, Comores=2, France-Siège=1)
    }
];

// Run tests
testCases.forEach((test, index) => {
    const score = calculEvaluationPremierNiveau(
        test.natureTier,
        test.localisation,
        test.regionIntervention,
        test.paysIntervention
    );
    
    console.log(`Test ${index + 1}:`);
    console.log(`Input: ${JSON.stringify(test, null, 2)}`);
    console.log(`Expected Score: ${test.expectedScore}`);
    console.log(`Actual Score: ${score}`);
    console.log(`Result: ${score === test.expectedScore ? 'PASS' : 'FAIL'}`);
    console.log('-------------------');
});
