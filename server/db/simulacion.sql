-- ============================================================
-- PIAR — Simulación: 5 estudiantes de ejemplo con PIAR completo
-- Institución 1 (San Bernardo, Floridablanca)
-- Anexo 1 + valoración + ajustes razonables + seguimientos + valoración por área
-- Seguro de re-ejecutar: no duplica (ON CONFLICT por documento)
-- ============================================================

WITH e AS (
  INSERT INTO estudiante (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, identificacion, entorno_personal, entorno_salud, entorno_hogar)
  SELECT 1, 'TI', '1098765001', 'Mariana Gómez Ruiz', '2015-03-12', '4', '{"sede":"Sede A","jornada":"Mañana","grado_ingreso":"4","lugar_nacimiento":"Floridablanca","sexo":"Femenino","estrato":"2"}'::jsonb, '{"descripcion":"Le gusta dibujar y escuchar cuentos; es muy sociable.","comunicacion":"Verbal fluida","movilidad":"Autónoma","autonomia":"Alta"}'::jsonb, '{"eps":"Nueva EPS","regimen":"Subsidiado","discapacidad":"Visual (baja visión)","terapias":"No"}'::jsonb, '{"con_quien_vive":"Madre y abuela","nombre_madre":"Luz Ruiz","transporte":"A pie"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM estudiante WHERE institucion_id=1 AND documento_numero='1098765001')
  RETURNING id),
p AS (
  INSERT INTO piar (estudiante_id, periodo, valoracion, aspectos_generales, estado)
  SELECT id, '2026', 'Lee con dificultad los textos impresos; buen desempeño oral y participativo.', 'Aprende mejor con material ampliado y explicaciones orales.', 'vigente' FROM e RETURNING id),
a0 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Humanidades%' LIMIT 1), 'Participar y aprender en el aula', 'Dificultad para leer textos en tamaño normal.', 'materiales', 'Entregar textos en macrotipo y permitir uso de lupa.', 'Material ampliado', 'extenso' FROM p RETURNING id),
sa01 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a0 RETURNING ajuste_id),
sa02 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a0 RETURNING ajuste_id),
a1 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Matemáticas%' LIMIT 1), 'Participar y aprender en el aula', 'No distingue cifras pequeñas en el tablero.', 'actividades', 'Ubicarla en primera fila y leer en voz alta los enunciados.', 'Lectura en voz alta', 'limitado' FROM p RETURNING id),
sa11 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a1 RETURNING ajuste_id),
sa12 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a1 RETURNING ajuste_id),
v0 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Humanidades%' LIMIT 1), 1, 'Alto', 'Valoración del primer periodo.' FROM p RETURNING id),
v1 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Matemáticas%' LIMIT 1), 1, 'Básico', 'Valoración del primer periodo.' FROM p RETURNING id)
INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Educación Artística%' LIMIT 1), 1, 'Superior', 'Valoración del primer periodo.' FROM p;;

WITH e AS (
  INSERT INTO estudiante (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, identificacion, entorno_personal, entorno_salud, entorno_hogar)
  SELECT 1, 'TI', '1098765002', 'Santiago Rojas Peña', '2014-07-25', '5', '{"sede":"Sede A","jornada":"Mañana","grado_ingreso":"5","lugar_nacimiento":"Bucaramanga","sexo":"Masculino","estrato":"2"}'::jsonb, '{"descripcion":"Atento y observador; le gusta el fútbol.","comunicacion":"Lengua de señas y lectura labial","movilidad":"Autónoma","autonomia":"Alta"}'::jsonb, '{"eps":"Coosalud","regimen":"Subsidiado","discapacidad":"Auditiva","terapias":"Fonoaudiología"}'::jsonb, '{"con_quien_vive":"Padres","nombre_madre":"Ana Peña","nombre_padre":"Jorge Rojas","transporte":"Bus escolar"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM estudiante WHERE institucion_id=1 AND documento_numero='1098765002')
  RETURNING id),
p AS (
  INSERT INTO piar (estudiante_id, periodo, valoracion, aspectos_generales, estado)
  SELECT id, '2026', 'Comprende mejor con apoyos visuales; requiere intérprete en explicaciones largas.', 'Fuerte en razonamiento lógico y trabajo visual.', 'vigente' FROM e RETURNING id),
a0 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Ciencias Naturales%' LIMIT 1), 'Participar y aprender en el aula', 'No accede a las explicaciones orales largas.', 'comunicacion', 'Usar apoyos visuales, pictogramas y resúmenes escritos.', 'Material visual', 'extenso' FROM p RETURNING id),
sa01 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a0 RETURNING ajuste_id),
sa02 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a0 RETURNING ajuste_id),
a1 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Educación Física%' LIMIT 1), 'Participar y aprender en el aula', 'No escucha las instrucciones a distancia.', 'apoyos_humanos', 'Dar instrucciones de frente y con señas acordadas.', 'Señas de apoyo', 'intermitente' FROM p RETURNING id),
sa11 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a1 RETURNING ajuste_id),
sa12 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a1 RETURNING ajuste_id),
v0 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Ciencias Naturales%' LIMIT 1), 1, 'Alto', 'Valoración del primer periodo.' FROM p RETURNING id),
v1 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Matemáticas%' LIMIT 1), 1, 'Alto', 'Valoración del primer periodo.' FROM p RETURNING id)
INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Humanidades%' LIMIT 1), 1, 'Básico', 'Valoración del primer periodo.' FROM p;;

WITH e AS (
  INSERT INTO estudiante (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, identificacion, entorno_personal, entorno_salud, entorno_hogar)
  SELECT 1, 'TI', '1098765003', 'Valentina Díaz Moreno', '2015-11-03', '4', '{"sede":"Sede A","jornada":"Mañana","grado_ingreso":"4","lugar_nacimiento":"Girón","sexo":"Femenino","estrato":"1"}'::jsonb, '{"descripcion":"Cariñosa y constante; disfruta la música.","comunicacion":"Verbal sencilla","movilidad":"Autónoma","autonomia":"Media"}'::jsonb, '{"eps":"Cajasan","regimen":"Subsidiado","discapacidad":"Intelectual leve","terapias":"Terapia ocupacional"}'::jsonb, '{"con_quien_vive":"Madre","nombre_madre":"Diana Moreno","transporte":"A pie"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM estudiante WHERE institucion_id=1 AND documento_numero='1098765003')
  RETURNING id),
p AS (
  INSERT INTO piar (estudiante_id, periodo, valoracion, aspectos_generales, estado)
  SELECT id, '2026', 'Requiere más tiempo y ejemplos concretos; avanza con apoyo paso a paso.', 'Aprende con rutinas, ejemplos y refuerzo positivo.', 'vigente' FROM e RETURNING id),
a0 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Matemáticas%' LIMIT 1), 'Participar y aprender en el aula', 'Dificultad para resolver problemas de varios pasos.', 'actividades', 'Fraccionar la tarea en pasos y dar más tiempo.', 'Guía paso a paso', 'generalizado' FROM p RETURNING id),
sa01 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a0 RETURNING ajuste_id),
sa02 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a0 RETURNING ajuste_id),
a1 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Humanidades%' LIMIT 1), 'Participar y aprender en el aula', 'Se dispersa con textos largos.', 'materiales', 'Usar agendas visuales y textos cortos con imágenes.', 'Apoyos gráficos', 'extenso' FROM p RETURNING id),
sa11 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a1 RETURNING ajuste_id),
sa12 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a1 RETURNING ajuste_id),
v0 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Matemáticas%' LIMIT 1), 1, 'Bajo', 'Valoración del primer periodo.' FROM p RETURNING id),
v1 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Humanidades%' LIMIT 1), 1, 'Básico', 'Valoración del primer periodo.' FROM p RETURNING id)
INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Educación Artística%' LIMIT 1), 1, 'Alto', 'Valoración del primer periodo.' FROM p;;

WITH e AS (
  INSERT INTO estudiante (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, identificacion, entorno_personal, entorno_salud, entorno_hogar)
  SELECT 1, 'TI', '1098765004', 'Juan David Torres Navas', '2013-02-18', '6', '{"sede":"Sede A","jornada":"Mañana","grado_ingreso":"6","lugar_nacimiento":"Floridablanca","sexo":"Masculino","estrato":"2"}'::jsonb, '{"descripcion":"Líder, le gustan las matemáticas y el ajedrez.","comunicacion":"Verbal fluida","movilidad":"Usa silla de ruedas","autonomia":"Alta","productos_apoyo":"Silla de ruedas"}'::jsonb, '{"eps":"Sanitas","regimen":"Contributivo","discapacidad":"Física (movilidad)","terapias":"Fisioterapia"}'::jsonb, '{"con_quien_vive":"Padres y hermano","nombre_madre":"Sandra Navas","nombre_padre":"Carlos Torres","transporte":"Vehículo familiar"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM estudiante WHERE institucion_id=1 AND documento_numero='1098765004')
  RETURNING id),
p AS (
  INSERT INTO piar (estudiante_id, periodo, valoracion, aspectos_generales, estado)
  SELECT id, '2026', 'Alto rendimiento académico; requiere accesibilidad física en el aula.', 'Autónomo e independiente; necesita espacios accesibles.', 'vigente' FROM e RETURNING id),
a0 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Educación Física%' LIMIT 1), 'Participar y aprender en el aula', 'No puede realizar las actividades físicas convencionales.', 'actividades', 'Adaptar las actividades a juegos de mesa y roles de arbitraje.', 'Actividades adaptadas', 'generalizado' FROM p RETURNING id),
sa01 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a0 RETURNING ajuste_id),
sa02 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a0 RETURNING ajuste_id),
a1 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Tecnología%' LIMIT 1), 'Participar y aprender en el aula', 'Mobiliario no accesible para la silla de ruedas.', 'espacios', 'Garantizar mesa a la altura adecuada y rutas despejadas.', 'Mobiliario accesible', 'extenso' FROM p RETURNING id),
sa11 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a1 RETURNING ajuste_id),
sa12 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a1 RETURNING ajuste_id),
v0 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Matemáticas%' LIMIT 1), 1, 'Superior', 'Valoración del primer periodo.' FROM p RETURNING id),
v1 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Tecnología%' LIMIT 1), 1, 'Superior', 'Valoración del primer periodo.' FROM p RETURNING id)
INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Educación Física%' LIMIT 1), 1, 'Básico', 'Valoración del primer periodo.' FROM p;;

WITH e AS (
  INSERT INTO estudiante (institucion_id, documento_tipo, documento_numero, nombres, fecha_nacimiento, grado, identificacion, entorno_personal, entorno_salud, entorno_hogar)
  SELECT 1, 'TI', '1098765005', 'Sofía Martínez León', '2014-09-30', '5', '{"sede":"Sede A","jornada":"Mañana","grado_ingreso":"5","lugar_nacimiento":"Piedecuesta","sexo":"Femenino","estrato":"2"}'::jsonb, '{"descripcion":"Creativa y enérgica; le encanta la pintura.","comunicacion":"Verbal fluida","movilidad":"Autónoma","autonomia":"Alta"}'::jsonb, '{"eps":"Famisanar","regimen":"Contributivo","discapacidad":"TDAH","terapias":"Psicología"}'::jsonb, '{"con_quien_vive":"Madre","nombre_madre":"Paola León","transporte":"Bus escolar"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM estudiante WHERE institucion_id=1 AND documento_numero='1098765005')
  RETURNING id),
p AS (
  INSERT INTO piar (estudiante_id, periodo, valoracion, aspectos_generales, estado)
  SELECT id, '2026', 'Se concentra por periodos cortos; responde bien a tareas breves y pausas.', 'Muy creativa; rinde con tareas cortas y rutinas claras.', 'vigente' FROM e RETURNING id),
a0 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Humanidades%' LIMIT 1), 'Participar y aprender en el aula', 'Dificultad para mantener la atención en tareas largas.', 'actividades', 'Dividir las tareas en bloques cortos con pausas activas.', 'Tareas breves', 'extenso' FROM p RETURNING id),
sa01 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a0 RETURNING ajuste_id),
sa02 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a0 RETURNING ajuste_id),
a1 AS (
  INSERT INTO ajuste_razonable (piar_id, area_id, objetivo, barrera, tipo, descripcion, apoyo, intensidad)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Ciencias Sociales%' LIMIT 1), 'Participar y aprender en el aula', 'Se distrae con estímulos del entorno.', 'actividades', 'Ubicarla lejos de ventanas y usar una agenda visual del día.', 'Agenda visual', 'limitado' FROM p RETURNING id),
sa11 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-03-20', '1', 'El ajuste favorece la participación del estudiante.', 'mantener' FROM a1 RETURNING ajuste_id),
sa12 AS (
  INSERT INTO seguimiento (ajuste_id, fecha, periodo, impacto, decision)
  SELECT id, '2026-06-18', '2', 'Se evidencia avance; se mantiene el ajuste.', 'mantener' FROM a1 RETURNING ajuste_id),
v0 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Humanidades%' LIMIT 1), 1, 'Básico', 'Valoración del primer periodo.' FROM p RETURNING id),
v1 AS (
  INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
  SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Educación Artística%' LIMIT 1), 1, 'Superior', 'Valoración del primer periodo.' FROM p RETURNING id)
INSERT INTO valoracion_area (piar_id, area_id, periodo, desempeno, observacion)
SELECT p.id, (SELECT id FROM area WHERE institucion_id=1 AND nombre LIKE 'Ciencias Sociales%' LIMIT 1), 1, 'Básico', 'Valoración del primer periodo.' FROM p;;

