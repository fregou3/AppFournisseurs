// ... (code précédent inchangé jusqu'à la fonction extractScoresFromText)

async function extractScoresFromText(text) {
  let noteFinanciere = 0;
  let noteConformite = 0;

  // Patterns plus flexibles pour la note financière
  const financierPatterns = [
    /[Nn]ote\s+(?:de\s+)?[Rr]isque\s+[Ff]inanci[èe]re?\s*:?\s*(\d+)/,
    /[Rr]isque\s+[Ff]inanci[èe]re?\s*:?\s*(?:[Nn]ote\s+(?:de\s+)?)?(\d+)/,
    /[Nn]ote\s+[Ff]inanci[èe]re?\s*:?\s*(\d+)/
  ];

  // Patterns plus flexibles pour la note de conformité
  const conformitePatterns = [
    /[Nn]ote\s+(?:de\s+)?[Rr]isque\s+(?:de\s+)?[Cc]onformit[ée]\s*:?\s*(\d+)/,
    /[Rr]isque\s+(?:de\s+)?[Cc]onformit[ée]\s*:?\s*(?:[Nn]ote\s+(?:de\s+)?)?(\d+)/,
    /[Nn]ote\s+(?:de\s+)?[Cc]onformit[ée]\s*:?\s*(\d+)/,
    /[Cc]onformit[ée]\s*:?\s*(\d+)/,
    /[Cc]ompliance\s*:?\s*(\d+)/
  ];

  // Recherche des scores avec les nouveaux patterns
  for (const pattern of financierPatterns) {
    const match = text.match(pattern);
    if (match) {
      noteFinanciere = parseInt(match[1]);
      break;
    }
  }

  for (const pattern of conformitePatterns) {
    const match = text.match(pattern);
    if (match) {
      noteConformite = parseInt(match[1]);
      break;
    }
  }

  // Si aucune note n'est trouvée, chercher dans le texte des mentions de risque
  if (noteConformite === 0) {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('conformité') || line.includes('conformite') || line.includes('compliance')) {
        // Chercher un nombre dans les 3 lignes suivantes
        for (let j = i; j < Math.min(i + 3, lines.length); j++) {
          const numMatch = lines[j].match(/(\d+)\/20/);
          if (numMatch) {
            noteConformite = parseInt(numMatch[1]);
            break;
          }
        }
      }
    }
  }

  return {
    noteFinanciere,
    noteConformite
  };
}

// ... (reste du code inchangé)
