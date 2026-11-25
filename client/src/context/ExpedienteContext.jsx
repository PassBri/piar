import { createContext, useContext, useState, useCallback } from 'react';

const ExpedienteContext = createContext(null);

// Mantiene el estudiante cuyo expediente se está trabajando, para mostrar su
// ficha en la barra lateral. Las pantallas del PIAR lo fijan al cargar.
export function ExpedienteProvider({ children }) {
  const [estudiante, setEstudiante] = useState(null);

  const fijarExpediente = useCallback((datos) => {
    if (!datos || !datos.id) return;
    setEstudiante((prev) => {
      // Evita re-render si es el mismo estudiante con los mismos datos
      if (prev && prev.id === datos.id && prev.foto === datos.foto &&
          prev.nombres === datos.nombres && prev.grado === datos.grado &&
          prev.anioPiar === datos.anioPiar && prev.estadoPiar === datos.estadoPiar) return prev;
      return datos;
    });
  }, []);

  const limpiarExpediente = useCallback(() => setEstudiante(null), []);

  return (
    <ExpedienteContext.Provider value={{ estudiante, fijarExpediente, limpiarExpediente }}>
      {children}
    </ExpedienteContext.Provider>
  );
}

export function useExpediente() {
  const ctx = useContext(ExpedienteContext);
  if (!ctx) return { estudiante: null, fijarExpediente: () => {}, limpiarExpediente: () => {} };
  return ctx;
}
