// Escalas de caracterización para la detección en el aula (basadas en las orientaciones del MEN).
// Cada indicador se valora de 1 a 4: 1 "nunca está presente", 4 "siempre está presente".
// Señal de alerta por dominio: si más del 40% de los indicadores puntúan 1 o 2.

export const DOMINIOS = [
  {
    clave: 'intelectual',
    nombre: 'Habilidades intelectuales y de aprendizaje',
    indicadores: [
      'Comprende y sigue instrucciones acordes a su edad',
      'Resuelve problemas cotidianos propios de su edad',
      'Recuerda lo aprendido y lo aplica en nuevas situaciones',
      'Mantiene el ritmo de aprendizaje del grupo',
      'Razona y establece relaciones entre ideas',
    ],
  },
  {
    clave: 'comunicacion',
    nombre: 'Comunicación y lenguaje',
    indicadores: [
      'Se expresa de forma comprensible para su edad',
      'Comprende lo que se le dice',
      'Mantiene una conversación de ida y vuelta',
      'Usa el lenguaje para pedir, contar y preguntar',
      'Articula y pronuncia adecuadamente',
    ],
  },
  {
    clave: 'adaptativa',
    nombre: 'Conducta adaptativa y autonomía',
    indicadores: [
      'Realiza por sí mismo actividades de autocuidado (comer, vestirse, higiene)',
      'Se maneja con autonomía en los espacios escolares',
      'Cumple normas y rutinas del aula',
      'Pide ayuda cuando la necesita',
      'Cuida sus pertenencias y materiales',
    ],
  },
  {
    clave: 'social',
    nombre: 'Interacción social y emocional',
    indicadores: [
      'Se relaciona con sus compañeros',
      'Participa en juegos y trabajos en grupo',
      'Reconoce y expresa sus emociones de forma adecuada',
      'Responde al contacto visual y a los gestos',
      'Muestra interés por compartir con otros',
    ],
  },
  {
    clave: 'sensorial',
    nombre: 'Funcionamiento sensorial (visión y audición)',
    indicadores: [
      'Reacciona a sonidos y voces a distintas distancias',
      'Ve con claridad el tablero y los materiales',
      'Sigue con la mirada objetos y personas',
      'No requiere acercarse en exceso para ver o escuchar',
      'Responde cuando se le llama sin necesidad de contacto físico',
    ],
  },
  {
    clave: 'motor',
    nombre: 'Motricidad y movimiento',
    indicadores: [
      'Se desplaza con autonomía por la institución',
      'Controla el movimiento de manos para escribir o manipular',
      'Mantiene el equilibrio y la postura',
      'Coordina movimientos en actividades físicas',
      'Maneja útiles escolares (lápiz, tijeras) acorde a su edad',
    ],
  },
  {
    clave: 'atencion',
    nombre: 'Atención y autorregulación',
    indicadores: [
      'Mantiene la atención en las tareas el tiempo esperado',
      'Termina lo que empieza',
      'Controla sus impulsos y espera su turno',
      'Permanece en su puesto cuando la actividad lo requiere',
      'Se organiza con sus tareas y tiempos',
    ],
  },
];

// Calcula los dominios en alerta: >40% de indicadores en 1 o 2.
export function calcularAlertas(respuestas) {
  const alerta = [];
  for (const d of DOMINIOS) {
    const vals = d.indicadores.map((_, i) => respuestas?.[d.clave]?.[i]).filter((v) => v >= 1 && v <= 4);
    if (vals.length === 0) continue;
    const bajos = vals.filter((v) => v <= 2).length;
    if (bajos / vals.length > 0.4) alerta.push(d.clave);
  }
  return alerta;
}

export const NIVELES = [
  { v: 1, t: '1 · Nunca' }, { v: 2, t: '2 · A veces' }, { v: 3, t: '3 · Casi siempre' }, { v: 4, t: '4 · Siempre' },
];
