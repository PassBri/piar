const BASE = '/api';

function getToken() {
  return localStorage.getItem('piar_token');
}

async function request(path, { method = 'GET', body, blob = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (blob) {
    if (!res.ok) throw new Error('No se pudo generar el documento.');
    return res.blob();
  }

  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    throw new Error((data && data.error) || 'Error en la solicitud.');
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  del: (p) => request(p, { method: 'DELETE' }),
  // Abre un PDF del backend en una pestaña nueva (para imprimir)
  async abrirPdf(path) {
    const b = await request(path, { blob: true });
    const url = URL.createObjectURL(b);
    window.open(url, '_blank');
  },
};
