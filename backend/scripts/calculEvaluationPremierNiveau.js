// Données de référence pour les natures de tiers
const natureTiersData = [
    { nature: 'Cible de croissance externe', requiresLocation: 'Yes', score: 10 },
    { nature: 'Client - Wholesalers', requiresLocation: 'Yes', score: 10 },
    { nature: 'Client - Retailers', requiresLocation: 'Yes', score: 5 },
    { nature: 'Client - Department stores', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Baux et loyers', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Communication et média', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Conseils (juridiques, stratégiques, etc.)', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Électricité et gaz', requiresLocation: 'Yes', score: 1 },
    { nature: 'Four. / Presta. - Equipement de sécurité', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Fourniture de matériel de promotion', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Fourniture de packaging', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Fourniture de matières premières', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Hébergement', requiresLocation: 'Yes', score: 1 },
    { nature: 'Four. / Presta. - Immobilier', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Influenceurs', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Installations et équipements techniques', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Intérimaires', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Logistique', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Maintenance des bâtiments', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Maintenance informatique', requiresLocation: 'Yes', score: 1 },
    { nature: 'Four. / Presta. - Matériel informatique', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Mobilier de bureau', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Nourriture et boissons', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Organismes de recherche', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Promotion de la marque', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Services de nettoyage', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Services de sécurité', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Services liés au e-commerce', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Sous-traitance production', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Télécommunications', requiresLocation: 'Yes', score: 3 },
    { nature: 'Four. / Presta. - Transport de marchandise et services liés', requiresLocation: 'Yes', score: 5 },
    { nature: 'Four. / Presta. - Transport de taxi et de personnel', requiresLocation: 'Yes', score: 3 },
    { nature: 'Bénéficiaire d\'actions de sponsoring / mécénat', requiresLocation: 'Yes', score: 10 },
    { nature: 'Auditeurs / Organismes certificateurs (secteur privé)', requiresLocation: 'Yes', score: 5 },
    { nature: 'Agents publics', requiresLocation: 'Yes', score: 5 }
];

// Données de référence pour les régions d'intervention
const regionInterventionData = {
    'France - Siège': 1,
    'Marchés internationaux - Europe': 1,
    'Marchés internationaux - Amerique du Nord': 1,
    'Marchés internationaux - APAC': 3,
    'Marchés internationaux - Future Growth Markets': 3,
    'Global Travel Retail': 3
};

// Fonction pour calculer le score d'évaluation de premier niveau
function calculEvaluationPremierNiveau(natureTier, localisation, regionIntervention, paysIntervention) {
    // Vérifier si tous les paramètres sont renseignés
    if (!natureTier || !localisation || !regionIntervention || !paysIntervention) {
        return null;
    }

    let score = 0;

    // 1. Points pour nature du tiers
    if (natureTier) {
        const natureTierLower = natureTier.toLowerCase();
        
        // Catégories à 10 points
        if (natureTierLower.includes('cible de croissance externe') ||
            natureTierLower.includes('wholesalers') ||
            natureTierLower.includes('bénéficiaire d\'actions de sponsoring')) {
            score += 10;
        }
        // Catégories à 5 points
        else if (natureTierLower.includes('retailers') ||
            natureTierLower.includes('department stores') ||
            natureTierLower.includes('baux et loyers') ||
            natureTierLower.includes('communication et média') ||
            natureTierLower.includes('conseils') ||
            natureTierLower.includes('fourniture de matériel de promotion') ||
            natureTierLower.includes('fourniture de packaging') ||
            natureTierLower.includes('fourniture de matières premières') ||
            natureTierLower.includes('immobilier') ||
            natureTierLower.includes('influenceurs') ||
            natureTierLower.includes('intérimaires') ||
            natureTierLower.includes('logistique') ||
            natureTierLower.includes('organismes de recherche') ||
            natureTierLower.includes('promotion de la marque') ||
            natureTierLower.includes('sous-traitance production') ||
            natureTierLower.includes('transport de marchandise') ||
            natureTierLower.includes('auditeurs') ||
            natureTierLower.includes('agents publics')) {
            score += 5;
        }
        // Catégories à 3 points
        else if (natureTierLower.includes('equipement de sécurité') ||
            natureTierLower.includes('installations et équipements techniques') ||
            natureTierLower.includes('maintenance des bâtiments') ||
            natureTierLower.includes('matériel informatique') ||
            natureTierLower.includes('mobilier de bureau') ||
            natureTierLower.includes('nourriture et boissons') ||
            natureTierLower.includes('services de nettoyage') ||
            natureTierLower.includes('services de sécurité') ||
            natureTierLower.includes('services liés au e-commerce') ||
            natureTierLower.includes('télécommunications') ||
            natureTierLower.includes('transport de taxi')) {
            score += 3;
        }
        // Catégories à 1 point
        else if (natureTierLower.includes('électricité et gaz') ||
            natureTierLower.includes('hébergement') ||
            natureTierLower.includes('maintenance informatique')) {
            score += 1;
        }
    }

    // 2. Points pour région d'intervention
    if (regionIntervention) {
        const regionInterventionLower = regionIntervention.toLowerCase();
        if (regionInterventionLower.includes('france - siège') ||
            regionInterventionLower.includes('europe') ||
            regionInterventionLower.includes('amerique du nord')) {
            score += 1;
        } else if (regionInterventionLower.includes('apac') ||
                   regionInterventionLower.includes('future growth markets') ||
                   regionInterventionLower.includes('global travel retail')) {
            score += 3;
            if (localisation.toLowerCase() === 'france') {
                // Ajouter le point France uniquement si la région n'est pas Europe/Amérique du Nord
                score += 1;
            }
        } else if (localisation.toLowerCase() === 'france') {
            // Ajouter le point France si pas de région spécifiée
            score += 1;
        }
    }

    return score;
}

module.exports = { calculEvaluationPremierNiveau };
