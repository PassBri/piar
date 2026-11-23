import { useMemo, useState } from 'react';
import proj4 from 'proj4';
import geo from '../assets/colombia.geo.json';

function latLngAPunto(lat, lng, t) {
  const [px, py] = proj4(t.crs, [lng, lat]);
  return {
    x: (px - (t.xoffset || 0)) * (t.scale || 1) * (t.jsonres || 1) + (t.jsonmarginX || 0),
    y: (t.jsonmarginY || 0) - ((t.yoffset || 0) - py) * (t.scale || 1) * (t.jsonres || 1),
  };
}
function recorrer(coords, fn) {
  if (typeof coords[0] === 'number') { fn(coords); return; }
  coords.forEach((c) => recorrer(c, fn));
}

export default function MapaColombia({ municipios = [], departamentos = [], onSelect }) {
  const t = geo.transform;
  const [hover, setHover] = useState(null); // {tipo, nombre, x, y, colegios, estudiantes, departamento}

  const bbox = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    geo.features.forEach((f) => recorrer(f.geometry.coordinates, ([x, y]) => {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }));
    return { minX, minY, maxX, maxY };
  }, []);

  const W = bbox.maxX - bbox.minX;
  const H = bbox.maxY - bbox.minY;
  const sx = (x) => x - bbox.minX;
  const sy = (y) => bbox.maxY - y;

  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const maxEst = Math.max(1, ...departamentos.map((d) => Number(d.estudiantes)));
  const deptoDe = (nombre) => departamentos.find((x) => norm(x.departamento) === norm(nombre));
  const estDe = (nombre) => { const d = deptoDe(nombre); return d ? Number(d.estudiantes) : 0; };
  const colorDepto = (nombre) => {
    const v = estDe(nombre);
    if (v === 0) return '#ECEFF1';
    const p = Math.min(1, v / maxEst);
    const lerp = (a, b) => Math.round(a + (b - a) * p);
    return `rgb(${lerp(176, 55)},${lerp(190, 71)},${lerp(197, 79)})`;
  };

  function pathDe(geometry) {
    const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
    let d = '';
    polys.forEach((poly) => poly.forEach((ring) => {
      ring.forEach(([x, y], i) => { d += (i === 0 ? 'M' : 'L') + sx(x).toFixed(1) + ' ' + sy(y).toFixed(1); });
      d += 'Z';
    }));
    return d;
  }

  const maxMun = Math.max(1, ...municipios.map((m) => Number(m.estudiantes)));

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`-5 -5 ${W + 10} ${H + 10}`} style={{ width: '100%', height: 'auto', maxHeight: 560 }}>
        {geo.features.map((f, i) => {
          const nombre = f.properties.nombre;
          const activo = hover && hover.tipo === 'departamento' && hover.nombre === nombre;
          return (
            <path key={i} d={pathDe(f.geometry)}
              fill={colorDepto(nombre)}
              stroke={activo ? '#C9A227' : '#FFFFFF'} strokeWidth={activo ? 1.6 : 0.6}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => { const d = deptoDe(nombre); setHover({ tipo: 'departamento', nombre, colegios: d?.colegios || 0, estudiantes: estDe(nombre) }); }}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect && onSelect({ tipo: 'departamento', nombre, estudiantes: estDe(nombre), colegios: deptoDe(nombre)?.colegios || 0 })} />
          );
        })}
        {municipios.filter((m) => m.lat && m.lng).map((m) => {
          const p = latLngAPunto(Number(m.lat), Number(m.lng), t);
          const base = W * 0.007 + W * 0.013 * Math.sqrt(Number(m.estudiantes) / maxMun);
          const activo = hover && hover.tipo === 'municipio' && hover.nombre === m.municipio;
          return (
            <circle key={m.id} cx={sx(p.x).toFixed(1)} cy={sy(p.y).toFixed(1)} r={(activo ? base * 1.3 : base).toFixed(1)}
              fill="#C9A227" fillOpacity={activo ? 1 : 0.85} stroke="#37474F" strokeWidth={W * (activo ? 0.002 : 0.0012)}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHover({ tipo: 'municipio', nombre: m.municipio, departamento: m.departamento, colegios: m.colegios, estudiantes: m.estudiantes })}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect && onSelect({ tipo: 'municipio', nombre: m.municipio, departamento: m.departamento, colegios: m.colegios, estudiantes: m.estudiantes })} />
          );
        })}
      </svg>
      {hover && (
        <div style={{
          position: 'absolute', top: 8, left: 8, background: 'rgba(55,71,79,0.95)', color: '#fff',
          padding: '8px 12px', borderRadius: 8, fontSize: 13, pointerEvents: 'none', maxWidth: 240,
        }}>
          <strong>{hover.nombre}</strong>{hover.departamento ? ` · ${hover.departamento}` : ''}<br />
          {hover.colegios} colegio(s) · {hover.estudiantes} estudiante(s)
        </div>
      )}
    </div>
  );
}
