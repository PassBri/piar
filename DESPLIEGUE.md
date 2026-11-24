# Poner PIAR en línea (enlace compartible)

Con esto PIAR queda publicado en internet con una dirección propia
(por ejemplo `https://piar.onrender.com`) que puedes abrir desde cualquier
equipo o celular, sin instalar nada. Se usa **Render**, que tiene un plan
gratuito para el servicio web y la base de datos.

## Pasos (una sola vez, ~10 minutos)

1. Entra a **https://render.com** y crea una cuenta (puedes usar tu cuenta de GitHub).
2. En el tablero de Render, haz clic en **New +** → **Blueprint**.
3. Conecta tu repositorio **PassBri/piar** cuando lo pida.
4. Render detecta el archivo `render.yaml` del proyecto y muestra lo que va a crear:
   - un **servicio web** llamado `piar` (la aplicación),
   - una **base de datos PostgreSQL** llamada `piar-db`.
   Haz clic en **Apply**.
5. Espera a que termine (la primera vez tarda unos minutos mientras instala y compila).
   Cuando el servicio quede en estado **Live**, arriba aparece su dirección:
   `https://piar.onrender.com` (o parecida). Esa es tu enlace para compartir.

La primera vez que se abre, la aplicación **crea sola** la base de datos con
los datos de ejemplo (instituciones, áreas, cursos y estudiantes de demostración).

## Ingreso

- Administrador general (tú): **admin@piar.co** / contraseña **piar123**
- Cambia esa contraseña al entrar, desde Administración.

## Notas

- En el plan **gratuito** de Render, si nadie usa la aplicación por un rato,
  "se duerme"; la primera visita después de eso tarda ~30 segundos en despertar.
  Para uso continuo puedes subir el servicio a un plan de pago cuando quieras.
- La clave de seguridad (`JWT_SECRET`) la genera Render automáticamente.
- Cada vez que subas cambios a GitHub (rama `main`), Render vuelve a publicar
  la aplicación solo. No se pierden los datos ya cargados.

## Respaldos (backups)

- **En línea (Render):** en el panel de la base de datos `piar-db`, activa los
  *backups* automáticos (Render guarda copias diarias según el plan).
- **En tu equipo:** ejecuta `respaldo.bat` para crear una copia `.sql` con la
  fecha del día; guárdala en un USB o la nube.
- **Desde la aplicación:** el administrador general puede descargar un respaldo
  en JSON desde Administración → "Descargar respaldo".

## Variables que usa el servicio (las configura el `render.yaml` solo)

| Variable       | Para qué sirve                                   |
|----------------|--------------------------------------------------|
| `NODE_ENV`     | Activa el modo producción.                        |
| `DATABASE_URL` | Conexión a la base PostgreSQL (la inyecta Render).|
| `JWT_SECRET`   | Clave para las sesiones (la genera Render).        |
