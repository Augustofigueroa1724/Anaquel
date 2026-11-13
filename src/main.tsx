import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/bodoni-moda/index.css';
import '@fontsource/manrope/index.css';
import '@fontsource/oswald/index.css';
import '@fontsource/ibm-plex-mono/index.css';
import './styles/anaquel.css';
import './styles/formulario.css';
import './styles/nordico.css';
import { aplicaEstilo, leeEstilo } from './app/estilo';
aplicaEstilo(leeEstilo());
import App from './app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
