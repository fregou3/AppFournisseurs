const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const fournisseursRouter = require('./routes/fournisseurs');
const groupsRouter = require('./routes/groups');
const tableStructureRouter = require('./routes/table_structure');
const columnMappingRouter = require('./routes/column-mapping');

app.use('/fournisseurs', fournisseursRouter);
app.use('/groups', groupsRouter);
app.use('/table-structure', tableStructureRouter);
app.use('/column-mapping', columnMappingRouter);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
