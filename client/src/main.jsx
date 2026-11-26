import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ExpedienteProvider } from './context/ExpedienteContext.jsx';
import { aplicarA11yGuardado } from './components/Accesibilidad.jsx';
import './styles/theme.css';

aplicarA11yGuardado();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ExpedienteProvider>
          <App />
        </ExpedienteProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
