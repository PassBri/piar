import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Estudiantes from './pages/Estudiantes.jsx';
import EstudianteForm from './pages/EstudianteForm.jsx';
import PiarDetalle from './pages/PiarDetalle.jsx';
import Seguimiento from './pages/Seguimiento.jsx';
import Estadisticas from './pages/Estadisticas.jsx';
import Admin from './pages/Admin.jsx';

function Privada({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return usuario ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Privada><Layout /></Privada>}>
        <Route index element={<Dashboard />} />
        <Route path="estudiantes" element={<Estudiantes />} />
        <Route path="estudiantes/nuevo" element={<EstudianteForm />} />
        <Route path="estudiantes/:id" element={<EstudianteForm />} />
        <Route path="piar/:id" element={<PiarDetalle />} />
        <Route path="seguimiento" element={<Seguimiento />} />
        <Route path="estadisticas" element={<Estadisticas />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
