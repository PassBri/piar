import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ExpedienteProvider } from './context/ExpedienteContext.jsx';
import './styles/theme.css';

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
