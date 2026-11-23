import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sigpiar_token');
    const u = localStorage.getItem('sigpiar_usuario');
    if (token && u) setUsuario(JSON.parse(u));
    setCargando(false);
  }, []);

  async function login(correo, clave) {
    const data = await api.post('/auth/login', { correo, clave });
    localStorage.setItem('sigpiar_token', data.token);
    localStorage.setItem('sigpiar_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }

  function logout() {
    localStorage.removeItem('sigpiar_token');
    localStorage.removeItem('sigpiar_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
