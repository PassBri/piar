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
