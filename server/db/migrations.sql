-- Migraciones idempotentes de PIAR.
-- Se ejecutan en CADA arranque (no solo en base vacía). Todas las sentencias
-- usan IF NOT EXISTS / IF EXISTS para poder repetirse sin error ni pérdida de datos.
-- Sirven para evolucionar una base ya creada (p. ej. la de producción en Render)
-- sin borrar información existente.

-- Características del estudiante del Anexo 2, en 3 descripciones oficiales (JSONB).
ALTER TABLE piar ADD COLUMN IF NOT EXISTS caracteristicas JSONB NOT NULL DEFAULT '{}'::jsonb;
