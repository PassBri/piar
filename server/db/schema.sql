-- ============================================================
-- SIGPIAR — Esquema de base de datos (PostgreSQL)
-- Sistema de Gestión del Plan Individual de Ajustes Razonables
-- Decreto 1421 de 2017
-- ============================================================

DROP TABLE IF EXISTS seguimiento CASCADE;
DROP TABLE IF EXISTS ajuste_razonable CASCADE;
DROP TABLE IF EXISTS acta_acuerdo CASCADE;
DROP TABLE IF EXISTS piar CASCADE;
DROP TABLE IF EXISTS estudiante CASCADE;
DROP TABLE IF EXISTS area CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS institucion CASCADE;
DROP TABLE IF EXISTS municipio CASCADE;
DROP TABLE IF EXISTS departamento CASCADE;
DROP TYPE IF EXISTS rol_usuario CASCADE;
DROP TYPE IF EXISTS intensidad_apoyo CASCADE;
DROP TYPE IF EXISTS tipo_ajuste CASCADE;
DROP TYPE IF EXISTS estado_piar CASCADE;
DROP TYPE IF EXISTS decision_seguimiento CASCADE;

-- -------- Tipos enumerados --------
CREATE TYPE rol_usuario        AS ENUM ('rector', 'psicoorientador', 'docente', 'padre', 'administrador');
CREATE TYPE intensidad_apoyo   AS ENUM ('generalizado', 'extenso', 'limitado', 'intermitente');
CREATE TYPE tipo_ajuste        AS ENUM ('actividades', 'materiales', 'espacios', 'comunicacion', 'apoyos_humanos', 'tecnologias');
CREATE TYPE estado_piar        AS ENUM ('borrador', 'vigente', 'cerrado');
CREATE TYPE decision_seguimiento AS ENUM ('mantener', 'modificar', 'retirar');

-- -------- Jerarquía territorial: Departamento > Municipio > Institución --------
CREATE TABLE departamento (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL UNIQUE,
    codigo_dane VARCHAR(10)
);

CREATE TABLE municipio (
    id              SERIAL PRIMARY KEY,
    departamento_id INTEGER NOT NULL REFERENCES departamento(id) ON DELETE CASCADE,
    nombre          VARCHAR(120) NOT NULL,
    codigo_dane     VARCHAR(10),
    UNIQUE (departamento_id, nombre)
);

-- -------- Institución educativa (pertenece a un municipio) --------
CREATE TABLE institucion (
    id           SERIAL PRIMARY KEY,
    municipio_id INTEGER REFERENCES municipio(id) ON DELETE SET NULL,
    nombre       VARCHAR(200) NOT NULL,
    sede         VARCHAR(200),
    codigo_dane  VARCHAR(20),
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_municipio_departamento ON municipio(departamento_id);
CREATE INDEX idx_institucion_municipio ON institucion(municipio_id);

-- -------- Usuario --------
CREATE TABLE usuario (
    id             SERIAL PRIMARY KEY,
    institucion_id INTEGER REFERENCES institucion(id) ON DELETE SET NULL,
    nombres        VARCHAR(160) NOT NULL,
    correo         VARCHAR(160) NOT NULL UNIQUE,
    clave_hash     VARCHAR(255) NOT NULL,
    rol            rol_usuario  NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------- Área o asignatura --------
CREATE TABLE area (
    id             SERIAL PRIMARY KEY,
    institucion_id INTEGER REFERENCES institucion(id) ON DELETE CASCADE,
    nombre         VARCHAR(120) NOT NULL
);

-- -------- Estudiante (Anexo 1: entornos personal, salud y hogar) --------
CREATE TABLE estudiante (
    id               SERIAL PRIMARY KEY,
    institucion_id   INTEGER NOT NULL REFERENCES institucion(id) ON DELETE CASCADE,
    documento_tipo   VARCHAR(20),
    documento_numero VARCHAR(40),
    nombres          VARCHAR(200) NOT NULL,
    fecha_nacimiento DATE,
    grado            VARCHAR(40),
    -- Entornos del Anexo 1 (estructura flexible en JSON)
    entorno_personal JSONB NOT NULL DEFAULT '{}'::jsonb,
    entorno_salud    JSONB NOT NULL DEFAULT '{}'::jsonb,
    entorno_hogar    JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Acceso de la familia: usuario padre vinculado (solo lectura de su hijo)
    acudiente_id     INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
    creado_por       INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
    creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (institucion_id, documento_numero)
);

-- -------- PIAR (Anexo 2: valoración y ajustes) --------
CREATE TABLE piar (
    id            SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiante(id) ON DELETE CASCADE,
    periodo       VARCHAR(20) NOT NULL,
    valoracion    TEXT,                 -- síntesis de la valoración pedagógica
    aspectos_generales TEXT,            -- gustos, intereses, habilidades actuales
    recomendaciones_pmi JSONB NOT NULL DEFAULT '{}'::jsonb,  -- 6 dimensiones
    estado        estado_piar NOT NULL DEFAULT 'borrador',
    creado_por    INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------- Ajuste razonable (por barrera y área) --------
CREATE TABLE ajuste_razonable (
    id          SERIAL PRIMARY KEY,
    piar_id     INTEGER NOT NULL REFERENCES piar(id) ON DELETE CASCADE,
    area_id     INTEGER REFERENCES area(id) ON DELETE SET NULL,
    objetivo    VARCHAR(300),
    barrera     TEXT NOT NULL,
    tipo        tipo_ajuste NOT NULL,
    descripcion TEXT NOT NULL,            -- el ajuste en sí
    apoyo       TEXT,                     -- apoyo requerido
    intensidad  intensidad_apoyo DEFAULT 'intermitente',
    retirado    BOOLEAN NOT NULL DEFAULT FALSE,
    justificacion_retiro TEXT,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------- Acta de acuerdo con la familia (Anexo 3) --------
CREATE TABLE acta_acuerdo (
    id            SERIAL PRIMARY KEY,
    piar_id       INTEGER NOT NULL UNIQUE REFERENCES piar(id) ON DELETE CASCADE,
    compromisos_familia    TEXT,
    compromisos_institucion TEXT,
    firmada_familia    BOOLEAN NOT NULL DEFAULT FALSE,
    firmada_institucion BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_firma   DATE,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------- Seguimiento (≥ 3 veces al año por ajuste) --------
CREATE TABLE seguimiento (
    id          SERIAL PRIMARY KEY,
    ajuste_id   INTEGER NOT NULL REFERENCES ajuste_razonable(id) ON DELETE CASCADE,
    fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo     VARCHAR(20),
    impacto     TEXT,
    decision    decision_seguimiento NOT NULL DEFAULT 'mantener',
    registrado_por INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------- Catálogo de ajustes sugeridos (ejemplos del MEN) --------
CREATE TABLE catalogo_ajuste (
    id          SERIAL PRIMARY KEY,
    tipo        tipo_ajuste NOT NULL,
    descripcion TEXT NOT NULL
);

-- -------- Índices --------
CREATE INDEX idx_estudiante_institucion ON estudiante(institucion_id);
CREATE INDEX idx_piar_estudiante ON piar(estudiante_id);
CREATE INDEX idx_ajuste_piar ON ajuste_razonable(piar_id);
CREATE INDEX idx_seguimiento_ajuste ON seguimiento(ajuste_id);
CREATE INDEX idx_usuario_rol ON usuario(rol);
