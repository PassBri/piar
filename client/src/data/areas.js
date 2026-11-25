// Áreas por nivel educativo (Colombia).
// Básica y media: áreas obligatorias y fundamentales, Ley 115 de 1994, art. 23.
// Media: agrega filosofía y ciencias económicas y políticas (art. 31) y, en
// media técnica, las áreas propias de la especialidad (Decreto 1075, 2.3.3.1.6.6).
// Preescolar: no va por áreas sino por dimensiones del desarrollo / bases
// curriculares para la educación inicial y DBA de transición.

const AREAS_BASICAS = [
  'Matemáticas',
  'Lengua castellana',
  'Idioma extranjero (Inglés)',
  'Ciencias naturales y educación ambiental',
  'Ciencias sociales, historia, geografía, constitución política y democracia',
  'Educación artística y cultural',
  'Educación ética y en valores humanos',
  'Educación religiosa',
  'Educación física, recreación y deportes',
  'Tecnología e informática',
];

export const NIVELES_AREAS = [
  {
    clave: 'preescolar',
    etiqueta: 'Preescolar',
    nota: 'Dimensiones del desarrollo (educación inicial / DBA de transición).',
    items: [
      'Dimensión corporal',
      'Dimensión comunicativa',
      'Dimensión cognitiva',
      'Dimensión personal-social',
      'Dimensión artística',
      'Dimensión ética, actitudes y valores',
      'Dimensión espiritual',
    ],
  },
  {
    clave: 'primaria',
    etiqueta: 'Básica primaria',
    nota: 'Áreas obligatorias y fundamentales (Ley 115, art. 23).',
    items: AREAS_BASICAS,
  },
  {
    clave: 'secundaria',
    etiqueta: 'Básica secundaria',
    nota: 'Áreas obligatorias y fundamentales (Ley 115, art. 23).',
    items: AREAS_BASICAS,
  },
  {
    clave: 'media',
    etiqueta: 'Media / media técnica',
    nota: 'Áreas de la básica en nivel avanzado + filosofía y ciencias económicas y políticas; en media técnica, las de la especialidad.',
    items: [
      ...AREAS_BASICAS,
      'Física',
      'Química',
      'Filosofía',
      'Ciencias económicas y políticas',
      'Área técnica (especialidad)',
    ],
  },
];
