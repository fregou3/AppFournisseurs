// Ajoutez ces imports au début du fichier QualificationTable.js
import ResultatAnalyse from './ResultatAnalyse';

// Ajoutez ces états dans le composant QualificationTable
const [isAllFieldsFilled, setIsAllFieldsFilled] = useState(false);
const [certificationChecked, setCertificationChecked] = useState(false);

// Ajoutez cet effet pour vérifier les champs requis
useEffect(() => {
  const requiredFields = [
    'localisation',
    'region_intervention',
    'pays_intervention',
    'qualification_tiers',
    'nature_tiers',
    'categorisation_tiers',
    'intervention_autre_partie',
    'evaluation_risque',
    'interaction_tiers_autre_partie',
    'encadrement_relation',
    'flux_financier',
    'modalites_paiement',
    'niveau_dependance',
    'niveau_dependance_clarins',
    'modalites_renouvellement',
    'antecedents',
    'duree_envisagee'
  ];

  const allFieldsFilled = requiredFields.every(field => {
    const value = environnement[field] || choixTiers[field] || relationContractuelle[field];
    return value && value !== '' && value !== '---Choix de la réponse---';
  });

  setIsAllFieldsFilled(allFieldsFilled);
}, [environnement, choixTiers, relationContractuelle]);

// Ajoutez ce composant juste avant la fermeture du composant Box
{isAllFieldsFilled && (
  <ResultatAnalyse 
    answers={{
      ...environnement,
      ...choixTiers,
      ...relationContractuelle
    }}
    certificationChecked={certificationChecked}
    onCertificationChange={setCertificationChecked}
  />
)}
