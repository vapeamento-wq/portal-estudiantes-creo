const cursos = [{
  semanasRaw: [
    'sábado / 07 / marzo-7 A 9- TRABAJO INDEPENDIENTE',
    'sábado / 14 / marzo-7 A 9- ID 123456789',
    'Semana 5- - Trabajo Independiente',
    'sábado / 28 / marzo-7 A 9- TRABAJO INDEPENDIENTE'
  ]
}];

const MESES = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

const parseCourseDate = (fechaStr, horaStr) => {
    const parts = fechaStr.split('/').map(p => p.trim());
    let year = 2026;
    let day = null;
    let month = null;

    parts.forEach(p => {
      const num = parseInt(p);
      if (!isNaN(num)) {
        if (num > 2000) {
          year = num;
        } else if (num >= 1 && num <= 31 && !p.toLowerCase().includes('semana')) {
          day = num;
        }
      } else {
        const m = MESES[p.toLowerCase()];
        if (m !== undefined) {
          month = m;
        }
      }
    });

    if (day === null || month === null) return null;

    return new Date(year, month, day, 9);
};

const processed = cursos.map(curso => {
  const semanasProcesadas = [];
  curso.semanasRaw.forEach((texto, i) => {
    const partes = texto.split('-');
    let fechaRaw = partes[0].trim();
    let horaRaw = partes[1] ? partes[1].trim() : "00 a 00";
    const fechaObj = parseCourseDate(fechaRaw, horaRaw);
    let status = 'future'; // We need to figure out what to do if fechaObj is null!
    
    // In current helpers.js, if fechaObj is valid, it compares...
    // If NOT valid, what was happening? status remained 'future', BUT wait. In processing:
    semanasProcesadas.push({ num: i + 1, fechaRaw, fechaObj, status });
  });
  return { ...curso, semanas: semanasProcesadas };
});

console.log(processed[0].semanas);
