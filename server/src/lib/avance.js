// Cálculo del porcentaje de avance de diligenciamiento de un PIAR, por anexo.
// Mecanismo de control para rector, coordinador y psicoorientador.

// Claves oficiales esperadas en el Anexo 1 (deben coincidir con el formulario del cliente)
const CLAVES_A1 = {
  identificacion: ['sede', 'jornada', 'grado_ingreso', 'lugar_nacimiento', 'sexo', 'departamento_vive',
    'municipio_vive', 'direccion', 'barrio', 'telefono', 'correo', 'centro_proteccion', 'grupo_etnico', 'victima_conflicto'],
  entorno_salud: ['afiliacion', 'eps', 'regimen', 'lugar_atencion', 'atendido_salud', 'diagnostico',
    'discapacidad', 'terapias', 'tratamiento', 'medicamentos', 'productos_apoyo'],
  entorno_hogar: ['nombre_madre', 'ocupacion_madre', 'nivel_madre', 'nombre_padre', 'ocupacion_padre', 'nivel_padre',
    'nombre_cuidador', 'parentesco_cuidador', 'nivel_cuidador', 'telefono_cuidador', 'num_hermanos', 'lugar_ocupa',
    'personas_vive', 'apoyan_crianza', 'bajo_proteccion', 'subsidio'],
  entorno_educativo: ['vinculado_otra_ie', 'ultimo_grado', 'aprobo', 'recibe_informe', 'observaciones',
    'programas_complementarios', 'ie_matricula', 'sede_matricula', 'transporte', 'distancia'],
};

const lleno = (v) => v !== null && v !== undefined && String(v).trim() !== '';
const pct = (hechos, total) => (total === 0 ? 0 : Math.round((hechos / total) * 100));

export function avanceAnexo1(est) {
  if (!est) return 0;
  let total = 0; let hechos = 0;
  // datos básicos
  for (const v of [est.nombres, est.documento_numero, est.grado, est.fecha_nacimiento]) {
    total += 1; if (lleno(v)) hechos += 1;
  }
  for (const [grupo, claves] of Object.entries(CLAVES_A1)) {
    const obj = est[grupo] || {};
    for (const k of claves) { total += 1; if (lleno(obj[k])) hechos += 1; }
  }
  return pct(hechos, total);
}

// Anexo 2: valoración pedagógica, aspectos generales, al menos un ajuste, y valoraciones por área
export function avanceAnexo2(piar, numAjustes, numAreasValoradas) {
  const c = piar.caracteristicas || {};
  const items = [
    lleno(c.gustos) || lleno(piar.aspectos_generales),
    lleno(c.desempeno) || lleno(piar.valoracion),
    lleno(c.habilidades),
    Number(numAjustes) > 0,
    Number(numAreasValoradas) > 0,
  ];
  return pct(items.filter(Boolean).length, items.length);
}

// Anexo 3: acta con compromisos y firmas de ambas partes
export function avanceAnexo3(acta) {
  if (!acta) return 0;
  const items = [
    lleno(acta.compromisos_familia),
    lleno(acta.compromisos_institucion),
    !!acta.firmada_familia,
    !!acta.firmada_institucion,
  ];
  return pct(items.filter(Boolean).length, items.length);
}

export function avancePiar({ estudiante, piar, numAjustes, numAreasValoradas, acta }) {
  const anexo1 = avanceAnexo1(estudiante);
  const anexo2 = avanceAnexo2(piar, numAjustes, numAreasValoradas);
  const anexo3 = avanceAnexo3(acta);
  const total = Math.round((anexo1 + anexo2 + anexo3) / 3);
  return { anexo1, anexo2, anexo3, total };
}
