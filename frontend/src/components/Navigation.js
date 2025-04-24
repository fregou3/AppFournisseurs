import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Gestion Fournisseurs
        </Typography>
        <Button color="inherit" component={Link} to="/">
          Evaluation de 1er niveau
        </Button>
        <Button color="inherit" component={Link} to="/upload">
          Import
        </Button>
        <Button color="inherit" component={Link} to="/groupings">
          Regroupements
        </Button>
        <Button color="inherit" component={Link} to="/analyse">
          ANALYSE
        </Button>
        <Button color="inherit" component={Link} to="/compare">
          Compare
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
