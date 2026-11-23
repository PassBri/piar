const SECCIONES = [
  {
    titulo: '¿Qué es el PIAR?',
    parrafos: [
      'El Plan Individual de Ajustes Razonables (PIAR) es la herramienta que establece el Decreto 1421 de 2017 para garantizar el proceso de enseñanza y aprendizaje de cada estudiante con discapacidad, dentro de la educación inclusiva.',
      'Consolida, por estudiante, las barreras que enfrenta para aprender, desarrollarse y participar, y los ajustes razonables (apoyos y estrategias) que la institución, los docentes y la familia acuerdan para eliminarlas o reducirlas.',
    ],
  },
  {
    titulo: 'Educación inclusiva y Diseño Universal para el Aprendizaje (DUA)',
    parrafos: [
      'El PIAR no es un currículo paralelo: es un ajuste a la planeación de aula, de área y de estudios. Los ajustes individuales se aplican después de agotar las posibilidades del Diseño Universal para el Aprendizaje (DUA).',
      'Si el estudiante ya no requiere el PIAR porque las experiencias basadas en el DUA son suficientes, esto se justifica en el PIAR y en el informe anual de competencias.',
    ],
  },
  {
    titulo: 'Los instrumentos del PIAR (anexos)',
    lista: [
      'Anexo 1 — Información general del estudiante: datos personales y los entornos personal, de salud, de hogar y educativo. La información la aporta la familia en la matrícula.',
      'Anexo 2 — Plan Individual de Ajustes Razonables: características del estudiante, y por cada área y periodo, los objetivos, las barreras, los ajustes razonables y su evaluación.',
      'Anexo 3 — Acta de acuerdo: formaliza y recoge los compromisos de la familia y de la institución.',
    ],
  },
  {
    titulo: 'Tipos de ajustes razonables',
    parrafos: ['Los ejemplos del Ministerio son orientativos, no generalizables; dependen de cada estudiante. Se organizan en:'],
    lista: [
      'En las actividades: más tiempo, demostrar la tarea, leer en voz alta, ubicación estratégica, evaluación oral.',
      'En los materiales: alto contraste, macrotipo, material táctil o en relieve, agendas visuales, mobiliario adaptado.',
      'En los espacios: señalización, buena iluminación, contrastes en puertas y ventanas.',
      'En la comunicación: pictogramas, tableros de comunicación, lengua de señas.',
      'Apoyos humanos: intérprete, modelo lingüístico, docente de apoyo, tiflólogo.',
      'Tecnologías: lectores de pantalla, amplificadores de voz o imagen, tabletas.',
    ],
  },
  {
    titulo: 'El seguimiento',
    parrafos: [
      'La implementación de los ajustes debe seguirse al menos tres veces al año, de acuerdo con la periodicidad del Sistema Institucional de Evaluación de los Estudiantes (SIEE). En los colegios que manejan cuatro periodos, el seguimiento se organiza por periodo.',
      'En cada seguimiento se evalúa el impacto del ajuste y se decide mantenerlo, modificarlo o retirarlo, dejando la observación correspondiente.',
    ],
  },
  {
    titulo: 'Pasos para elaborar el PIAR',
    lista: [
      '1. Conocer las orientaciones del Ministerio sobre el PIAR y los formatos.',
      '2. Describir los entornos del estudiante (Anexo 1).',
      '3. Realizar la valoración pedagógica, liderada por el docente de aula.',
      '4. Identificar barreras y definir los ajustes razonables por área y periodo (Anexo 2).',
      '5. Firmar el acta de acuerdo con la familia (Anexo 3).',
      '6. Hacer seguimiento y registrar recomendaciones para el Plan de Mejoramiento Institucional (PMI).',
    ],
  },
];

const DESCARGAS = [
  { nombre: 'Decreto 1421 de 2017', desc: 'Norma que reglamenta la atención educativa a la población con discapacidad.', url: 'https://funcionpublica.gov.co/eva/gestornormativo/norma.php?i=87040' },
  { nombre: 'Guía para la implementación del Decreto 1421', desc: 'Guía del Comité de Discapacidad del Ministerio de Educación Nacional.', url: 'https://escuelasecretarias.dis.eafit.edu.co/sites/default/files/2022-08/GUIAPARALAIMPLEMENTACION.pdf' },
  { nombre: 'Formato PIAR (Anexos 1, 2 y 3)', desc: 'Formato oficial de los instrumentos del PIAR.', url: 'https://www.saldarriagaconcha.org/wp-content/uploads/2019/01/Formato-PIAR.pdf' },
  { nombre: 'Instructivo del PIAR', desc: 'Instrucciones para diligenciar los instrumentos y ejemplos de ajustes razonables.', url: 'https://www.saldarriagaconcha.org/wp-content/uploads/2019/01/Instructivo-PIAR.pdf' },
  { nombre: 'Narrativa del PIAR', desc: 'Explicación y preguntas frecuentes sobre el PIAR.', url: 'https://www.saldarriagaconcha.org/wp-content/uploads/2019/01/Narrativa-PIAR.pdf' },
  { nombre: 'Orientaciones para la gestión escolar inclusiva (MEN)', desc: 'Pautas del Ministerio para la transformación hacia la educación inclusiva.', url: 'https://escuelasecretarias.mineducacion.gov.co/sites/default/files/2022-08/Orientacionesparapromover.pdf' },
  { nombre: 'Orientaciones pedagógicas (portal MEN)', desc: 'Página oficial con los documentos de orientaciones técnicas, pedagógicas y administrativas.', url: 'https://www.mineducacion.gov.co/1780/w3-article-430229.html' },
];

export default function Aprendizaje() {
  return (
    <div>
      <h2 style={{ color: 'var(--gris-700)' }}>Aprendizaje — El PIAR según el Ministerio</h2>
      <p style={{ color: 'var(--gris-600)', fontSize: 14, marginTop: 0 }}>
        Todo lo que necesitas saber para diligenciar el PIAR, con los documentos oficiales
        del Ministerio de Educación Nacional listos para descargar.
      </p>

      {SECCIONES.map((s) => (
        <div className="card" key={s.titulo}>
          <h2>{s.titulo}</h2>
          {s.parrafos && s.parrafos.map((p, i) => (
            <p key={i} style={{ fontSize: 14, color: 'var(--gris-900)', marginTop: i === 0 ? 0 : 10 }}>{p}</p>
          ))}
          {s.lista && (
            <ul style={{ fontSize: 14, color: 'var(--gris-900)', lineHeight: 1.6, marginBottom: 0 }}>
              {s.lista.map((li, i) => <li key={i}>{li}</li>)}
            </ul>
          )}
        </div>
      ))}

      <div className="card">
        <h2>Documentos oficiales para descargar</h2>
        <p style={{ fontSize: 13, color: 'var(--gris-600)', marginTop: 0 }}>
          Enlaces a los documentos del Ministerio de Educación Nacional y aliados. Se abren en una pestaña nueva.
        </p>
        <div className="grid">
          {DESCARGAS.map((d) => (
            <a key={d.nombre} href={d.url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}>
              <div className="card" style={{ margin: 0, height: '100%', borderColor: 'var(--gris-300)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <strong style={{ color: 'var(--gris-700)', fontSize: 14 }}>{d.nombre}</strong>
                  <span className="btn sm" style={{ whiteSpace: 'nowrap' }}>Descargar ↓</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--gris-600)', margin: '8px 0 0' }}>{d.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
