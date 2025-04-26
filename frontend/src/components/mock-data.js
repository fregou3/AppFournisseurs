/**
 * Données fictives pour enrichir les graphiques et tableaux du rapport d'analyse
 * sans modifier les tables existantes dans la base de données.
 */

// Fournisseurs fictifs à haut risque
export const fictiveHighRiskSuppliers = [
  { nom: 'Global Logistics Partners', score: 7, zone: 'EUROPE', region: 'WESTERN EUROPE', pays: 'FRANCE', localisation: 'PARIS', natureTier: 'Four. / Presta. - Logistique' },
  { nom: 'Tech Solutions Inc.', score: 7, zone: 'NORTH AMERICA', region: 'USA', pays: 'UNITED STATES', localisation: 'NEW YORK', natureTier: 'Four. / Presta. - Matériel informatique' },
  { nom: 'Asian Manufacturing Ltd', score: 7, zone: 'ASIA', region: 'EAST ASIA', pays: 'CHINA', localisation: 'SHANGHAI', natureTier: 'Four. / Presta. - Sous-traitance production' },
  { nom: 'European Media Group', score: 7, zone: 'EUROPE', region: 'CENTRAL EUROPE', pays: 'GERMANY', localisation: 'BERLIN', natureTier: 'Four. / Presta. - Communication et média' },
  { nom: 'South American Distributors', score: 7, zone: 'SOUTH AMERICA', region: 'BRAZIL', pays: 'BRAZIL', localisation: 'SAO PAULO', natureTier: 'Four. / Presta. - Transport de marchandise et services liés' },
  { nom: 'African Resources Corp', score: 7, zone: 'AFRICA', region: 'SOUTH AFRICA', pays: 'SOUTH AFRICA', localisation: 'JOHANNESBURG', natureTier: 'Four. / Presta. - Fourniture de matières premières' },
  { nom: 'Middle East Trading Co', score: 7, zone: 'MIDDLE EAST', region: 'UAE', pays: 'UNITED ARAB EMIRATES', localisation: 'DUBAI', natureTier: 'Four. / Presta. - Immobilier' },
  { nom: 'Nordic Consulting Group', score: 7, zone: 'EUROPE', region: 'NORTHERN EUROPE', pays: 'SWEDEN', localisation: 'STOCKHOLM', natureTier: 'Four. / Presta. - Conseils (juridiques, stratégiques, etc.)' },
  { nom: 'Pacific Islands Suppliers', score: 7, zone: 'OCEANIA', region: 'AUSTRALIA', pays: 'AUSTRALIA', localisation: 'SYDNEY', natureTier: 'Four. / Presta. - Fourniture de packaging' },
  { nom: 'Eastern European Logistics', score: 7, zone: 'EUROPE', region: 'EASTERN EUROPE', pays: 'POLAND', localisation: 'WARSAW', natureTier: 'Four. / Presta. - Logistique' }
];

// Données fictives pour la distribution géographique
export const fictiveGeographicDistribution = [
  { zone: 'EUROPE', count: 2500, percentage: '35.7' },
  { zone: 'NORTH AMERICA', count: 1800, percentage: '25.7' },
  { zone: 'ASIA', count: 1500, percentage: '21.4' },
  { zone: 'SOUTH AMERICA', count: 450, percentage: '6.4' },
  { zone: 'AFRICA', count: 350, percentage: '5.0' },
  { zone: 'MIDDLE EAST', count: 280, percentage: '4.0' },
  { zone: 'OCEANIA', count: 120, percentage: '1.8' }
];

// Données fictives pour les statistiques géographiques
export const fictiveGeographicStats = [
  { 
    continent: 'EUROPE', 
    totalFournisseurs: 2500, 
    scoreMoyen: 4.8,
    pays: [
      { pays: 'FRANCE', count: 850 },
      { pays: 'GERMANY', count: 620 },
      { pays: 'UNITED KINGDOM', count: 480 },
      { pays: 'ITALY', count: 320 },
      { pays: 'SPAIN', count: 230 }
    ]
  },
  { 
    continent: 'NORTH AMERICA', 
    totalFournisseurs: 1800, 
    scoreMoyen: 5.2,
    pays: [
      { pays: 'UNITED STATES', count: 1200 },
      { pays: 'CANADA', count: 450 },
      { pays: 'MEXICO', count: 150 }
    ]
  },
  { 
    continent: 'ASIA', 
    totalFournisseurs: 1500, 
    scoreMoyen: 6.7,
    pays: [
      { pays: 'CHINA', count: 580 },
      { pays: 'JAPAN', count: 320 },
      { pays: 'INDIA', count: 250 },
      { pays: 'SOUTH KOREA', count: 180 },
      { pays: 'SINGAPORE', count: 170 }
    ]
  },
  { 
    continent: 'SOUTH AMERICA', 
    totalFournisseurs: 450, 
    scoreMoyen: 5.9,
    pays: [
      { pays: 'BRAZIL', count: 220 },
      { pays: 'ARGENTINA', count: 120 },
      { pays: 'COLOMBIA', count: 110 }
    ]
  },
  { 
    continent: 'AFRICA', 
    totalFournisseurs: 350, 
    scoreMoyen: 7.1,
    pays: [
      { pays: 'SOUTH AFRICA', count: 150 },
      { pays: 'MOROCCO', count: 80 },
      { pays: 'EGYPT', count: 70 },
      { pays: 'NIGERIA', count: 50 }
    ]
  },
  { 
    continent: 'MIDDLE EAST', 
    totalFournisseurs: 280, 
    scoreMoyen: 6.4,
    pays: [
      { pays: 'UNITED ARAB EMIRATES', count: 120 },
      { pays: 'SAUDI ARABIA', count: 90 },
      { pays: 'ISRAEL', count: 70 }
    ]
  },
  { 
    continent: 'OCEANIA', 
    totalFournisseurs: 120, 
    scoreMoyen: 4.3,
    pays: [
      { pays: 'AUSTRALIA', count: 80 },
      { pays: 'NEW ZEALAND', count: 40 }
    ]
  }
];

// Données fictives pour les scores par zone
export const fictiveZoneScores = [
  { zone: 'EUROPE', scoreMoyen: '4.8' },
  { zone: 'NORTH AMERICA', scoreMoyen: '5.2' },
  { zone: 'SOUTH AMERICA', scoreMoyen: '5.9' },
  { zone: 'ASIA', scoreMoyen: '6.7' },
  { zone: 'AFRICA', scoreMoyen: '7.1' },
  { zone: 'MIDDLE EAST', scoreMoyen: '6.4' },
  { zone: 'OCEANIA', scoreMoyen: '4.3' }
];

// Fonction pour générer des statistiques enrichies
export const generateEnhancedStats = (realStats) => {
  return {
    totalFournisseurs: Math.max(realStats.totalFournisseurs || 0, 6500) + Math.floor(Math.random() * 1500),
    risqueEleve: Math.max(realStats.risqueEleve || 0, 850) + Math.floor(Math.random() * 250),
    risqueMoyen: Math.max(realStats.risqueMoyen || 0, 2200) + Math.floor(Math.random() * 500),
    risqueFaible: Math.max(realStats.risqueFaible || 0, 3000) + Math.floor(Math.random() * 750)
  };
};

// Fonction pour générer des données d'évolution des risques
export const generateRiskEvolution = (stats) => {
  return Array(12).fill(0).map((_, i) => {
    const month = i + 1;
    const trend = i / 12; // Facteur de tendance qui augmente avec les mois
    
    return {
      mois: month,
      risqueEleve: Math.max(50, Math.round((stats.risqueEleve || 850) * (1 - trend * 0.3) * (0.85 + Math.random() * 0.3))),
      risqueMoyen: Math.max(100, Math.round((stats.risqueMoyen || 2200) * (1 - trend * 0.1) * (0.9 + Math.random() * 0.2))),
      risqueFaible: Math.max(150, Math.round((stats.risqueFaible || 3000) * (1 + trend * 0.2) * (0.95 + Math.random() * 0.1)))
    };
  });
};
