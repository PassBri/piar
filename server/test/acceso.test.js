import { test } from 'node:test';
import assert from 'node:assert';
import { negarAcceso } from '../src/lib/acceso.js';

const docente = { rol: 'docente', institucion_id: 1 };
const psico = { rol: 'psicoorientador', institucion_id: 1 };
const superadmin = { rol: 'superadmin', institucion_id: null };

test('mismo colegio: tiene acceso', () => {
  assert.equal(negarAcceso(docente, { institucion_id: 1, reservado: false }), null);
});

test('confidencialidad: otro colegio se niega (403)', () => {
  const r = negarAcceso(docente, { institucion_id: 2, reservado: false });
  assert.equal(r.status, 403);
});

test('superadmin cruza instituciones', () => {
  assert.equal(negarAcceso(superadmin, { institucion_id: 2, reservado: false }), null);
});

test('caso reservado: oculto al docente (403)', () => {
  const r = negarAcceso(docente, { institucion_id: 1, reservado: true });
  assert.equal(r.status, 403);
});

test('caso reservado: accesible para psicoorientador', () => {
  assert.equal(negarAcceso(psico, { institucion_id: 1, reservado: true }), null);
});

test('recurso inexistente devuelve 404', () => {
  assert.equal(negarAcceso(docente, null).status, 404);
});
