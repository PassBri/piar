// Indicador de guardado automático (reemplaza el botón de guardar)
export default function Guardado({ estado }) {
  if (estado === 'saving') return <span style={{ fontSize: 12, color: 'var(--gris-500)' }}>Guardando…</span>;
  if (estado === 'saved') return <span style={{ fontSize: 12, color: 'var(--ok)', fontWeight: 600 }}>✓ Guardado automáticamente</span>;
  if (estado === 'error') return <span style={{ fontSize: 12, color: '#c62828' }}>No se pudo guardar</span>;
  return <span style={{ fontSize: 12, color: 'var(--gris-400)' }}>Se guarda automáticamente</span>;
}
