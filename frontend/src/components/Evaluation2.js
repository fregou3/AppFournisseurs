import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import config from '../config';
import IdentiteTiers from './IdentiteTiers';
import QualificationTable from './QualificationTable';

const Evaluation2 = () => {
  // States for requester
  const [requester, setRequester] = useState({
    name: '',
    title: '',
    region: '',
    company: '',
    date: new Date().toISOString().split('T')[0]
  });

  // States for third party
  const [thirdParty, setThirdParty] = useState({
    name: '',
    reasonForRelationship: '',
    selectionCriteria: ''
  });

  // States for evaluation criteria
  const [environment, setEnvironment] = useState({
    location: '',
    regionOfIntervention: '',
    countryOfIntervention: '',
    qualification: ''
  });

  const [thirdPartyChoice, setThirdPartyChoice] = useState({
    nature: '',
    categorization: '',
    interventionByOtherParty: '',
    conflictOfInterests: '',
    interactionWithAuthorities: '',
    detailsOfInteraction: ''
  });

  const [contractualRelationship, setContractualRelationship] = useState({
    supervision: '',
    financialFlow: '',
    paymentTerms: '',
    dependenceOnThirdParty: '',
    dependenceOnClarins: '',
    renewal: '',
    background: '',
    duration: ''
  });

  // States for value lists
  const [regions, setRegions] = useState([
    'France - Headquarters',
    'International Markets - Europe',
    'International Markets - North America',
    'International Markets - APAC',
    'International Markets - Future Growth Markets',
    'Global Travel Retail'
  ]);

  const [reasonsForRelationship] = useState([
    'Current Business'
  ]);

  const [selectionCriteria, setSelectionCriteria] = useState([]);

  useEffect(() => {
    // Load selection criteria
    const fetchSelectionCriteria = async () => {
      try {
        console.log('=== Loading selection criteria ===');
        const response = await axios.get(`${config.apiUrl}/api/evaluation2/selection-criteria`);
        if (response.data && Array.isArray(response.data)) {
          console.log('Selection criteria received:', response.data);
          setSelectionCriteria(response.data);
        }
      } catch (error) {
        console.error('Error loading selection criteria:', error);
      }
    };

    fetchSelectionCriteria();
  }, []);

  // States for results
  const [totalScore, setTotalScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [message, setMessage] = useState(null);

  // States for analysis result
  const [analysisResult, setAnalysisResult] = useState({
    result: '',
    categorization: '',
    nextSteps: ''
  });

  // State for certification checkbox
  const [certificationChecked, setCertificationChecked] = useState(false);

  // Function to calculate score
  const calculateScore = () => {
    let score = 0;
    let maxScore = 0;

    // Add logic to calculate score based on criteria
    // ...

    return (score / maxScore * 100).toFixed(2);
  };

  // Function to determine risk level
  const determineRiskLevel = (score) => {
    if (score >= 75) return 'High Risk Level';
    if (score >= 50) return 'Moderate Risk Level';
    return 'Low Risk Level';
  };

  // Function to update analysis result
  const updateAnalysisResult = useCallback(() => {
    // Logic to calculate result based on answers
    // To be implemented according to business rules
    const newResult = '';
    const newCategorization = '';
    const newNextSteps = '';

    setAnalysisResult({
      result: newResult,
      categorization: newCategorization,
      nextSteps: newNextSteps
    });
  }, [environment, thirdPartyChoice, contractualRelationship]);

  // Effect to update result when answers change
  useEffect(() => {
    updateAnalysisResult();
  }, [updateAnalysisResult]);

  // Function to submit
  const handleSubmit = async () => {
    try {
      const score = calculateScore();
      const riskLevel = determineRiskLevel(score);

      const evaluationData = {
        requester,
        thirdParty,
        environment,
        thirdPartyChoice,
        contractualRelationship,
        score,
        riskLevel,
        evaluationDate: new Date().toISOString()
      };

      const response = await axios.post(`${config.apiUrl}/api/evaluation2/evaluations`, evaluationData);

      setTotalScore(score);
      setRiskLevel(riskLevel);
      setMessage({ type: 'success', text: 'Evaluation saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving evaluation' });
      console.error('Error:', error);
    }
  };

  // Function to reset qualification data
  const handleResetQualification = () => {
    setEnvironment({
      location: '',
      regionOfIntervention: '',
      countryOfIntervention: '',
      qualification: ''
    });
    setThirdPartyChoice({
      nature: '',
      categorization: '',
      interventionByOtherParty: '',
      conflictOfInterests: '',
      interactionWithAuthorities: '',
      detailsOfInteraction: ''
    });
    setContractualRelationship({
      supervision: '',
      financialFlow: '',
      paymentTerms: '',
      dependenceOnThirdParty: '',
      dependenceOnClarins: '',
      renewal: '',
      background: '',
      duration: ''
    });
  };

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Third Party Integrity Evaluation / Second Level Evaluation
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          The third party integrity evaluation allows for the assessment of individual situations, which is not possible with risk mapping. A third party considered to be part of a low-risk group may be requalified as a high-risk third party after individual evaluation.
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Requester Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Requester</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={requester.name}
                  onChange={(e) => setRequester({ ...requester, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Title"
                  value={requester.title}
                  onChange={(e) => setRequester({ ...requester, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Region</InputLabel>
                  <Select
                    value={requester.region}
                    label="Region"
                    onChange={(e) => setRequester({ ...requester, region: e.target.value })}
                  >
                    {regions.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  value={requester.company}
                  onChange={(e) => setRequester({ ...requester, company: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date of Request"
                  value={requester.date}
                  onChange={(e) => setRequester({ ...requester, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Third Party Identity Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Third Party Identity</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <IdentiteTiers 
              thirdParty={thirdParty}
              setThirdParty={setThirdParty}
            />
          </AccordionDetails>
        </Accordion>

        {/* Qualification Section */}
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ backgroundColor: '#f5f5f5' }}
          >
            <Typography variant="h6">Qualification</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
              By answering all the questions (through the drop-down menus), a qualification of the third party will be automatically performed.
            </Typography>
            <QualificationTable 
              environment={environment}
              setEnvironment={setEnvironment}
              thirdPartyChoice={thirdPartyChoice}
              setThirdPartyChoice={setThirdPartyChoice}
              contractualRelationship={contractualRelationship}
              setContractualRelationship={setContractualRelationship}
              handleReset={handleResetQualification}
            />
          </AccordionDetails>
        </Accordion>

        {/* Results Section */}
        {totalScore > 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Analysis Result
            </Typography>
            <Typography variant="body1">
              Total Score: {totalScore}
            </Typography>
            <Typography variant="body1" color={riskLevel.includes('High') ? 'error' : 'primary'}>
              Risk Level: {riskLevel}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Next Steps: {nextSteps}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!requester.name || !thirdParty.name}
          >
            Save Evaluation
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Evaluation2;
