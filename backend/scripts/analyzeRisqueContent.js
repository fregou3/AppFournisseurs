const fs = require('fs').promises;
const path = require('path');

async function analyzeRisqueContent() {
  try {
    const risqueDirPath = 'C:\\App\\AppGetionFournisseurs\\AppGetionFournisseurs_2.1\\Risque';
    const files = await fs.readdir(risqueDirPath);

    console.log('Analyse des fichiers de risque:\n');
    
    for (const file of files) {
      const filePath = path.join(risqueDirPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Rechercher différentes variations possibles de la note de conformité
      const conformitePatterns = [
        /[Nn]ote\s+(?:de\s+)?[Cc]onformit[ée]\s*:?\s*(\d+)/,
        /[Cc]onformit[ée]\s*:?\s*(\d+)/,
        /[Rr]isque\s+(?:de\s+)?[Cc]onformit[ée]\s*:?\s*(\d+)/,
        /[Nn]ote\s+[Cc]ompliance\s*:?\s*(\d+)/,
        /[Cc]ompliance\s*:?\s*(\d+)/
      ];

      // Rechercher différentes variations de la note financière
      const financierPatterns = [
        /[Nn]ote\s+(?:de\s+)?[Rr]isque\s+[Ff]inanci[èe]re?\s*:?\s*(\d+)/,
        /[Rr]isque\s+[Ff]inanci[èe]re?\s*:?\s*(\d+)/,
        /[Nn]ote\s+[Ff]inanci[èe]re?\s*:?\s*(\d+)/
      ];

      let conformiteFound = false;
      let financierFound = false;
      let conformiteValue = null;
      let financierValue = null;

      // Chercher les mentions de conformité
      for (const pattern of conformitePatterns) {
        const match = content.match(pattern);
        if (match) {
          conformiteFound = true;
          conformiteValue = match[1];
          break;
        }
      }

      // Chercher les mentions financières
      for (const pattern of financierPatterns) {
        const match = content.match(pattern);
        if (match) {
          financierFound = true;
          financierValue = match[1];
          break;
        }
      }

      // Extraire le contexte autour des mentions de conformité
      const conformiteContexts = [];
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes('conformité') || 
            line.toLowerCase().includes('conformite') ||
            line.toLowerCase().includes('compliance')) {
          const start = Math.max(0, index - 2);
          const end = Math.min(lines.length, index + 3);
          conformiteContexts.push(lines.slice(start, end).join('\n'));
        }
      });

      console.log(`\nFichier: ${file}`);
      console.log('----------------------------------------');
      console.log(`Note financière trouvée: ${financierFound ? 'Oui (' + financierValue + ')' : 'Non'}`);
      console.log(`Note de conformité trouvée: ${conformiteFound ? 'Oui (' + conformiteValue + ')' : 'Non'}`);
      
      if (conformiteContexts.length > 0) {
        console.log('\nContexte des mentions de conformité:');
        conformiteContexts.forEach((context, i) => {
          console.log(`\nMention ${i + 1}:`);
          console.log(context);
        });
      }
    }

  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
  }
}

analyzeRisqueContent();
