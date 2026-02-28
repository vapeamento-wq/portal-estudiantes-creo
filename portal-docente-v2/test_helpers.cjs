const cursos = [{
  semanasRaw: [
    'sábado / 07 / marzo-7 A 9- TRABAJO INDEPENDIENTE',
    'sábado / 14 / marzo-7 A 9- ID 123456789',
    'Semana 5- - Trabajo Independiente',
    'sábado / 28 / marzo-7 A 9- TRABAJO INDEPENDIENTE'
  ]
}];

import('./src/utils/helpers.js').then(h => {
  const processed = h.procesarCursos(cursos);
  console.log(processed[0].semanas);
});
