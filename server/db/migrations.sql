-- Migraciones idempotentes de PIAR.
-- Se ejecutan en CADA arranque (no solo en base vacía). Todas las sentencias
-- usan IF NOT EXISTS / IF EXISTS para poder repetirse sin error ni pérdida de datos.
-- Sirven para evolucionar una base ya creada (p. ej. la de producción en Render)
-- sin borrar información existente.

-- Características del estudiante del Anexo 2, en 3 descripciones oficiales (JSONB).
ALTER TABLE piar ADD COLUMN IF NOT EXISTS caracteristicas JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Documentos de soporte / evidencias del estudiante (estudios médicos, psicológicos, etc.).
-- Se guarda el archivo como base64 (PDF o imagen) junto con sus metadatos.
CREATE TABLE IF NOT EXISTS documento_evidencia (
    id            SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiante(id) ON DELETE CASCADE,
    nombre        VARCHAR(250) NOT NULL,
    tipo          VARCHAR(100),         -- categoría: médico, psicológico, otro
    mime          VARCHAR(100),         -- tipo del archivo (application/pdf, image/*)
    datos         TEXT NOT NULL,        -- contenido en base64 (data URL)
    subido_por    INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evidencia_estudiante ON documento_evidencia(estudiante_id);

-- Nuevas instituciones usan 3 periodos por defecto (trimestres, como el formato oficial).
ALTER TABLE institucion ALTER COLUMN num_periodos SET DEFAULT 3;

-- Sistema de evaluación del colegio (SIEE): cualitativo, numerico5 (1-5) o numerico10 (1-10).
ALTER TABLE institucion ADD COLUMN IF NOT EXISTS sistema_evaluacion VARCHAR(20) NOT NULL DEFAULT 'cualitativo';

-- Desempeño del estudiante por ajuste razonable (según el SIEE del colegio).
ALTER TABLE ajuste_razonable ADD COLUMN IF NOT EXISTS desempeno TEXT;

-- Anexo 3 (Acta de acuerdo): campos del formato oficial.
ALTER TABLE acta_acuerdo ADD COLUMN IF NOT EXISTS nombres_directivos TEXT;              -- equipo directivo y docentes
ALTER TABLE acta_acuerdo ADD COLUMN IF NOT EXISTS familia JSONB NOT NULL DEFAULT '[]'::jsonb;        -- [{nombre, parentesco}]
ALTER TABLE acta_acuerdo ADD COLUMN IF NOT EXISTS actividades JSONB NOT NULL DEFAULT '[]'::jsonb;    -- [{actividad, estrategia, frecuencia}]

-- PMI institucional: el plan de mejoramiento diligenciado por la institución
-- (general cuando sede/jornada están vacíos, o específico por sede y jornada).
CREATE TABLE IF NOT EXISTS pmi_institucional (
  id SERIAL PRIMARY KEY,
  institucion_id INT NOT NULL REFERENCES institucion(id) ON DELETE CASCADE,
  anio VARCHAR(9) NOT NULL,
  sede VARCHAR(160) NOT NULL DEFAULT '',      -- '' = toda la institución
  jornada VARCHAR(80) NOT NULL DEFAULT '',    -- '' = todas las jornadas
  actor VARCHAR(40) NOT NULL,
  acciones TEXT NOT NULL DEFAULT '',
  estrategias TEXT NOT NULL DEFAULT '',
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (institucion_id, anio, sede, jornada, actor)
);

-- Limpieza de áreas duplicadas por institución (ignorando mayúsculas y espacios).
-- Reapunta los ajustes y las valoraciones al área original y elimina las repetidas.
DO $$
DECLARE d RECORD;
BEGIN
  FOR d IN
    SELECT institucion_id, lower(btrim(nombre)) AS clave, min(id) AS conservar
    FROM area
    GROUP BY institucion_id, lower(btrim(nombre))
    HAVING count(*) > 1
  LOOP
    UPDATE ajuste_razonable SET area_id = d.conservar
      WHERE area_id IN (SELECT id FROM area WHERE institucion_id = d.institucion_id
                          AND lower(btrim(nombre)) = d.clave AND id <> d.conservar);
    -- valoracion_area tiene UNIQUE(piar_id, area_id, periodo): quita las que chocarían al reapuntar
    DELETE FROM valoracion_area v
      WHERE area_id IN (SELECT id FROM area WHERE institucion_id = d.institucion_id
                          AND lower(btrim(nombre)) = d.clave AND id <> d.conservar)
        AND EXISTS (SELECT 1 FROM valoracion_area v2
                      WHERE v2.piar_id = v.piar_id AND v2.periodo = v.periodo AND v2.area_id = d.conservar);
    UPDATE valoracion_area SET area_id = d.conservar
      WHERE area_id IN (SELECT id FROM area WHERE institucion_id = d.institucion_id
                          AND lower(btrim(nombre)) = d.clave AND id <> d.conservar);
    DELETE FROM area
      WHERE institucion_id = d.institucion_id AND lower(btrim(nombre)) = d.clave AND id <> d.conservar;
  END LOOP;
END $$;

-- Evita nuevas áreas duplicadas por institución (ignorando mayúsculas y espacios).
CREATE UNIQUE INDEX IF NOT EXISTS area_inst_nombre_uniq ON area (institucion_id, lower(btrim(nombre)));

-- Seguridad del Anexo 2: autoría de cada ajuste razonable.
-- Un docente solo puede editar/eliminar las filas que él creó; coordinador,
-- psicoorientador, rector y administrador pueden gestionar todas.
ALTER TABLE ajuste_razonable ADD COLUMN IF NOT EXISTS creado_por INTEGER REFERENCES usuario(id) ON DELETE SET NULL;

-- Responsable por área y estudiante (lo asigna coordinación/orientación).
-- Define qué docente diligencia cada área del Anexo 2 de ese estudiante.
CREATE TABLE IF NOT EXISTS responsable_area (
  id SERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL REFERENCES estudiante(id) ON DELETE CASCADE,
  area_id INT NOT NULL REFERENCES area(id) ON DELETE CASCADE,
  docente_id INT REFERENCES usuario(id) ON DELETE SET NULL,
  asignado_por INT REFERENCES usuario(id) ON DELETE SET NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (estudiante_id, area_id)
);

-- Carga académica: qué área dicta cada docente en cada curso.
-- Permite deducir automáticamente el responsable de cada área en el PIAR,
-- según el curso del estudiante (con posibilidad de excepción por estudiante).
CREATE TABLE IF NOT EXISTS carga_academica (
  id SERIAL PRIMARY KEY,
  docente_id INT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  curso_id INT NOT NULL REFERENCES curso(id) ON DELETE CASCADE,
  area_id INT NOT NULL REFERENCES area(id) ON DELETE CASCADE,
  UNIQUE (curso_id, area_id)
);

-- Plan de estudios del curso: áreas/asignaturas que tiene cada curso.
-- La carga académica y el Anexo 2 del estudiante se basan en estas áreas.
CREATE TABLE IF NOT EXISTS curso_area (
  id SERIAL PRIMARY KEY,
  curso_id INT NOT NULL REFERENCES curso(id) ON DELETE CASCADE,
  area_id INT NOT NULL REFERENCES area(id) ON DELETE CASCADE,
  UNIQUE (curso_id, area_id)
);

-- Sección(es) de cada área: preescolar, primaria, secundaria, media.
-- Un área común puede pertenecer a varias (primaria, secundaria y media).
ALTER TABLE area ADD COLUMN IF NOT EXISTS secciones TEXT[] NOT NULL DEFAULT '{}';

-- Clasificación inicial de las áreas estándar (solo las que aún no tienen sección).
UPDATE area SET secciones = ARRAY['preescolar']
  WHERE secciones = '{}' AND (nombre ILIKE 'Dimensi_n%'
    OR lower(btrim(nombre)) IN ('autonomía','autonomia','convivencia','participación','participacion','socialización','socializacion','autocontrol'));
UPDATE area SET secciones = ARRAY['primaria','secundaria','media']
  WHERE secciones = '{}' AND lower(btrim(nombre)) IN (
    'matemáticas','matematicas',
    'humanidades, lengua castellana e idiomas extranjeros','lengua castellana',
    'ciencias naturales y educación ambiental',
    'ciencias sociales, historia, geografía y democracia','ciencias sociales, historia, geografía, constitución política y democracia',
    'educación artística y cultural','educación física, recreación y deportes',
    'educación religiosa','educación ética y en valores humanos',
    'tecnología e informática','idioma extranjero (inglés)','inglés');
UPDATE area SET secciones = ARRAY['media']
  WHERE secciones = '{}' AND lower(btrim(nombre)) IN ('filosofía','filosofia','ciencias económicas y políticas','ciencias economicas y politicas');

-- Respaldo robusto (sin depender de acentos exactos) para las áreas estándar.
UPDATE area SET secciones = ARRAY['preescolar']
  WHERE secciones = '{}' AND nombre ILIKE 'Dimensi%n%';
UPDATE area SET secciones = ARRAY['primaria','secundaria','media']
  WHERE secciones = '{}' AND (
    nombre ILIKE 'Matem%tica%' OR nombre ILIKE 'Human%Lengua%' OR nombre ILIKE 'Ciencias Naturales%'
    OR nombre ILIKE 'Ciencias Sociales%' OR nombre ILIKE 'Educaci%n Art%stica%'
    OR nombre ILIKE 'Educaci%n F%sica%' OR nombre ILIKE 'Educaci%n Religiosa%'
    OR nombre ILIKE 'Educaci%n %tica%' OR nombre ILIKE 'Tecnolog%a e Inform%'
    OR nombre ILIKE 'Idioma extranjero%' OR nombre = 'Inglés' OR nombre = 'Lengua castellana');
UPDATE area SET secciones = ARRAY['media']
  WHERE secciones = '{}' AND (nombre ILIKE 'Filosof%a' OR nombre ILIKE 'Ciencias Econ%micas y Pol%ticas');
