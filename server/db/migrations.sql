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
