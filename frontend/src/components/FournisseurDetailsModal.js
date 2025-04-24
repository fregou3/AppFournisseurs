import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  useTheme
} from '@mui/material';

const FournisseurDetailsModal = ({ open, onClose, details, name }) => {
  const theme = useTheme();
  
  if (!details) return null;

  const formatDetails = (details) => {
    if (typeof details === 'string') {
      return details;
    }
    
    if (typeof details === 'object') {
      return Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }
    
    return 'Aucun détail disponible';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxHeight: '90vh',
          '& .MuiDialogTitle-root': {
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            padding: '16px 24px',
            fontSize: '1.4rem'
          },
          '& .MuiDialogContent-root': {
            padding: '24px',
            backgroundColor: theme.palette.background.default
          },
          '& .MuiDialogActions-root': {
            padding: '16px 24px',
            borderTop: `1px solid ${theme.palette.divider}`
          }
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" sx={{ color: 'inherit' }}>
          Détails du fournisseur - {name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'auto',
          maxWidth: '100%',
          padding: '20px'
        }}>
          <Typography
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: '1.6',
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.background.paper,
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontFamily: theme.typography.fontFamily,
              '& strong': {
                color: theme.palette.primary.main
              }
            }}
          >
            {formatDetails(details)}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
            borderRadius: '8px',
            textTransform: 'none',
            padding: '8px 24px'
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FournisseurDetailsModal;
