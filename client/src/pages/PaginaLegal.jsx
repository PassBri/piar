import { Link } from 'react-router-dom';
import icono from '../assets/icono-app.png';
import Accesibilidad from '../components/Accesibilidad.jsx';

const CONTENIDO = {
  privacidad: {
    titulo: 'Política de privacidad y tratamiento de datos',
    intro:
      'PIAR gestiona información de estudiantes con discapacidad y de sus familias para apoyar el Plan Individual de Ajustes Razonables (Decreto 1421 de 2017). El tratamiento de estos datos se realiza conforme a la Ley 1581 de 2012 (habeas data) y al Decreto 1074 de 2015.',
    secciones: [
      {
        h: 'Responsable del tratamiento',
        p: 'La institución educativa que utiliza PIAR es la responsable del tratamiento de los datos personales de sus estudiantes. PIAR actúa como herramienta de apoyo para el registro y la gestión de la información, bajo las instrucciones de la institución.',
      },
      {
        h: 'Datos que se recolectan',
        p: 'Datos de identificación del estudiante, grado y sede, información del PIAR y sus anexos, caracterización de la discapacidad y los ajustes razonables acordados, así como datos de contacto de acudientes y del personal docente responsable de cada formato.',
      },
      {
        h: 'Finalidad',
        p: 'La información se usa únicamente para elaborar, actualizar y hacer seguimiento al PIAR de cada estudiante, coordinar los apoyos entre docentes, orientación escolar y coordinación, y generar los informes exigidos por la normativa educativa.',
      },
      {
        h: 'Datos de menores de edad',
        p: 'Al tratarse principalmente de niñas, niños y adolescentes, el tratamiento responde a su interés superior. El registro y la consulta se limitan al personal autorizado de la institución, y el acceso de cada docente se restringe a los estudiantes y áreas que tiene asignados.',
      },
      {
        h: 'Seguridad',
        p: 'El acceso se controla por usuario y contraseña con distintos niveles (rector, coordinación, orientación y docentes). La información se transmite de forma cifrada y se aplican controles para que un docente no pueda modificar la información registrada por otro.',
      },
      {
        h: 'Derechos de los titulares',
        p: 'Los titulares o sus representantes legales pueden conocer, actualizar, rectificar y solicitar la supresión de sus datos, así como revocar la autorización, dirigiéndose a la institución educativa responsable a través del canal de soporte.',
      },
    ],
    nota:
      'Este texto es una plantilla de referencia. Cada institución debe revisarlo y ajustarlo con su política interna de tratamiento de datos antes de publicarlo.',
  },
  soporte: {
    titulo: 'Soporte y ayuda',
    intro:
      'Si tienes dudas sobre el uso de PIAR o encuentras un inconveniente, aquí puedes orientarte y reportarlo.',
    secciones: [
      {
        h: '¿Olvidaste tu contraseña?',
        p: 'Comunícate con la coordinación o la persona administradora de PIAR en tu institución; ellos pueden restablecer tu acceso. PIAR no envía contraseñas por correo.',
      },
      {
        h: 'Roles y permisos',
        p: 'Cada usuario ve y edita solo lo que le corresponde. La asignación de áreas, cursos y carga académica, y la definición de quién llena cada formato, la realizan la coordinación y la orientación escolar desde Administración.',
      },
      {
        h: 'Reportar un problema',
        p: 'Describe qué estabas haciendo, en qué estudiante o formato ocurrió y, si puedes, adjunta una captura de pantalla. Entre más detalle, más rápido se resuelve.',
      },
      {
        h: 'Contacto',
        p: 'Escribe al correo de soporte de tu institución o a la persona administradora de PIAR designada en tu colegio.',
      },
    ],
    nota: null,
  },
  terminos: {
    titulo: 'Términos de uso',
    intro:
      'El uso de PIAR implica la aceptación de estas condiciones por parte del personal autorizado de la institución educativa.',
    secciones: [
      {
        h: 'Uso autorizado',
        p: 'PIAR es una herramienta institucional de uso profesional y educativo. Las credenciales son personales e intransferibles, y cada usuario es responsable de la información que registra con su cuenta.',
      },
      {
        h: 'Confidencialidad',
        p: 'La información de los estudiantes es reservada. El usuario se compromete a no divulgar, copiar ni usar los datos para fines distintos al apoyo del PIAR y al cumplimiento de la normativa educativa.',
      },
      {
        h: 'Responsabilidad sobre la información',
        p: 'La veracidad y actualización de los datos del PIAR son responsabilidad del personal que los diligencia. PIAR facilita el registro y el seguimiento, pero no reemplaza las decisiones pedagógicas de la institución.',
      },
      {
        h: 'Disponibilidad',
        p: 'Se procura mantener el servicio disponible de forma continua. Pueden presentarse interrupciones por mantenimiento o causas técnicas, y se recomienda guardar los avances con regularidad.',
      },
    ],
    nota:
      'Este texto es una plantilla de referencia que cada institución puede ajustar según sus políticas.',
  },
};

export default function PaginaLegal({ tipo }) {
  const data = CONTENIDO[tipo] || CONTENIDO.privacidad;
  return (
    <div className="legal-wrap">
      <div className="legal-card">
        <Link to="/login" className="legal-volver">← Volver al inicio de sesión</Link>
        <div className="legal-marca">
          <img src={icono} alt="" className="legal-icono" />
          <span>PIAR · Plan Individual de Ajustes Razonables</span>
        </div>
        <h1 className="legal-titulo">{data.titulo}</h1>
        <p className="legal-intro">{data.intro}</p>
        {data.secciones.map((s) => (
          <section key={s.h} className="legal-seccion">
            <h2>{s.h}</h2>
            <p>{s.p}</p>
          </section>
        ))}
        {data.nota && <p className="legal-nota">{data.nota}</p>}
        <footer className="legal-footer">
          <Link to="/privacidad">Privacidad</Link>
          <span>·</span>
          <Link to="/soporte">Soporte</Link>
          <span>·</span>
          <Link to="/terminos">Términos</Link>
        </footer>
      </div>
      <Accesibilidad anclaje="fab" />
    </div>
  );
}
