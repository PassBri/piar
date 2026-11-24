import { test } from 'node:test';
import assert from 'node:assert';
import { avancePiar, avanceAnexo3, avanceAnexo2 } from '../src/lib/avance.js';

test('Anexo 3 vacío = 0%', () => {
  assert.equal(avanceAnexo3(null), 0);
});

test('Anexo 3 completo = 100%', () => {
  const acta = { compromisos_familia: 'a', compromisos_institucion: 'b', firmada_familia: true, firmada_institucion: true };
  assert.equal(avanceAnexo3(acta), 100);
});

test('Anexo 2 con valoración, aspectos, ajustes y áreas = 100%', () => {
  assert.equal(avanceAnexo2({ valoracion: 'a', aspectos_generales: 'b' }, 2, 3), 100);
});

test('Anexo 2 vacío = 0%', () => {
  assert.equal(avanceAnexo2({ valoracion: '', aspectos_generales: '' }, 0, 0), 0);
});

test('avancePiar: el total es el promedio de los tres anexos', () => {
  const av = avancePiar({
    estudiante: { nombres: 'x', documento_numero: '1', grado: '5', fecha_nacimiento: '2015-01-01', identificacion: {}, entorno_salud: {}, entorno_hogar: {}, entorno_educativo: {} },
    piar: { valoracion: 'a', aspectos_generales: 'b' },
    numAjustes: 2, numAreasValoradas: 3,
    acta: { compromisos_familia: 'a', compromisos_institucion: 'b', firmada_familia: true, firmada_institucion: true },
  });
  assert.equal(av.anexo2, 100);
  assert.equal(av.anexo3, 100);
  assert.equal(av.total, Math.round((av.anexo1 + av.anexo2 + av.anexo3) / 3));
});
