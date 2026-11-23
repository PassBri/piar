-- ============================================================
-- SIGPIAR — Datos iniciales (demo)
-- Clave de todos los usuarios demo: piar123
-- Jerarquía: departamento > municipio > institución; áreas Ley 115;
-- datos distribuidos para el mapa de estadísticas.
-- ============================================================

-- Entidades territoriales: los 32 departamentos de Colombia y el Distrito Capital de Bogotá (coinciden con el mapa)
INSERT INTO departamento (id, nombre) VALUES (1, 'Amazonas') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (2, 'Antioquia') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (3, 'Arauca') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (4, 'Atlántico') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (5, 'Bogotá D.C.') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (6, 'Bolívar') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (7, 'Boyacá') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (8, 'Caldas') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (9, 'Caquetá') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (10, 'Casanare') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (11, 'Cauca') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (12, 'Cesar') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (13, 'Chocó') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (14, 'Córdoba') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (15, 'Cundinamarca') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (16, 'Guainía') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (17, 'Guaviare') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (18, 'Huila') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (19, 'La Guajira') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (20, 'Magdalena') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (21, 'Meta') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (22, 'Nariño') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (23, 'Norte de Santander') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (24, 'Putumayo') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (25, 'Quindío') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (26, 'Risaralda') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (27, 'San Andrés y Providencia') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (28, 'Santander') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (29, 'Sucre') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (30, 'Tolima') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (31, 'Valle del Cauca') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (32, 'Vaupés') ON CONFLICT DO NOTHING;
INSERT INTO departamento (id, nombre) VALUES (33, 'Vichada') ON CONFLICT DO NOTHING;
SELECT setval('departamento_id_seq', 33, true);

-- Municipios: capitales departamentales y municipios de Santander
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (1, 1, 'Leticia', -4.2153, -69.9406) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (2, 2, 'Medellín', 6.2442, -75.5812) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (3, 3, 'Arauca', 7.0847, -70.7591) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (4, 4, 'Barranquilla', 10.9685, -74.7813) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (5, 5, 'Bogotá D.C.', 4.711, -74.0721) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (6, 6, 'Cartagena', 10.391, -75.4794) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (7, 7, 'Tunja', 5.5353, -73.3678) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (8, 8, 'Manizales', 5.0689, -75.5174) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (9, 9, 'Florencia', 1.6144, -75.6062) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (10, 10, 'Yopal', 5.3378, -72.3959) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (11, 11, 'Popayán', 2.4448, -76.6147) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (12, 12, 'Valledupar', 10.4631, -73.2532) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (13, 13, 'Quibdó', 5.6919, -76.6583) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (14, 14, 'Montería', 8.7479, -75.8814) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (15, 15, 'Soacha', 4.579, -74.217) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (16, 16, 'Inírida', 3.8653, -67.9239) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (17, 17, 'San José del Guaviare', 2.5729, -72.6459) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (18, 18, 'Neiva', 2.9273, -75.2819) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (19, 19, 'Riohacha', 11.5444, -72.9072) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (20, 20, 'Santa Marta', 11.2408, -74.199) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (21, 21, 'Villavicencio', 4.142, -73.6266) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (22, 22, 'Pasto', 1.2136, -77.2811) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (23, 23, 'Cúcuta', 7.8939, -72.5078) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (24, 24, 'Mocoa', 1.1519, -76.6513) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (25, 25, 'Armenia', 4.5339, -75.6811) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (26, 26, 'Pereira', 4.8133, -75.6961) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (27, 27, 'San Andrés', 12.5847, -81.7006) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (28, 28, 'Bucaramanga', 7.1193, -73.1227) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (29, 29, 'Sincelejo', 9.3047, -75.3978) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (30, 30, 'Ibagué', 4.4389, -75.2322) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (31, 31, 'Cali', 3.4516, -76.532) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (32, 32, 'Mitú', 1.2533, -70.2339) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (33, 33, 'Puerto Carreño', 6.189, -67.4859) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (34, 28, 'Floridablanca', 7.0646, -73.0866) ON CONFLICT DO NOTHING;
INSERT INTO municipio (id, departamento_id, nombre, lat, lng) VALUES (35, 28, 'Girón', 7.0735, -73.1733) ON CONFLICT DO NOTHING;
SELECT setval('municipio_id_seq', 35, true);

-- Institución principal (Floridablanca, Santander)
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES
  (1, 34, 'Institución Educativa San Bernardo', 'Sede A') ON CONFLICT DO NOTHING;

INSERT INTO usuario (institucion_id, nombres, correo, clave_hash, rol) VALUES
  (1, 'Rector Demo',          'rector@piar.co',     '$2b$10$Dq4nCd90yN.vA2pUWEExt.RqvzXiW9zut1gXcZxpgKFHuW4AoWkB2', 'rector'),
  (1, 'Psicoorientador Demo', 'orientador@piar.co', '$2b$10$Dq4nCd90yN.vA2pUWEExt.RqvzXiW9zut1gXcZxpgKFHuW4AoWkB2', 'psicoorientador'),
  (1, 'Docente Demo',         'docente@piar.co',    '$2b$10$Dq4nCd90yN.vA2pUWEExt.RqvzXiW9zut1gXcZxpgKFHuW4AoWkB2', 'docente'),
  (1, 'Familia Demo',         'familia@piar.co',    '$2b$10$Dq4nCd90yN.vA2pUWEExt.RqvzXiW9zut1gXcZxpgKFHuW4AoWkB2', 'padre'),
  (NULL, 'Administrador General',     'admin@piar.co',    '$2b$10$Dq4nCd90yN.vA2pUWEExt.RqvzXiW9zut1gXcZxpgKFHuW4AoWkB2', 'superadmin'),
  (1,    'Administrador Institución', 'admin.sb@piar.co', '$2b$10$Dq4nCd90yN.vA2pUWEExt.RqvzXiW9zut1gXcZxpgKFHuW4AoWkB2', 'administrador')
ON CONFLICT (correo) DO NOTHING;

-- Áreas del plan de estudios (Ley 115) para la institución principal
INSERT INTO area (institucion_id, nombre) VALUES (1, 'Ciencias Naturales y Educación Ambiental') ON CONFLICT DO NOTHING;
INSERT INTO area (institucion_id, nombre) VALUES (1, 'Ciencias Sociales, Historia, Geografía y Democracia') ON CONFLICT DO NOTHING;
INSERT INTO area (institucion_id, nombre) VALUES (1, 'Educación Artística y Cultural') ON CONFLICT DO NOTHING;
INSERT INTO area (institucion_id, nombre) VALUES (1, 'Educación Ética y en Valores Humanos') ON CONFLICT DO NOTHING;
INSERT INTO area (institucion_id, nombre) VALUES (1, 'Educación Física, Recreación y Deportes') ON CONFLICT DO NOTHING;
INSERT INTO area (institucion_id, nombre) VALUES (1, 'Educación Religiosa') ON CONFLICT DO NOTHING;
INSERT INTO area (institucion_id, nombre) VALUES (1, 'Humanidades, Lengua Castellana e Idiomas Extranjeros') ON CONFLICT DO NOTHING;
INSERT INTO area (institucion_id, nombre) VALUES (1, 'Matemáticas') ON CONFLICT DO NOTHING;
INSERT INTO area (institucion_id, nombre) VALUES (1, 'Tecnología e Informática') ON CONFLICT DO NOTHING;

-- Catálogo de ajustes razonables sugeridos (MEN)
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('actividades', 'Contextualizar la tarea y dar más tiempo para resolverla.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('actividades', 'Demostrar la tarea con un ejemplo antes de que el estudiante la realice.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('actividades', 'Leer en voz alta las instrucciones y los enunciados.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('actividades', 'Ubicar al estudiante estratégicamente en el aula.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('actividades', 'Ofrecer la evaluación de forma oral.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('materiales', 'Material en alto contraste de color.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('materiales', 'Material táctil o en relieve y mobiliario adaptado.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('materiales', 'Textos en macrotipo y uso de lupas.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('materiales', 'Agendas visuales y apoyos gráficos.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('espacios', 'Señalización y contrastes en puertas y ventanas.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('espacios', 'Buena iluminación del espacio de trabajo.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('comunicacion', 'Sistemas aumentativos y alternativos: pictogramas y tableros de comunicación.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('comunicacion', 'Uso de lengua de señas o gestos de apoyo.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('apoyos_humanos', 'Acompañamiento de intérprete o modelo lingüístico.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('apoyos_humanos', 'Mediación del docente de apoyo o tiflólogo.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('tecnologias', 'Lector de pantalla para el acceso a textos digitales.') ON CONFLICT DO NOTHING;
INSERT INTO catalogo_ajuste (tipo, descripcion) VALUES ('tecnologias', 'Amplificador de voz o de imagen y uso de tableta.') ON CONFLICT DO NOTHING;

-- Instituciones y estudiantes demo distribuidos (pueblan el mapa de estadísticas)
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES (2, 2, 'I.E. Antonio Derka', 'Sede A') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-1', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-2', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-3', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-4', '5') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-5', '6') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-6', '7') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-7', '8') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-8', '9') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-9', '10') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-10', '11') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-11', '1') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-12', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-13', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (2, 'Estudiante 2-14', '4') ON CONFLICT DO NOTHING;
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES (3, 5, 'I.E.D. La Candelaria', 'Sede A') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-1', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-2', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-3', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-4', '5') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-5', '6') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-6', '7') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-7', '8') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-8', '9') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-9', '10') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-10', '11') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-11', '1') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-12', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-13', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-14', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-15', '5') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-16', '6') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-17', '7') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-18', '8') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-19', '9') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-20', '10') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-21', '11') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (3, 'Estudiante 3-22', '1') ON CONFLICT DO NOTHING;
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES (4, 31, 'I.E. Santa Librada', 'Sede A') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-1', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-2', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-3', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-4', '5') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-5', '6') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-6', '7') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-7', '8') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-8', '9') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-9', '10') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-10', '11') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (4, 'Estudiante 4-11', '1') ON CONFLICT DO NOTHING;
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES (5, 4, 'I.E. Barranquilla', 'Sede A') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (5, 'Estudiante 5-1', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (5, 'Estudiante 5-2', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (5, 'Estudiante 5-3', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (5, 'Estudiante 5-4', '5') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (5, 'Estudiante 5-5', '6') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (5, 'Estudiante 5-6', '7') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (5, 'Estudiante 5-7', '8') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (5, 'Estudiante 5-8', '9') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (5, 'Estudiante 5-9', '10') ON CONFLICT DO NOTHING;
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES (6, 6, 'I.E. Soledad Acosta', 'Sede A') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (6, 'Estudiante 6-1', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (6, 'Estudiante 6-2', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (6, 'Estudiante 6-3', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (6, 'Estudiante 6-4', '5') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (6, 'Estudiante 6-5', '6') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (6, 'Estudiante 6-6', '7') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (6, 'Estudiante 6-7', '8') ON CONFLICT DO NOTHING;
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES (7, 23, 'I.E. Misael Pastrana', 'Sede A') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (7, 'Estudiante 7-1', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (7, 'Estudiante 7-2', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (7, 'Estudiante 7-3', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (7, 'Estudiante 7-4', '5') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (7, 'Estudiante 7-5', '6') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (7, 'Estudiante 7-6', '7') ON CONFLICT DO NOTHING;
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES (8, 22, 'I.E. Ciudad de Pasto', 'Sede A') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (8, 'Estudiante 8-1', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (8, 'Estudiante 8-2', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (8, 'Estudiante 8-3', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (8, 'Estudiante 8-4', '5') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (8, 'Estudiante 8-5', '6') ON CONFLICT DO NOTHING;
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES (9, 8, 'I.E. Chipre', 'Sede A') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (9, 'Estudiante 9-1', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (9, 'Estudiante 9-2', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (9, 'Estudiante 9-3', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (9, 'Estudiante 9-4', '5') ON CONFLICT DO NOTHING;
INSERT INTO institucion (id, municipio_id, nombre, sede) VALUES (10, 21, 'I.E. Los Centauros', 'Sede A') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (10, 'Estudiante 10-1', '2') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (10, 'Estudiante 10-2', '3') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (10, 'Estudiante 10-3', '4') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (10, 'Estudiante 10-4', '5') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (10, 'Estudiante 10-5', '6') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (10, 'Estudiante 10-6', '7') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (10, 'Estudiante 10-7', '8') ON CONFLICT DO NOTHING;
INSERT INTO estudiante (institucion_id, nombres, grado) VALUES (10, 'Estudiante 10-8', '9') ON CONFLICT DO NOTHING;
SELECT setval('institucion_id_seq', 10, true);
