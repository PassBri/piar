-- ============================================================
-- SIGPIAR — Datos iniciales (demo)
-- Clave de todos los usuarios demo: sigpiar123
-- ============================================================

-- Jerarquía territorial demo: Departamento > Municipio > Institución
INSERT INTO departamento (id, nombre, codigo_dane) VALUES
  (1, 'Santander', '68')
ON CONFLICT DO NOTHING;
SELECT setval('departamento_id_seq', 1, true);

INSERT INTO municipio (id, departamento_id, nombre, codigo_dane) VALUES
  (1, 1, 'Floridablanca', '68276'),
  (2, 1, 'Bucaramanga', '68001'),
  (3, 1, 'Girón', '68307')
ON CONFLICT DO NOTHING;
SELECT setval('municipio_id_seq', 3, true);

-- Institución demo (en Floridablanca, Santander)
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES
  (1, 1, 'Institución Educativa San Bernardo', 'Sede A')
ON CONFLICT DO NOTHING;
SELECT setval('institucion_id_seq', 1, true);

-- Usuarios demo (uno por rol). Clave: sigpiar123
INSERT INTO usuario (institucion_id, nombres, correo, clave_hash, rol) VALUES
  (1, 'Rector Demo',          'rector@sigpiar.co',          '$2b$10$l6UYfPxNLgdHI/nD8RtWaeT6tj/Huu8MRh1NMv1urmzZmTGSlX2HK', 'rector'),
  (1, 'Psicoorientador Demo', 'orientador@sigpiar.co',      '$2b$10$l6UYfPxNLgdHI/nD8RtWaeT6tj/Huu8MRh1NMv1urmzZmTGSlX2HK', 'psicoorientador'),
  (1, 'Docente Demo',         'docente@sigpiar.co',         '$2b$10$l6UYfPxNLgdHI/nD8RtWaeT6tj/Huu8MRh1NMv1urmzZmTGSlX2HK', 'docente'),
  (1, 'Familia Demo',         'familia@sigpiar.co',         '$2b$10$l6UYfPxNLgdHI/nD8RtWaeT6tj/Huu8MRh1NMv1urmzZmTGSlX2HK', 'padre'),
  (1, 'Administrador Demo',   'admin@sigpiar.co',           '$2b$10$l6UYfPxNLgdHI/nD8RtWaeT6tj/Huu8MRh1NMv1urmzZmTGSlX2HK', 'administrador')
ON CONFLICT (correo) DO NOTHING;

-- Áreas demo
INSERT INTO area (institucion_id, nombre) VALUES
  (1, 'Matemáticas'),
  (1, 'Lenguaje'),
  (1, 'Ciencias Naturales'),
  (1, 'Ciencias Sociales'),
  (1, 'Educación Física'),
  (1, 'Artística')
ON CONFLICT DO NOTHING;

-- Catálogo de ajustes razonables sugeridos (ejemplos orientativos del MEN)
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES
  ('actividades', 'Contextualizar la tarea y dar más tiempo para resolverla.'),
  ('actividades', 'Demostrar la tarea con un ejemplo antes de que el estudiante la realice.'),
  ('actividades', 'Leer en voz alta las instrucciones y los enunciados.'),
  ('actividades', 'Ubicar al estudiante estratégicamente en el aula.'),
  ('actividades', 'Ofrecer la evaluación de forma oral.'),
  ('materiales', 'Material en alto contraste de color.'),
  ('materiales', 'Material táctil o en relieve y mobiliario adaptado.'),
  ('materiales', 'Textos en macrotipo y uso de lupas.'),
  ('materiales', 'Agendas visuales y apoyos gráficos.'),
  ('espacios', 'Señalización y contrastes en puertas y ventanas.'),
  ('espacios', 'Buena iluminación del espacio de trabajo.'),
  ('comunicacion', 'Sistemas aumentativos y alternativos: pictogramas y tableros de comunicación.'),
  ('comunicacion', 'Uso de lengua de señas o gestos de apoyo.'),
  ('apoyos_humanos', 'Acompañamiento de intérprete o modelo lingüístico.'),
  ('apoyos_humanos', 'Mediación del docente de apoyo o tiflólogo.'),
  ('tecnologias', 'Lector de pantalla para el acceso a textos digitales.'),
  ('tecnologias', 'Amplificador de voz o de imagen y uso de tableta.')
ON CONFLICT DO NOTHING;
