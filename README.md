# SIGPIAR

**Sistema de Información y Gestión del Plan Individual de Ajustes Razonables**
Plataforma web para la atención educativa a estudiantes con discapacidad en el marco del **Decreto 1421 de 2017**.

Organizada por **departamento → municipio → institución educativa**, permite a los docentes llenar y seguir el PIAR de forma sencilla e **imprimir los formatos (Anexos 1, 2 y 3) y los informes de seguimiento**.

---

## Características

- **Expediente del estudiante (Anexo 1):** identificación completa y entornos personal, de salud y de hogar.
- **PIAR (Anexo 2):** valoración pedagógica, valoración por área del plan de estudios y por periodo (1 a 4), barreras y ajustes razonables, con un catálogo de ajustes sugeridos por el MEN (actividades, materiales, espacios, comunicación, apoyos humanos y tecnologías).
- **Plan de estudios:** áreas obligatorias de la Ley 115 de 1994 por institución.
- **Acta de acuerdo (Anexo 3):** compromisos de la familia y de la institución.
- **Seguimiento:** registro de seguimientos (mínimo tres al año) con alertas de pendientes.
- **Impresión:** generación de PDF del Anexo 1, del PIAR (Anexo 2) y del informe de seguimiento, listos para firmar.
- **Estadísticas con mapa de Colombia:** número de colegios y estudiantes atendidos por municipio y departamento, sobre un mapa interactivo.
- **Jerarquía territorial:** departamento → municipio → institución educativa.
- **Roles de acceso:** rector, psicoorientador, docente, padre de familia y administrador.

## Arquitectura

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express (API REST, JWT) |
| Base de datos | PostgreSQL 16 |
| Documentos | PDFKit (impresión de anexos e informes) |

Jerarquía territorial: `departamento` → `municipio` → `institucion` → (`usuario`, `estudiante` → `piar` → `ajuste_razonable` → `seguimiento`, `acta_acuerdo`).

## Puesta en marcha

### 1. Base de datos (con Docker)

```bash
npm run db:up          # levanta PostgreSQL y carga esquema + datos demo
```

O manualmente, con un PostgreSQL ya instalado:

```bash
createdb sigpiar
psql sigpiar -f server/db/schema.sql
psql sigpiar -f server/db/seed.sql
```

### 2. Backend

```bash
cd server
cp .env.example .env     # ajusta DATABASE_URL y JWT_SECRET
npm install
npm run dev              # API en http://localhost:4000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev              # app en http://localhost:5173
```

## Usuarios demo

Todos con la contraseña **`sigpiar123`**:

| Rol | Correo |
|-----|--------|
| Rector | `rector@sigpiar.co` |
| Psicoorientador | `orientador@sigpiar.co` |
| Docente | `docente@sigpiar.co` |
| Padre de familia | `familia@sigpiar.co` |
| Administrador | `admin@sigpiar.co` |

## Estructura del repositorio

```
piar/
├── server/            # API REST (Express + PostgreSQL)
│   ├── src/routes/    # auth, estudiantes, piar, ajustes, seguimiento, actas,
│   │                  # catalogo, areas, usuarios, informes, geografia
│   └── db/            # schema.sql y seed.sql
├── client/            # Aplicación React
│   └── src/           # pages, components, context, api, styles, assets
├── docs/              # documentación técnica del proyecto
└── docker-compose.yml # PostgreSQL para desarrollo
```

## Estado del proyecto

Versión 1.0 — MVP funcional con los módulos núcleo (autenticación por rol, Anexo 1,
Anexo 2 con ajustes, seguimiento e impresión de PDF, indicadores territoriales).
Próximos pasos: acta de acuerdo en la interfaz, informe anual de competencias,
sincronización con SIMAT y panel por secretaría de educación.

## Autor

Brian Gonzalo Suárez Acevedo — Tecnólogo en Análisis y Desarrollo de Software (SENA).

## Licencia

MIT — ver [LICENSE](LICENSE).
