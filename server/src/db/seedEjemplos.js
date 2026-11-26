// Siembra de 6 estudiantes de ejemplo con información COMPLETA en los 4 anexos
// (corre una sola vez, marcada en _seed_marca). No borra datos reales: solo completa
// los estudiantes de ejemplo (documentos 1098765001–006) y quita nombres personales
// usados en pruebas. Fotos tipo documento en server/db/fotos.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const DIR_FOTOS = path.resolve(aqui, '../../db/fotos');
const dataUrl = (f) => `data:image/jpeg;base64,${fs.readFileSync(path.join(DIR_FOTOS, f)).toString('base64')}`;
const ANIO = '2026';

// 6 perfiles completos y coherentes con la discapacidad.
const EJEMPLOS = [
  {
    doc: '1098765001', foto: 'ej1.jpg', nombre: 'Valentina Ríos Mejía', sexo: 'Femenino', grado: '10', nac: '2009-05-14', edad: '16',
    discapacidad: 'Discapacidad visual',
    identificacion: {
      fecha_diligenciamiento: '2026-02-05', lugar_diligenciamiento: 'Floridablanca', nombre_diligencia: 'María Eugenia Ardila', rol_diligencia: 'Docente de apoyo (SE)',
      sede: 'Sede A', jornada: 'Mañana', grado_ingreso: '10', lugar_nacimiento: 'Bucaramanga', departamento_vive: 'Santander', municipio_vive: 'Floridablanca',
      direccion: 'Calle 9 # 4-21', barrio: 'La Cumbre', telefono: '3155526701', correo: 'valentina.rios@correo.com',
      centro_proteccion: 'No', grupo_etnico: 'No pertenece', victima_conflicto: 'No',
    },
    entorno_salud: {
      afiliacion: 'Sí', eps: 'Nueva EPS', regimen: 'Subsidiado', lugar_atencion: 'Hospital local de Floridablanca',
      atendido_salud: 'Sí, control anual con oftalmología', diagnostico: 'Baja visión por retinopatía',
      terapias: 'Sí, estimulación visual y orientación y movilidad', tratamiento: 'Control oftalmológico periódico',
      medicamentos: 'No consume medicamentos de forma permanente', productos_apoyo: 'Lupa electrónica, atril y textos en macrotipo',
    },
    entorno_hogar: {
      nombre_madre: 'Luz Mejía', ocupacion_madre: 'Comerciante', nivel_madre: 'Bachiller', nombre_padre: 'Jorge Ríos', ocupacion_padre: 'Conductor', nivel_padre: 'Bachiller',
      num_hermanos: '1', lugar_ocupa: 'Mayor', personas_vive: 'Madre, padre y un hermano', apoyan_crianza: 'Los padres', bajo_proteccion: 'No', subsidio: 'Familias en Acción',
    },
    entorno_educativo: {
      vinculado_otra_ie: 'No', ultimo_grado: '9', aprobo: 'Sí', recibe_informe: 'Sí, de la misma institución',
      observaciones: 'Continúa en la institución; buen desempeño con apoyos visuales.', programas_complementarios: 'No',
      ie_matricula: 'Institución Educativa San Bernardo', sede_matricula: 'Sede A', transporte: 'Transporte público', distancia: '20 minutos',
    },
    entorno_personal: { descripcion: 'Le gusta la lectura y la música; es organizada y constante.', comunicacion: 'Verbal fluida', movilidad: 'Autónoma con bastón en espacios nuevos', autonomia: 'Alta' },
    piar: {
      director_grupo: 'Carolina Suárez', fecha_elaboracion: '2026-02-10', docentes_elabora: 'Carolina Suárez (Lengua Castellana), docente de apoyo',
      gustos: 'Disfruta la lectura en audio, la música y escribir cuentos. Le incomoda el deslumbramiento y los textos pequeños.',
      desempeno: 'Participa activamente; requiere textos ampliados y tiempo adicional en lectura.',
      habilidades: 'Excelente memoria auditiva, comprensión lectora alta y buena expresión oral.',
      valoracion: 'Estudiante con baja visión que accede al currículo con ampliación de material y apoyos tiflológicos.',
      pmi: 'Garantizar material en macrotipo y digital accesible; mejorar la iluminación de las aulas y señalización de alto contraste.',
    },
    ajustes: [
      { area: 'Humanidades', objetivo: 'Comprender y producir textos del grado con apoyos para la lectura.', barrera: 'No distingue textos en tamaño normal.', tipo: 'materiales', descripcion: 'Entregar textos en macrotipo (18–24 pt) y en formato digital con lector de pantalla.', apoyo: 'Material ampliado', intensidad: 'extenso', evaluacion: 'Lee con lupa electrónica; mejora con material ampliado.', desempeno: 'Alto' },
      { area: 'Matemáticas', objetivo: 'Resolver situaciones del grado con material accesible.', barrera: 'No ve las cifras del tablero.', tipo: 'actividades', descripcion: 'Ubicarla en primera fila, leer en voz alta los enunciados y usar alto contraste.', apoyo: 'Lectura en voz alta', intensidad: 'intermitente', evaluacion: 'Responde bien con enunciados leídos.', desempeno: 'Básico' },
    ],
    acta: {
      compromisos_familia: 'Acompañar las tareas en casa, asegurar el uso de la lupa y asistir a los controles oftalmológicos.',
      compromisos_institucion: 'Entregar material accesible, ubicar a la estudiante en primera fila y dar tiempo adicional en evaluaciones.',
      actividades_casa: 'Lectura diaria en audio y repaso con textos ampliados.',
      nombres_directivos: 'Rectoría y coordinación académica', fecha_firma: '2026-02-12',
      familia: [{ nombre: 'Luz Mejía', parentesco: 'Madre' }, { nombre: 'Jorge Ríos', parentesco: 'Padre' }],
      actividades: [{ actividad: 'Lectura en audio', estrategia: 'Audiolibros del plan lector', frecuencia: 'Diaria' }],
    },
    anexo4: { logros: 'Avanzó en comprensión lectora y en el uso autónomo de la lupa electrónica.', recomendaciones: 'Mantener textos en macrotipo y continuar con orientación y movilidad.', grado_destino: '11', institucion_destino: 'Misma institución', apoyos_transicion: 'Material accesible y ubicación preferencial.', observaciones: 'Transición sin novedad.' },
    promocion: { decision: 'promovido', grado_siguiente: '11', criterios: 'Cumple los logros del grado con ajustes razonables.', observaciones: 'Continúa con el PIAR el próximo año.' },
  },
  {
    doc: '1098765002', foto: 'ej2.jpg', nombre: 'Samuel Herrera Ortiz', sexo: 'Masculino', grado: '8', nac: '2011-08-03', edad: '14',
    discapacidad: 'Discapacidad auditiva',
    identificacion: {
      fecha_diligenciamiento: '2026-02-06', lugar_diligenciamiento: 'Floridablanca', nombre_diligencia: 'María Eugenia Ardila', rol_diligencia: 'Docente de apoyo (SE)',
      sede: 'Sede A', jornada: 'Mañana', grado_ingreso: '8', lugar_nacimiento: 'Floridablanca', departamento_vive: 'Santander', municipio_vive: 'Floridablanca',
      direccion: 'Carrera 7 # 12-30', barrio: 'El Carmen', telefono: '3155526702', correo: 'samuel.herrera@correo.com',
      centro_proteccion: 'No', grupo_etnico: 'No pertenece', victima_conflicto: 'No',
    },
    entorno_salud: {
      afiliacion: 'Sí', eps: 'Sanitas', regimen: 'Contributivo', lugar_atencion: 'Clínica de Bucaramanga',
      atendido_salud: 'Sí, control con audiología', diagnostico: 'Hipoacusia neurosensorial bilateral',
      terapias: 'Sí, fonoaudiología y apoyo en LSC', tratamiento: 'Uso de audífonos', medicamentos: 'No', productos_apoyo: 'Audífonos y sistema FM en el aula',
    },
    entorno_hogar: {
      nombre_madre: 'Diana Ortiz', ocupacion_madre: 'Auxiliar contable', nivel_madre: 'Técnico', nombre_padre: 'Luis Herrera', ocupacion_padre: 'Mecánico', nivel_padre: 'Bachiller',
      num_hermanos: '2', lugar_ocupa: 'Segundo', personas_vive: 'Padres y dos hermanos', apoyan_crianza: 'Los padres y la abuela', bajo_proteccion: 'No', subsidio: 'No',
    },
    entorno_educativo: {
      vinculado_otra_ie: 'Sí, estuvo en una fundación de apoyo auditivo', ultimo_grado: '7', aprobo: 'Sí', recibe_informe: 'Sí',
      observaciones: 'Usa español escrito como segunda lengua; LSC en apoyo.', programas_complementarios: 'Sí, club de lectura',
      ie_matricula: 'Institución Educativa San Bernardo', sede_matricula: 'Sede A', transporte: 'A pie', distancia: '10 minutos',
    },
    entorno_personal: { descripcion: 'Le gusta el dibujo y el fútbol; es atento y colaborador.', comunicacion: 'LSC y español escrito; oral con apoyo de audífonos', movilidad: 'Autónoma', autonomia: 'Alta' },
    piar: {
      director_grupo: 'Andrés Gómez', fecha_elaboracion: '2026-02-11', docentes_elabora: 'Andrés Gómez (Ciencias), intérprete de LSC',
      gustos: 'Disfruta el dibujo, el deporte y las actividades visuales. Se le dificultan las explicaciones solo orales.',
      desempeno: 'Comprende mejor con apoyos visuales y textos; participa con intérprete.',
      habilidades: 'Buena memoria visual, creatividad y trabajo en equipo.',
      valoracion: 'Estudiante con hipoacusia que accede al currículo con apoyos visuales, intérprete de LSC y español escrito.',
      pmi: 'Capacitar a docentes en estrategias para estudiantes sordos; asegurar material visual y subtítulos en los videos.',
    },
    ajustes: [
      { area: 'Ciencias Naturales', objetivo: 'Comprender los contenidos del grado con apoyos visuales.', barrera: 'No accede a las explicaciones orales largas.', tipo: 'comunicacion', descripcion: 'Usar apoyos visuales, pictogramas, videos con subtítulos y resúmenes escritos.', apoyo: 'Material visual', intensidad: 'extenso', evaluacion: 'Comprende mejor con esquemas e imágenes.', desempeno: 'Alto' },
      { area: 'Humanidades', objetivo: 'Fortalecer el español escrito como segunda lengua.', barrera: 'Dificultad con dictados orales.', tipo: 'materiales', descripcion: 'Evitar dictados; trabajar lectura guiada, glosarios visuales y LSC de apoyo.', apoyo: 'Español escrito', intensidad: 'extenso', evaluacion: 'Avanza con glosarios visuales.', desempeno: 'Básico' },
    ],
    acta: {
      compromisos_familia: 'Verificar el uso de los audífonos, reforzar el vocabulario en casa y asistir a fonoaudiología.',
      compromisos_institucion: 'Garantizar intérprete de LSC, material visual y ubicación de frente con buena iluminación.',
      actividades_casa: 'Lectura compartida y práctica de LSC en familia.',
      nombres_directivos: 'Coordinación académica y docente de apoyo', fecha_firma: '2026-02-13',
      familia: [{ nombre: 'Diana Ortiz', parentesco: 'Madre' }, { nombre: 'Luis Herrera', parentesco: 'Padre' }],
      actividades: [{ actividad: 'Práctica de LSC', estrategia: 'Juegos de señas en familia', frecuencia: 'Semanal' }],
    },
    anexo4: { logros: 'Mejoró su comprensión lectora y la participación con intérprete.', recomendaciones: 'Mantener apoyos visuales e intérprete; continuar fonoaudiología.', grado_destino: '9', institucion_destino: 'Misma institución', apoyos_transicion: 'Intérprete de LSC y material visual.', observaciones: 'Transición favorable.' },
    promocion: { decision: 'promovido', grado_siguiente: '9', criterios: 'Alcanza los logros con ajustes razonables.', observaciones: 'Requiere continuidad del intérprete.' },
  },
  {
    doc: '1098765003', foto: 'ej3.jpg', nombre: 'Isabela Moreno Castro', sexo: 'Femenino', grado: '9', nac: '2010-11-20', edad: '15',
    discapacidad: 'Discapacidad intelectual',
    identificacion: {
      fecha_diligenciamiento: '2026-02-06', lugar_diligenciamiento: 'Floridablanca', nombre_diligencia: 'María Eugenia Ardila', rol_diligencia: 'Docente de apoyo (SE)',
      sede: 'Sede A', jornada: 'Mañana', grado_ingreso: '9', lugar_nacimiento: 'Girón', departamento_vive: 'Santander', municipio_vive: 'Girón',
      direccion: 'Calle 30 # 25-10', barrio: 'Villamil', telefono: '3155526703', correo: 'isabela.moreno@correo.com',
      centro_proteccion: 'No', grupo_etnico: 'No pertenece', victima_conflicto: 'No',
    },
    entorno_salud: {
      afiliacion: 'Sí', eps: 'Coosalud', regimen: 'Subsidiado', lugar_atencion: 'Hospital local',
      atendido_salud: 'Sí, control con neuropediatría', diagnostico: 'Discapacidad intelectual leve',
      terapias: 'Sí, terapia ocupacional y apoyo pedagógico', tratamiento: 'Seguimiento por neurología', medicamentos: 'No', productos_apoyo: 'Material manipulable y apoyos visuales',
    },
    entorno_hogar: {
      nombre_madre: 'Marta Castro', ocupacion_madre: 'Ama de casa', nivel_madre: 'Primaria', nombre_padre: 'Pedro Moreno', ocupacion_padre: 'Agricultor', nivel_padre: 'Primaria',
      num_hermanos: '3', lugar_ocupa: 'Tercero', personas_vive: 'Padres y tres hermanos', apoyan_crianza: 'Los padres', bajo_proteccion: 'No', subsidio: 'Familias en Acción',
    },
    entorno_educativo: {
      vinculado_otra_ie: 'No', ultimo_grado: '8', aprobo: 'Sí', recibe_informe: 'Sí',
      observaciones: 'Requiere ajustes significativos y apoyo permanente.', programas_complementarios: 'No',
      ie_matricula: 'Institución Educativa San Bernardo', sede_matricula: 'Sede A', transporte: 'Transporte escolar', distancia: '30 minutos',
    },
    entorno_personal: { descripcion: 'Le gustan las manualidades y la danza; es afectuosa y trabajadora.', comunicacion: 'Verbal sencilla', movilidad: 'Autónoma', autonomia: 'Media, con acompañamiento' },
    piar: {
      director_grupo: 'Luisa Peña', fecha_elaboracion: '2026-02-11', docentes_elabora: 'Luisa Peña (directora de grupo), docente de apoyo',
      gustos: 'Disfruta las artes, la danza y las rutinas claras. Se le dificulta lo abstracto y las tareas largas.',
      desempeno: 'Aprende con pasos cortos, material concreto y refuerzo inmediato.',
      habilidades: 'Constante, afectuosa, buena motricidad fina y memoria de rutinas.',
      valoracion: 'Estudiante con discapacidad intelectual leve que requiere flexibilización curricular y apoyos permanentes.',
      pmi: 'Flexibilizar el currículo, diseñar materiales concretos y formar a los docentes en DUA.',
    },
    ajustes: [
      { area: 'Matemáticas', objetivo: 'Usar las operaciones en situaciones cotidianas.', barrera: 'Dificultad para resolver problemas de varios pasos.', tipo: 'actividades', descripcion: 'Material concreto (fichas, dinero), problemas de un paso y más tiempo.', apoyo: 'Guía paso a paso', intensidad: 'generalizado', evaluacion: 'Resuelve con material concreto.', desempeno: 'Básico' },
      { area: 'Humanidades', objetivo: 'Comprender textos cortos con vocabulario funcional.', barrera: 'Se dispersa con textos largos.', tipo: 'materiales', descripcion: 'Lecturas cortas con pictogramas y preguntas literales.', apoyo: 'Apoyos gráficos', intensidad: 'extenso', evaluacion: 'Comprende con pictogramas.', desempeno: 'Básico' },
    ],
    acta: {
      compromisos_familia: 'Reforzar rutinas y tareas sencillas en casa, y asistir a terapia ocupacional.',
      compromisos_institucion: 'Flexibilizar el currículo, usar material concreto y dar refuerzo positivo constante.',
      actividades_casa: 'Rutinas con apoyos visuales y manualidades.',
      nombres_directivos: 'Coordinación y orientación escolar', fecha_firma: '2026-02-13',
      familia: [{ nombre: 'Marta Castro', parentesco: 'Madre' }, { nombre: 'Pedro Moreno', parentesco: 'Padre' }],
      actividades: [{ actividad: 'Rutinas diarias', estrategia: 'Tablero de rutinas con imágenes', frecuencia: 'Diaria' }],
    },
    anexo4: { logros: 'Logró mayor autonomía en rutinas y avances en lectura funcional.', recomendaciones: 'Continuar con material concreto y pasos cortos.', grado_destino: '10', institucion_destino: 'Misma institución', apoyos_transicion: 'Apoyo pedagógico permanente.', observaciones: 'Requiere continuidad de ajustes significativos.' },
    promocion: { decision: 'promovido', grado_siguiente: '10', criterios: 'Promoción con ajustes significativos y logros flexibilizados.', observaciones: 'Acompañamiento permanente.' },
  },
  {
    doc: '1098765004', foto: 'ej4.jpg', nombre: 'Mateo Vargas León', sexo: 'Masculino', grado: '8', nac: '2011-03-09', edad: '14',
    discapacidad: 'Discapacidad física (motora)',
    identificacion: {
      fecha_diligenciamiento: '2026-02-05', lugar_diligenciamiento: 'Floridablanca', nombre_diligencia: 'María Eugenia Ardila', rol_diligencia: 'Docente de apoyo (SE)',
      sede: 'Sede A', jornada: 'Mañana', grado_ingreso: '8', lugar_nacimiento: 'Bucaramanga', departamento_vive: 'Santander', municipio_vive: 'Floridablanca',
      direccion: 'Carrera 10 # 5-44', barrio: 'Lagos', telefono: '3155526704', correo: 'mateo.vargas@correo.com',
      centro_proteccion: 'No', grupo_etnico: 'No pertenece', victima_conflicto: 'No',
    },
    entorno_salud: {
      afiliacion: 'Sí', eps: 'Sanitas', regimen: 'Contributivo', lugar_atencion: 'Clínica de Bucaramanga',
      atendido_salud: 'Sí, control con fisiatría', diagnostico: 'Paraplejía; usa silla de ruedas',
      terapias: 'Sí, fisioterapia dos veces por semana', tratamiento: 'Rehabilitación física', medicamentos: 'No', productos_apoyo: 'Silla de ruedas y mesa adaptada',
    },
    entorno_hogar: {
      nombre_madre: 'Sandra León', ocupacion_madre: 'Enfermera', nivel_madre: 'Profesional', nombre_padre: 'Carlos Vargas', ocupacion_padre: 'Ingeniero', nivel_padre: 'Profesional',
      num_hermanos: '1', lugar_ocupa: 'Mayor', personas_vive: 'Padres y un hermano', apoyan_crianza: 'Los padres', bajo_proteccion: 'No', subsidio: 'No',
    },
    entorno_educativo: {
      vinculado_otra_ie: 'No', ultimo_grado: '7', aprobo: 'Sí', recibe_informe: 'Sí',
      observaciones: 'Requiere accesibilidad física y apoyos para la escritura.', programas_complementarios: 'Sí, club de ajedrez',
      ie_matricula: 'Institución Educativa San Bernardo', sede_matricula: 'Sede A', transporte: 'Vehículo familiar adaptado', distancia: '15 minutos',
    },
    entorno_personal: { descripcion: 'Líder, le gustan las matemáticas y el ajedrez; es autónomo y seguro.', comunicacion: 'Verbal fluida', movilidad: 'Usa silla de ruedas', autonomia: 'Alta' },
    piar: {
      director_grupo: 'Andrés Gómez', fecha_elaboracion: '2026-02-10', docentes_elabora: 'Andrés Gómez (Matemáticas), docente de apoyo',
      gustos: 'Disfruta las matemáticas, el ajedrez y la tecnología. Le afectan las barreras de acceso físico.',
      desempeno: 'Excelente rendimiento; requiere accesibilidad y apoyos para la escritura prolongada.',
      habilidades: 'Razonamiento lógico, liderazgo y autonomía.',
      valoracion: 'Estudiante con discapacidad motora y alto desempeño; las barreras son principalmente de accesibilidad.',
      pmi: 'Asegurar rampas, baños accesibles y mobiliario adaptado; ubicar sus clases en primer piso.',
    },
    ajustes: [
      { area: 'Educación Física', objetivo: 'Participar en las actividades con adaptaciones.', barrera: 'Barreras de acceso físico y en actividades motrices.', tipo: 'espacios', descripcion: 'Adaptar las actividades, asignar roles y garantizar espacios accesibles.', apoyo: 'Actividad adaptada', intensidad: 'intermitente', evaluacion: 'Participa con roles adaptados.', desempeno: 'Alto' },
      { area: 'Matemáticas', objetivo: 'Demostrar el aprendizaje sin barreras de escritura.', barrera: 'Se cansa al escribir mucho a mano.', tipo: 'materiales', descripcion: 'Permitir uso de computador, dar más tiempo y evaluación oral cuando aplique.', apoyo: 'Apoyo tecnológico', intensidad: 'intermitente', evaluacion: 'Rinde mejor con computador.', desempeno: 'Superior' },
    ],
    acta: {
      compromisos_familia: 'Garantizar el traslado, el mantenimiento de la silla y asistir a fisioterapia.',
      compromisos_institucion: 'Asegurar accesibilidad física, mobiliario adaptado y apoyos tecnológicos.',
      actividades_casa: 'Refuerzo con recursos digitales y ejercicios de fisioterapia.',
      nombres_directivos: 'Rectoría y coordinación', fecha_firma: '2026-02-12',
      familia: [{ nombre: 'Sandra León', parentesco: 'Madre' }, { nombre: 'Carlos Vargas', parentesco: 'Padre' }],
      actividades: [{ actividad: 'Ejercicios en casa', estrategia: 'Rutina de fisioterapia', frecuencia: 'Diaria' }],
    },
    anexo4: { logros: 'Mantuvo excelente desempeño y mayor autonomía con apoyos tecnológicos.', recomendaciones: 'Conservar la accesibilidad y el uso de computador.', grado_destino: '9', institucion_destino: 'Misma institución', apoyos_transicion: 'Aulas accesibles y mobiliario adaptado.', observaciones: 'Sin novedad.' },
    promocion: { decision: 'promovido', grado_siguiente: '9', criterios: 'Supera los logros del grado.', observaciones: 'Mantener condiciones de accesibilidad.' },
  },
  {
    doc: '1098765005', foto: 'ej5.jpg', nombre: 'Daniela Jiménez Rojas', sexo: 'Femenino', grado: '9', nac: '2010-06-27', edad: '15',
    discapacidad: 'Trastorno por déficit de atención e hiperactividad (TDAH)',
    identificacion: {
      fecha_diligenciamiento: '2026-02-07', lugar_diligenciamiento: 'Floridablanca', nombre_diligencia: 'María Eugenia Ardila', rol_diligencia: 'Docente de apoyo (SE)',
      sede: 'Sede A', jornada: 'Mañana', grado_ingreso: '9', lugar_nacimiento: 'Floridablanca', departamento_vive: 'Santander', municipio_vive: 'Floridablanca',
      direccion: 'Calle 20 # 8-15', barrio: 'Cañaveral', telefono: '3155526705', correo: 'daniela.jimenez@correo.com',
      centro_proteccion: 'No', grupo_etnico: 'No pertenece', victima_conflicto: 'No',
    },
    entorno_salud: {
      afiliacion: 'Sí', eps: 'Nueva EPS', regimen: 'Contributivo', lugar_atencion: 'Centro médico de Cañaveral',
      atendido_salud: 'Sí, control con psiquiatría infantil', diagnostico: 'TDAH tipo combinado',
      terapias: 'Sí, terapia conductual y apoyo psicológico', tratamiento: 'Seguimiento por psiquiatría', medicamentos: 'Sí, según indicación médica (horario de la mañana)', productos_apoyo: 'Agenda visual y temporizador',
    },
    entorno_hogar: {
      nombre_madre: 'Patricia Rojas', ocupacion_madre: 'Docente', nivel_madre: 'Profesional', nombre_padre: 'Óscar Jiménez', ocupacion_padre: 'Comerciante', nivel_padre: 'Bachiller',
      num_hermanos: '1', lugar_ocupa: 'Menor', personas_vive: 'Madre y un hermano', apoyan_crianza: 'Madre y abuelos', bajo_proteccion: 'No', subsidio: 'No',
    },
    entorno_educativo: {
      vinculado_otra_ie: 'No', ultimo_grado: '8', aprobo: 'Sí', recibe_informe: 'Sí',
      observaciones: 'Requiere apoyos para la atención y la autorregulación.', programas_complementarios: 'Sí, deporte (voleibol)',
      ie_matricula: 'Institución Educativa San Bernardo', sede_matricula: 'Sede A', transporte: 'A pie', distancia: '8 minutos',
    },
    entorno_personal: { descripcion: 'Creativa y sociable; le gusta el deporte. Se distrae con facilidad.', comunicacion: 'Verbal fluida', movilidad: 'Autónoma', autonomia: 'Alta' },
    piar: {
      director_grupo: 'Luisa Peña', fecha_elaboracion: '2026-02-12', docentes_elabora: 'Luisa Peña (directora de grupo), orientación escolar',
      gustos: 'Disfruta el deporte y el arte. Se le dificulta mantener la atención en tareas largas.',
      desempeno: 'Buen potencial; mejora con tareas fragmentadas y pausas activas.',
      habilidades: 'Creatividad, liderazgo y energía para el trabajo práctico.',
      valoracion: 'Estudiante con TDAH que requiere ajustes en la organización de tareas y en el manejo del tiempo.',
      pmi: 'Formar a los docentes en estrategias de atención y autorregulación; permitir pausas activas y rutinas claras.',
    },
    ajustes: [
      { area: 'Humanidades', objetivo: 'Completar las tareas del grado con apoyos de organización.', barrera: 'Dificultad para mantener la atención en tareas largas.', tipo: 'actividades', descripcion: 'Fragmentar las tareas en pasos cortos, dar instrucciones una a la vez y usar temporizador.', apoyo: 'Agenda visual', intensidad: 'intermitente', evaluacion: 'Termina más tareas con pasos cortos.', desempeno: 'Alto' },
      { area: 'Matemáticas', objetivo: 'Sostener la atención durante la clase.', barrera: 'Se distrae con estímulos del entorno.', tipo: 'espacios', descripcion: 'Ubicarla lejos de distractores, permitir pausas activas y reforzar los logros de inmediato.', apoyo: 'Pausas activas', intensidad: 'intermitente', evaluacion: 'Mejora con pausas y refuerzo.', desempeno: 'Básico' },
    ],
    acta: {
      compromisos_familia: 'Apoyar rutinas y horarios en casa, supervisar el tratamiento y mantener comunicación con el colegio.',
      compromisos_institucion: 'Fragmentar tareas, permitir pausas activas y dar refuerzo positivo.',
      actividades_casa: 'Horario de estudio con descansos y agenda visual.',
      nombres_directivos: 'Orientación escolar y coordinación', fecha_firma: '2026-02-14',
      familia: [{ nombre: 'Patricia Rojas', parentesco: 'Madre' }],
      actividades: [{ actividad: 'Agenda de tareas', estrategia: 'Planificador con pasos cortos', frecuencia: 'Diaria' }],
    },
    anexo4: { logros: 'Mejoró la organización y la finalización de tareas.', recomendaciones: 'Continuar con tareas fragmentadas y pausas activas.', grado_destino: '10', institucion_destino: 'Misma institución', apoyos_transicion: 'Estrategias de atención y autorregulación.', observaciones: 'Favorable.' },
    promocion: { decision: 'promovido', grado_siguiente: '10', criterios: 'Alcanza los logros con ajustes en la organización.', observaciones: 'Mantener acompañamiento.' },
  },
  {
    doc: '1098765006', foto: 'ej6.jpg', nombre: 'Sebastián Niño Parra', sexo: 'Masculino', grado: '11', nac: '2008-09-15', edad: '17',
    discapacidad: 'Trastorno del espectro autista (TEA)',
    identificacion: {
      fecha_diligenciamiento: '2026-02-07', lugar_diligenciamiento: 'Floridablanca', nombre_diligencia: 'María Eugenia Ardila', rol_diligencia: 'Docente de apoyo (SE)',
      sede: 'Sede A', jornada: 'Mañana', grado_ingreso: '11', lugar_nacimiento: 'Bucaramanga', departamento_vive: 'Santander', municipio_vive: 'Floridablanca',
      direccion: 'Carrera 15 # 40-12', barrio: 'La Floresta', telefono: '3155526706', correo: 'sebastian.nino@correo.com',
      centro_proteccion: 'No', grupo_etnico: 'No pertenece', victima_conflicto: 'No',
    },
    entorno_salud: {
      afiliacion: 'Sí', eps: 'Sanitas', regimen: 'Contributivo', lugar_atencion: 'Clínica de Bucaramanga',
      atendido_salud: 'Sí, control con neurología y psicología', diagnostico: 'Trastorno del espectro autista (nivel 1)',
      terapias: 'Sí, terapia ocupacional y manejo de habilidades sociales', tratamiento: 'Seguimiento interdisciplinario', medicamentos: 'No', productos_apoyo: 'Agenda visual, audífonos de reducción de ruido y anticipadores',
    },
    entorno_hogar: {
      nombre_madre: 'Claudia Parra', ocupacion_madre: 'Contadora', nivel_madre: 'Profesional', nombre_padre: 'Hernán Niño', ocupacion_padre: 'Docente', nivel_padre: 'Profesional',
      num_hermanos: '0', lugar_ocupa: 'Único', personas_vive: 'Padres', apoyan_crianza: 'Los padres', bajo_proteccion: 'No', subsidio: 'No',
    },
    entorno_educativo: {
      vinculado_otra_ie: 'No', ultimo_grado: '10', aprobo: 'Sí', recibe_informe: 'Sí',
      observaciones: 'Requiere anticipación, rutinas claras y manejo sensorial.', programas_complementarios: 'Sí, semillero de informática',
      ie_matricula: 'Institución Educativa San Bernardo', sede_matricula: 'Sede A', transporte: 'Vehículo familiar', distancia: '18 minutos',
    },
    entorno_personal: { descripcion: 'Muy interesado en la informática y los números; prefiere rutinas y ambientes tranquilos.', comunicacion: 'Verbal; literal', movilidad: 'Autónoma', autonomia: 'Alta con anticipación de cambios' },
    piar: {
      director_grupo: 'Carolina Suárez', fecha_elaboracion: '2026-02-12', docentes_elabora: 'Carolina Suárez (Informática), orientación escolar',
      gustos: 'Le apasiona la programación y las matemáticas. Le afectan el ruido y los cambios imprevistos.',
      desempeno: 'Alto desempeño académico; requiere anticipación y manejo sensorial.',
      habilidades: 'Pensamiento lógico, memoria y concentración en temas de interés.',
      valoracion: 'Estudiante con TEA nivel 1, alto desempeño; las barreras son sociales y sensoriales.',
      pmi: 'Formar a los docentes en TEA, anticipar los cambios de rutina y disponer de un espacio de regulación sensorial.',
    },
    ajustes: [
      { area: 'Ciencias Sociales', objetivo: 'Participar en trabajos con pautas sociales claras.', barrera: 'Dificultad en la interacción social y el trabajo en grupo.', tipo: 'apoyos_humanos', descripcion: 'Dar roles definidos, guiones sociales y acompañamiento para el trabajo en equipo.', apoyo: 'Guion social', intensidad: 'intermitente', evaluacion: 'Participa con roles claros.', desempeno: 'Alto' },
      { area: 'Matemáticas', objetivo: 'Sostener el aprendizaje en un ambiente regulado.', barrera: 'Barreras sensoriales con el ruido y los cambios imprevistos.', tipo: 'espacios', descripcion: 'Anticipar los cambios con agenda visual, permitir audífonos y un espacio de calma.', apoyo: 'Anticipación', intensidad: 'intermitente', evaluacion: 'Mejor desempeño con anticipación.', desempeno: 'Superior' },
    ],
    acta: {
      compromisos_familia: 'Mantener rutinas, anticipar cambios y asistir a las terapias.',
      compromisos_institucion: 'Anticipar cambios, usar agenda visual y disponer de un espacio de regulación.',
      actividades_casa: 'Anticipación de la agenda del día siguiente y actividades de interés.',
      nombres_directivos: 'Orientación escolar y coordinación', fecha_firma: '2026-02-14',
      familia: [{ nombre: 'Claudia Parra', parentesco: 'Madre' }, { nombre: 'Hernán Niño', parentesco: 'Padre' }],
      actividades: [{ actividad: 'Agenda anticipada', estrategia: 'Repaso visual de la rutina', frecuencia: 'Diaria' }],
    },
    anexo4: { logros: 'Mantuvo alto desempeño y mejoró la participación en grupo.', recomendaciones: 'Continuar con anticipación y manejo sensorial; orientar la transición a la educación superior.', grado_destino: 'Egresado', institucion_destino: 'Educación superior (tecnología en sistemas)', apoyos_transicion: 'Orientación vocacional y anticipación de cambios.', observaciones: 'Candidato a titularse.' },
    promocion: { decision: 'titulado', grado_siguiente: 'Egresado', criterios: 'Cumple los logros de la media; apto para graduarse.', observaciones: 'Orientar la transición a la educación superior.' },
  },
];

const PMI_POR_ACTOR = (e) => ({
  familia: { acciones: 'Acompañar el proceso en casa y asistir a las citas y terapias.', estrategias: 'Rutinas, refuerzo positivo y comunicación constante con el colegio.' },
  docentes: { acciones: 'Aplicar los ajustes razonables y hacer seguimiento.', estrategias: 'Diseño Universal del Aprendizaje (DUA) y flexibilización según la barrera.' },
  directivos: { acciones: 'Garantizar las condiciones y los recursos para los ajustes.', estrategias: 'Accesibilidad, horarios y asignación de apoyos.' },
  administrativos: { acciones: 'Facilitar materiales, transporte y trámites de apoyo.', estrategias: 'Gestión oportuna de recursos y convenios.' },
  pares: { acciones: 'Favorecer la inclusión y el trabajo colaborativo.', estrategias: 'Sensibilización, parejas de apoyo y respeto a la diversidad.' },
});

async function areaId(instId, nombreLike) {
  const r = await pool.query('SELECT id FROM area WHERE institucion_id=$1 AND nombre LIKE $2 ORDER BY id LIMIT 1', [instId, `${nombreLike}%`]);
  return r.rows[0]?.id || null;
}

export async function seedEjemplos() {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS _seed_marca (clave TEXT PRIMARY KEY, aplicado_en TIMESTAMPTZ NOT NULL DEFAULT now())');
    const inst = await pool.query('SELECT id FROM institucion ORDER BY id LIMIT 1');
    if (!inst.rowCount) return;
    const instId = inst.rows[0].id;

    const yaV2 = await pool.query("SELECT 1 FROM _seed_marca WHERE clave = 'ejemplos_completos_v2'");
    if (!yaV2.rowCount) {
    for (const e of EJEMPLOS) {
      const foto = dataUrl(e.foto);
      const identificacion = { ...e.identificacion, edad: e.edad, sexo: e.sexo };
      const entornoSalud = { ...e.entorno_salud, discapacidad: e.discapacidad };

      // 1) Estudiante (Anexo 1 completo)
      const ex = await pool.query('SELECT id FROM estudiante WHERE institucion_id=$1 AND documento_numero=$2', [instId, e.doc]);
      let estId;
      if (ex.rowCount) {
        estId = ex.rows[0].id;
        await pool.query(
          `UPDATE estudiante SET nombres=$1, grado=$2, fecha_nacimiento=$3, foto=$4,
             identificacion=$5::jsonb, entorno_salud=$6::jsonb, entorno_hogar=$7::jsonb,
             entorno_educativo=$8::jsonb, entorno_personal=$9::jsonb WHERE id=$10`,
          [e.nombre, e.grado, e.nac, foto, JSON.stringify(identificacion), JSON.stringify(entornoSalud),
           JSON.stringify(e.entorno_hogar), JSON.stringify(e.entorno_educativo), JSON.stringify(e.entorno_personal), estId]
        );
      } else {
        const ins = await pool.query(
          `INSERT INTO estudiante (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, foto,
             identificacion, entorno_salud, entorno_hogar, entorno_educativo, entorno_personal)
           VALUES ($1,'TI',$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb) RETURNING id`,
          [instId, e.doc, e.nombre, e.nac, e.grado, foto, JSON.stringify(identificacion), JSON.stringify(entornoSalud),
           JSON.stringify(e.entorno_hogar), JSON.stringify(e.entorno_educativo), JSON.stringify(e.entorno_personal)]
        );
        estId = ins.rows[0].id;
      }

      // 2) PIAR vigente (Anexo 2): usa el más reciente o crea uno
      const pr = await pool.query('SELECT id FROM piar WHERE estudiante_id=$1 ORDER BY id DESC LIMIT 1', [estId]);
      let piarId;
      if (pr.rowCount) piarId = pr.rows[0].id;
      else {
        const insP = await pool.query(
          `INSERT INTO piar (estudiante_id, periodo, grado, estado) VALUES ($1,$2,$3,'vigente') RETURNING id`,
          [estId, ANIO, e.grado]
        );
        piarId = insP.rows[0].id;
      }
      const carac = { jornada: 'Mañana', docentes_elabora: e.piar.docentes_elabora, gustos: e.piar.gustos, desempeno: e.piar.desempeno, habilidades: e.piar.habilidades };
      await pool.query(
        `UPDATE piar SET estado='vigente', grado=$1, director_grupo=$2, fecha_elaboracion=$3,
           valoracion=$4, aspectos_generales=$5, pmi=$6, caracteristicas=$7::jsonb, recomendaciones_pmi=$8::jsonb,
           actualizado_en=now() WHERE id=$9`,
        [e.grado, e.piar.director_grupo, e.piar.fecha_elaboracion, e.piar.valoracion, e.piar.gustos, e.piar.pmi,
         JSON.stringify(carac), JSON.stringify(PMI_POR_ACTOR(e)), piarId]
      );

      // Ajustes razonables (solo si el PIAR no tiene)
      const nAj = await pool.query('SELECT count(*)::int n FROM ajuste_razonable WHERE piar_id=$1', [piarId]);
      if (nAj.rows[0].n === 0) {
        for (const a of e.ajustes) {
          const aid = await areaId(instId, a.area);
          await pool.query(
            `INSERT INTO ajuste_razonable (piar_id, area_id, periodo, objetivo, barrera, tipo, descripcion, apoyo, intensidad, evaluacion, desempeno)
             VALUES ($1,$2,1,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [piarId, aid, a.objetivo, a.barrera, a.tipo, a.descripcion, a.apoyo, a.intensidad, a.evaluacion, a.desempeno]
          );
        }
      }

      // 3) Acta de acuerdo (Anexo 3)
      const ac = e.acta;
      await pool.query(
        `INSERT INTO acta_acuerdo (piar_id, compromisos_familia, compromisos_institucion, actividades_casa, nombres_directivos, fecha_firma, familia, actividades, firmada_familia, firmada_institucion)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,true,true)
         ON CONFLICT (piar_id) DO UPDATE SET compromisos_familia=EXCLUDED.compromisos_familia,
           compromisos_institucion=EXCLUDED.compromisos_institucion, actividades_casa=EXCLUDED.actividades_casa,
           nombres_directivos=EXCLUDED.nombres_directivos, fecha_firma=EXCLUDED.fecha_firma,
           familia=EXCLUDED.familia, actividades=EXCLUDED.actividades`,
        [piarId, ac.compromisos_familia, ac.compromisos_institucion, ac.actividades_casa, ac.nombres_directivos, ac.fecha_firma,
         JSON.stringify(ac.familia), JSON.stringify(ac.actividades)]
      );

      // 4) Seguimiento y transición (Anexo 4) + promoción
      const a4 = e.anexo4;
      await pool.query(
        `INSERT INTO anexo4 (piar_id, logros, recomendaciones, grado_destino, institucion_destino, apoyos_transicion, observaciones, fecha)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (piar_id) DO UPDATE SET logros=EXCLUDED.logros, recomendaciones=EXCLUDED.recomendaciones,
           grado_destino=EXCLUDED.grado_destino, institucion_destino=EXCLUDED.institucion_destino,
           apoyos_transicion=EXCLUDED.apoyos_transicion, observaciones=EXCLUDED.observaciones, fecha=EXCLUDED.fecha`,
        [piarId, a4.logros, a4.recomendaciones, a4.grado_destino, a4.institucion_destino, a4.apoyos_transicion, a4.observaciones, e.piar.fecha_elaboracion]
      );
      const pm = e.promocion;
      await pool.query(
        `INSERT INTO promocion (piar_id, decision, grado_cursado, grado_siguiente, criterios, observaciones)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (piar_id) DO UPDATE SET decision=EXCLUDED.decision, grado_cursado=EXCLUDED.grado_cursado,
           grado_siguiente=EXCLUDED.grado_siguiente, criterios=EXCLUDED.criterios, observaciones=EXCLUDED.observaciones`,
        [piarId, pm.decision, e.grado, pm.grado_siguiente, pm.criterios, pm.observaciones]
      );
    }

    // Seguridad: quita cualquier nombre personal usado en pruebas.
    await pool.query(
      `UPDATE estudiante SET nombres='Estudiante de ejemplo'
         WHERE nombres ILIKE '%suarez acevedo%' OR nombres ILIKE '%suárez acevedo%'`
    );

    await pool.query("INSERT INTO _seed_marca (clave) VALUES ('ejemplos_completos_v2') ON CONFLICT DO NOTHING");
    console.log('Estudiantes de ejemplo con información completa: aplicado.');
    }

    // Paso aparte: asignar un curso a cada estudiante de ejemplo (para que el
    // responsable del Anexo 2 se deduzca de la carga académica).
    const yaCur = await pool.query("SELECT 1 FROM _seed_marca WHERE clave = 'ejemplos_cursos_v1'");
    if (!yaCur.rowCount) {
      for (const e of EJEMPLOS) {
        const cur = await pool.query(
          `INSERT INTO curso (institucion_id, sede, jornada, grado, grupo)
           VALUES ($1,'Sede A','Mañana',$2,'A')
           ON CONFLICT (institucion_id, sede, jornada, grado, grupo) DO UPDATE SET grado=EXCLUDED.grado
           RETURNING id`,
          [instId, e.grado]
        );
        await pool.query(
          'UPDATE estudiante SET curso_id=$1 WHERE institucion_id=$2 AND documento_numero=$3 AND curso_id IS NULL',
          [cur.rows[0].id, instId, e.doc]
        );
      }
      await pool.query("INSERT INTO _seed_marca (clave) VALUES ('ejemplos_cursos_v1') ON CONFLICT DO NOTHING");
      console.log('Cursos de ejemplo asignados.');
    }
  } catch (e) {
    console.error('No se pudo sembrar los ejemplos completos:', e.message);
  }
}
