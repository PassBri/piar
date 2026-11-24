-- ============================================================
-- PIAR — Esquema de base de datos (PostgreSQL)
-- Sistema de Gestión del Plan Individual de Ajustes Razonables
-- Decreto 1421 de 2017
-- ============================================================

DROP TABLE IF EXISTS valoracion_area CASCADE;
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
-- superadmin = administrador general de toda la plataforma;
-- administrador = administrador de una institución.
CREATE TYPE rol_usuario        AS ENUM ('superadmin', 'rector', 'coordinador', 'psicoorientador', 'docente', 'padre', 'administrador');
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
    lat             NUMERIC(9,6),   -- para ubicar el municipio en el mapa
    lng             NUMERIC(9,6),
    UNIQUE (departamento_id, nombre)
);

-- -------- Institución educativa (pertenece a un municipio) --------
CREATE TABLE institucion (
    id           SERIAL PRIMARY KEY,
    municipio_id INTEGER REFERENCES municipio(id) ON DELETE SET NULL,
    nombre       VARCHAR(200) NOT NULL,
    sede         VARCHAR(200),
    codigo_dane  VARCHAR(20),
    num_periodos SMALLINT NOT NULL DEFAULT 4 CHECK (num_periodos BETWEEN 1 AND 4),
    usa_promocion BOOLEAN NOT NULL DEFAULT TRUE,   -- consolidado anual (promoción)
    nit          VARCHAR(30),
    logo         TEXT,   -- logo del colegio (data URL base64)
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_municipio_departamento ON municipio(departamento_id);
CREATE INDEX idx_institucion_municipio ON institucion(municipio_id);

-- -------- Curso (grupo): una institución tiene varias sedes, jornadas, grados y cursos --------
CREATE TABLE curso (
    id             SERIAL PRIMARY KEY,
    institucion_id INTEGER NOT NULL REFERENCES institucion(id) ON DELETE CASCADE,
    sede           VARCHAR(160) NOT NULL DEFAULT 'Principal',
    jornada        VARCHAR(40)  NOT NULL DEFAULT 'Única',   -- Mañana, Tarde, Única, Nocturna, Fin de semana
    grado          VARCHAR(40)  NOT NULL,                   -- Preescolar, 1°…11°
    grupo          VARCHAR(20)  NOT NULL DEFAULT 'A',       -- A, B, C…
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (institucion_id, sede, jornada, grado, grupo)
);
CREATE INDEX idx_curso_institucion ON curso(institucion_id);

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
    curso_id         INTEGER REFERENCES curso(id) ON DELETE SET NULL,
    foto             TEXT,   -- foto del estudiante (data URL base64)
    reservado        BOOLEAN NOT NULL DEFAULT FALSE,  -- caso reservado: solo equipo de orientación y directivos
    -- Identificación ampliada del Anexo 1 (sede, jornada, lugar de nacimiento,
    -- género, edad, sexo, grupo étnico, etc.)
    identificacion   JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Entornos del Anexo 1 (estructura flexible en JSON)
    entorno_personal JSONB NOT NULL DEFAULT '{}'::jsonb,
    entorno_salud    JSONB NOT NULL DEFAULT '{}'::jsonb,
    entorno_hogar    JSONB NOT NULL DEFAULT '{}'::jsonb,
    entorno_educativo JSONB NOT NULL DEFAULT '{}'::jsonb,  -- trayectoria educativa (Anexo 1)
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
    pmi           TEXT,                 -- recomendaciones para el Plan de Mejoramiento Institucional (eliminación de barreras)
    grado         VARCHAR(40),          -- grado que cursa el estudiante ese año (trayectoria)
    director_grupo VARCHAR(200),        -- director de grupo del año
    fecha_elaboracion DATE,
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
    periodo     SMALLINT NOT NULL DEFAULT 1 CHECK (periodo BETWEEN 1 AND 5),  -- 1-4 periodos, 5 = promoción (consolidado anual)
    objetivo    TEXT,                     -- objetivos/propósitos (EBC y DBA)
    barrera     TEXT NOT NULL,            -- barreras evidenciadas en el contexto
    tipo        tipo_ajuste NOT NULL,
    descripcion TEXT NOT NULL,            -- ajuste razonable (apoyos/estrategias)
    apoyo       TEXT,                     -- apoyo requerido
    intensidad  intensidad_apoyo DEFAULT 'intermitente',
    evaluacion  TEXT,                     -- evaluación de los ajustes (observaciones)
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
    actividades_casa       TEXT,   -- "y en casa apoyará con las siguientes actividades" (MEN)
    firmada_familia    BOOLEAN NOT NULL DEFAULT FALSE,
    firmada_institucion BOOLEAN NOT NULL DEFAULT FALSE,
    firma_familia_img  TEXT,   -- firma digital del acudiente (imagen dataURL)
    firma_institucion_img TEXT,
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

-- -------- Valoración por área y periodo (Anexo 2, seguimiento por periodos) --------
CREATE TABLE valoracion_area (
    id          SERIAL PRIMARY KEY,
    piar_id     INTEGER NOT NULL REFERENCES piar(id) ON DELETE CASCADE,
    area_id     INTEGER NOT NULL REFERENCES area(id) ON DELETE CASCADE,
    periodo     SMALLINT NOT NULL CHECK (periodo BETWEEN 1 AND 5),  -- 5 = promoción (consolidado anual)
    desempeno   VARCHAR(20),   -- superior, alto, básico, bajo
    observacion TEXT,
    UNIQUE (piar_id, area_id, periodo)
);
CREATE INDEX idx_valoracion_piar ON valoracion_area(piar_id);

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

-- -------- Auditoría: control de cambios (quién registra/edita cada formato) --------
CREATE TABLE auditoria (
    id             SERIAL PRIMARY KEY,
    usuario_id     INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
    usuario_nombre VARCHAR(200),          -- snapshot (persiste aunque cambie/borre el usuario)
    usuario_rol    rol_usuario,
    entidad        VARCHAR(30) NOT NULL,  -- estudiante, piar, ajuste, valoracion, acta, area, curso
    entidad_id     INTEGER,
    estudiante_id  INTEGER,               -- para agrupar la bitácora por expediente
    piar_id        INTEGER,
    accion         VARCHAR(20) NOT NULL,  -- crear, editar, eliminar, firmar
    descripcion    TEXT,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_estudiante ON auditoria(estudiante_id);
CREATE INDEX idx_auditoria_piar ON auditoria(piar_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(creado_en DESC);

-- -------- Asignación de cursos (grados/grupos) a los usuarios (docentes, etc.) --------
CREATE TABLE usuario_curso (
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    curso_id   INTEGER NOT NULL REFERENCES curso(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, curso_id)
);
CREATE INDEX idx_usuario_curso_usuario ON usuario_curso(usuario_id);

-- -------- Detección en el aula (tamizaje de caracterización) --------
CREATE TABLE tamizaje (
    id              SERIAL PRIMARY KEY,
    estudiante_id   INTEGER NOT NULL REFERENCES estudiante(id) ON DELETE CASCADE,
    fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
    aplicado_por    INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
    respuestas      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { dominio: { indicador: 1-4 } }
    dominios_alerta JSONB NOT NULL DEFAULT '[]'::jsonb,  -- dominios con señal de alerta
    observaciones   TEXT,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tamizaje_estudiante ON tamizaje(estudiante_id);

-- -------- Adaptaciones para pruebas de Estado (ICFES/Saber) --------
CREATE TABLE prueba_estado (
    id            SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiante(id) ON DELETE CASCADE,
    tipo          VARCHAR(60),                      -- Saber 11, Saber 3°5°9°, etc.
    apoyos        JSONB NOT NULL DEFAULT '[]'::jsonb, -- apoyos solicitados
    otros_apoyos  TEXT,
    observaciones TEXT,
    fecha         DATE DEFAULT CURRENT_DATE,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prueba_estudiante ON prueba_estado(estudiante_id);

-- -------- Promoción, egreso y titulación --------
CREATE TABLE promocion (
    id              SERIAL PRIMARY KEY,
    piar_id         INTEGER NOT NULL UNIQUE REFERENCES piar(id) ON DELETE CASCADE,
    decision        VARCHAR(30),   -- promovido, no_promovido, promocion_anticipada, egresado, titulado
    grado_cursado   VARCHAR(40),
    grado_siguiente VARCHAR(40),
    criterios       TEXT,
    observaciones   TEXT,
    fecha           DATE DEFAULT CURRENT_DATE
);

-- -------- Remisiones y articulación intersectorial (salud, ICBF, etc.) --------
CREATE TABLE remision (
    id            SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiante(id) ON DELETE CASCADE,
    sector        VARCHAR(40),    -- Salud, Protección, Rehabilitación, Otro
    entidad       VARCHAR(140),   -- EPS/IPS/ICBF/fundación
    motivo        TEXT,
    fecha         DATE DEFAULT CURRENT_DATE,
    estado        VARCHAR(30) NOT NULL DEFAULT 'enviada',  -- enviada, en_proceso, respondida
    respuesta     TEXT,           -- síntesis del informe recibido
    creado_por    INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_remision_estudiante ON remision(estudiante_id);

-- -------- Anexo 4: acta de seguimiento/entrega e informe de transición --------
CREATE TABLE anexo4 (
    id                  SERIAL PRIMARY KEY,
    piar_id             INTEGER NOT NULL UNIQUE REFERENCES piar(id) ON DELETE CASCADE,
    logros              TEXT,   -- logros y avances del estudiante en el año
    recomendaciones     TEXT,   -- ajustes que funcionaron y recomendaciones para el año siguiente
    grado_destino       VARCHAR(60),
    institucion_destino VARCHAR(200),
    apoyos_transicion   TEXT,   -- apoyos requeridos para la transición
    observaciones       TEXT,
    firmada_entrega     BOOLEAN NOT NULL DEFAULT FALSE,
    firma_entrega_img   TEXT,   -- firma de quien entrega (docente/orientación)
    firma_recibe_img    TEXT,   -- firma de quien recibe / familia
    fecha               DATE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);
