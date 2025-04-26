/**
 * Script corrigé pour enrichir les graphiques et tableaux du rapport d'analyse
 * avec des données fictives, sans modifier les tables existantes.
 * 
 * Ce script modifie le composant Analyse.js pour injecter des données
 * fictives dans les visualisations.
 */

const fs = require('fs');
const path = require('path');

// Chemin du fichier Analyse.js
const analysePath = path.join(__dirname, 'components', 'Analyse.js');
const backupPath = `${analysePath}.backup.${Date.now()}`;

// Lire le contenu du fichier
console.log(`Lecture du fichier ${analysePath}...`);
const content = fs.readFileSync(analysePath, 'utf8');

// Créer une sauvegarde
fs.writeFileSync(backupPath, content);
console.log(`Sauvegarde créée: ${backupPath}`);

// Fonction pour enrichir les données d'analyse
function enhanceAnalysisData(content) {
  console.log('\n=== ENRICHISSEMENT DES DONNÉES D\'ANALYSE ===');
  let modifiedContent = content;

  // 1. Enrichir les données de statistiques
  modifiedContent = modifiedContent.replace(
    /(const calculateStats = \(fournisseurs\) => \{[\s\S]*?)(setStats\(stats\);)/,
    `$1// Enrichir les statistiques avec des données fictives
    const enhancedStats = {
      totalFournisseurs: Math.max(fournisseurs.length, 6500) + Math.floor(Math.random() * 1500),
      risqueEleve: Math.max(stats.risqueEleve, 850) + Math.floor(Math.random() * 250),
      risqueMoyen: Math.max(stats.risqueMoyen, 2200) + Math.floor(Math.random() * 500),
      risqueFaible: Math.max(stats.risqueFaible, 3000) + Math.floor(Math.random() * 750)
    };
    console.log('Statistiques enrichies:', enhancedStats);
    setStats(enhancedStats);`
  );

  // 2. Enrichir les données d'évolution des risques
  modifiedContent = modifiedContent.replace(
    /(const getEvolutionRisque = \(\) => \{[\s\S]*?)(const evolution = Array\(12\).fill\(0\).map[\s\S]*?\);)/,
    `$1const evolution = Array(12).fill(0).map((_, i) => {
      // Données fictives avec tendance à la baisse pour les risques élevés
      // et tendance à la hausse pour les risques faibles (amélioration)
      const month = i + 1;
      const trend = i / 12; // Facteur de tendance qui augmente avec les mois
      
      return {
        mois: month,
        risqueEleve: Math.max(50, Math.round(stats.risqueEleve * (1 - trend * 0.3) * (0.85 + Math.random() * 0.3))),
        risqueMoyen: Math.max(100, Math.round(stats.risqueMoyen * (1 - trend * 0.1) * (0.9 + Math.random() * 0.2))),
        risqueFaible: Math.max(150, Math.round(stats.risqueFaible * (1 + trend * 0.2) * (0.95 + Math.random() * 0.1)))
      };
    });`
  );

  // 3. Enrichir les données de fournisseurs à risque
  modifiedContent = modifiedContent.replace(
    /(const getFournisseursRisque = \(\) => \{[\s\S]*?)(return dataArray[\s\S]*?}\);)/,
    `$1// Obtenir les données réelles
    const realData = dataArray
      .filter(f => Math.round(f.score) === scoreFilter)
      .sort((a, b) => b.score - a.score)
      .map(f => ({
        nom: f['PARTNERS GROUP'],
        score: f.score,
        zone: f['ORGANIZATION ZONE'],
        region: f['ORGANIZATION 1'], 
        pays: f['ORGANIZATION COUNTRY'], 
        localisation: f['Country of Supplier Contact'], 
        natureTier: f['Activity Area'] 
      }));
    
    // Ajouter des données fictives
    const fictiveSuppliers = [
      { nom: 'Global Logistics Partners', score: scoreFilter, zone: 'EUROPE', region: 'WESTERN EUROPE', pays: 'FRANCE', localisation: 'PARIS', natureTier: 'Four. / Presta. - Logistique' },
      { nom: 'Tech Solutions Inc.', score: scoreFilter, zone: 'NORTH AMERICA', region: 'USA', pays: 'UNITED STATES', localisation: 'NEW YORK', natureTier: 'Four. / Presta. - Matériel informatique' },
      { nom: 'Asian Manufacturing Ltd', score: scoreFilter, zone: 'ASIA', region: 'EAST ASIA', pays: 'CHINA', localisation: 'SHANGHAI', natureTier: 'Four. / Presta. - Sous-traitance production' },
      { nom: 'European Media Group', score: scoreFilter, zone: 'EUROPE', region: 'CENTRAL EUROPE', pays: 'GERMANY', localisation: 'BERLIN', natureTier: 'Four. / Presta. - Communication et média' },
      { nom: 'South American Distributors', score: scoreFilter, zone: 'SOUTH AMERICA', region: 'BRAZIL', pays: 'BRAZIL', localisation: 'SAO PAULO', natureTier: 'Four. / Presta. - Transport de marchandise et services liés' },
      { nom: 'African Resources Corp', score: scoreFilter, zone: 'AFRICA', region: 'SOUTH AFRICA', pays: 'SOUTH AFRICA', localisation: 'JOHANNESBURG', natureTier: 'Four. / Presta. - Fourniture de matières premières' },
      { nom: 'Middle East Trading Co', score: scoreFilter, zone: 'MIDDLE EAST', region: 'UAE', pays: 'UNITED ARAB EMIRATES', localisation: 'DUBAI', natureTier: 'Four. / Presta. - Immobilier' },
      { nom: 'Nordic Consulting Group', score: scoreFilter, zone: 'EUROPE', region: 'NORTHERN EUROPE', pays: 'SWEDEN', localisation: 'STOCKHOLM', natureTier: 'Four. / Presta. - Conseils (juridiques, stratégiques, etc.)' },
      { nom: 'Pacific Islands Suppliers', score: scoreFilter, zone: 'OCEANIA', region: 'AUSTRALIA', pays: 'AUSTRALIA', localisation: 'SYDNEY', natureTier: 'Four. / Presta. - Fourniture de packaging' },
      { nom: 'Eastern European Logistics', score: scoreFilter, zone: 'EUROPE', region: 'EASTERN EUROPE', pays: 'POLAND', localisation: 'WARSAW', natureTier: 'Four. / Presta. - Logistique' }
    ];
    
    // Combiner les données réelles et fictives
    return [...realData, ...fictiveSuppliers];`
  );

  // 4. Enrichir les données de distribution géographique
  modifiedContent = modifiedContent.replace(
    /(const getDistributionGeographique = \(\) => \{[\s\S]*?)(return Array\.from\(distribution\)[\s\S]*?}\);)/,
    `$1// Données réelles
    const realDistribution = Array.from(distribution).map(([zone, count]) => ({
      zone,
      count,
      percentage: ((count / data.length) * 100).toFixed(1)
    }));
    
    // Enrichir avec des données fictives pour les zones manquantes
    const allZones = ['EUROPE', 'NORTH AMERICA', 'SOUTH AMERICA', 'ASIA', 'AFRICA', 'MIDDLE EAST', 'OCEANIA'];
    const existingZones = new Set(realDistribution.map(item => item.zone));
    
    // Ajouter les zones manquantes avec des données fictives
    const enhancedDistribution = [...realDistribution];
    
    allZones.forEach(zone => {
      if (!existingZones.has(zone)) {
        const fictitiousCount = Math.floor(Math.random() * 500) + 100;
        const totalWithFictitious = data.length + fictitiousCount;
        enhancedDistribution.push({
          zone,
          count: fictitiousCount,
          percentage: ((fictitiousCount / totalWithFictitious) * 100).toFixed(1)
        });
      }
    });
    
    // Ajuster les pourcentages pour qu'ils totalisent 100%
    const totalCount = enhancedDistribution.reduce((sum, item) => sum + item.count, 0);
    enhancedDistribution.forEach(item => {
      item.percentage = ((item.count / totalCount) * 100).toFixed(1);
    });
    
    return enhancedDistribution;`
  );

  // 5. Enrichir les données de statistiques géographiques
  modifiedContent = modifiedContent.replace(
    /(const getGeographicStats = \(\) => \{[\s\S]*?)(return Array\.from\(stats\)[\s\S]*?}\);)/,
    `$1// Données réelles
    const realStats = Array.from(stats).map(([continent, data]) => ({
      continent,
      totalFournisseurs: data.totalFournisseurs,
      scoreMoyen: data.totalFournisseurs > 0 ? (data.scoreTotal / data.totalFournisseurs).toFixed(2) : 0,
      pays: Array.from(data.pays).map(([pays, count]) => ({ pays, count }))
    }));
    
    // Enrichir avec des données fictives
    const fictitiousData = [
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
    
    // Fusionner les données réelles et fictives
    const enhancedStats = [...realStats];
    const existingContinents = new Set(realStats.map(item => item.continent));
    
    fictitiousData.forEach(fictItem => {
      const existingIndex = enhancedStats.findIndex(item => item.continent === fictItem.continent);
      
      if (existingIndex === -1) {
        // Ajouter le continent s'il n'existe pas
        enhancedStats.push(fictItem);
      } else {
        // Enrichir les données existantes
        const existing = enhancedStats[existingIndex];
        
        // Augmenter le nombre de fournisseurs si les données réelles sont trop faibles
        if (existing.totalFournisseurs < 100) {
          existing.totalFournisseurs = Math.max(existing.totalFournisseurs, fictItem.totalFournisseurs / 2);
          existing.scoreMoyen = ((parseFloat(existing.scoreMoyen) + parseFloat(fictItem.scoreMoyen)) / 2).toFixed(2);
        }
        
        // Ajouter des pays fictifs manquants
        const existingCountries = new Set(existing.pays.map(p => p.pays));
        fictItem.pays.forEach(fictCountry => {
          if (!existingCountries.has(fictCountry.pays)) {
            existing.pays.push({
              pays: fictCountry.pays,
              count: Math.floor(fictCountry.count / 3) // Réduire le nombre pour les pays fictifs
            });
          }
        });
      }
    });
    
    return enhancedStats;`
  );

  // 6. Enrichir les données de scores par zone
  modifiedContent = modifiedContent.replace(
    /(const getScoresParZone = \(\) => \{[\s\S]*?)(return Array\.from\(zonesMap\)[\s\S]*?}\);)/,
    `$1// Données réelles
    const realZoneScores = Array.from(zonesMap)
      .filter(([_, data]) => data.count > 0) 
      .map(([zone, data]) => ({
        zone,
        scoreMoyen: data.count > 0 ? (data.total / data.count).toFixed(2) : 0
      }));
    
    // Enrichir avec des données fictives
    const fictitiousZoneScores = [
      { zone: 'EUROPE', scoreMoyen: '4.8' },
      { zone: 'NORTH AMERICA', scoreMoyen: '5.2' },
      { zone: 'SOUTH AMERICA', scoreMoyen: '5.9' },
      { zone: 'ASIA', scoreMoyen: '6.7' },
      { zone: 'AFRICA', scoreMoyen: '7.1' },
      { zone: 'MIDDLE EAST', scoreMoyen: '6.4' },
      { zone: 'OCEANIA', scoreMoyen: '4.3' }
    ];
    
    // Fusionner les données réelles et fictives
    const enhancedZoneScores = [...realZoneScores];
    const existingZones = new Set(realZoneScores.map(item => item.zone));
    
    fictitiousZoneScores.forEach(fictZone => {
      if (!existingZones.has(fictZone.zone)) {
        enhancedZoneScores.push(fictZone);
      }
    });
    
    return enhancedZoneScores;`
  );

  console.log('✅ Données d\'analyse enrichies avec succès');
  return modifiedContent;
}

// Enrichir les données d'analyse
const enhancedContent = enhanceAnalysisData(content);

// Écrire le contenu enrichi dans le fichier
fs.writeFileSync(analysePath, enhancedContent);
console.log(`\n✅ Modifications appliquées au fichier ${analysePath}`);

console.log('\n=== INSTRUCTIONS POUR FINALISER ===');
console.log('1. Redémarrez le serveur frontend pour appliquer les modifications');
console.log('2. Si vous souhaitez revenir à la version originale, vous pouvez restaurer la sauvegarde avec:');
console.log(`   cp "${backupPath}" "${analysePath}"`);
console.log('3. Les graphiques et tableaux du rapport d\'analyse sont maintenant enrichis avec des données fictives');
