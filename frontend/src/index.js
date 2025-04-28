import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import './api-replacer'; // Enrichissement des visualisations avec des données fictives
import reportWebVitals from './reportWebVitals';
import config from './config';

// Déterminer le basename pour le routeur en fonction de la configuration
const basename = config.baseUrl;
console.log('Initialisation du routeur avec basename:', basename);

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
