const MESES = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

const parseCourseDate = (fechaStr, horaStr) => {
  try {
    const parts = fechaStr.split('/').map(p => p.trim());
    let year = new Date().getFullYear();
    let day = null;
    let month = null;

    parts.forEach(p => {
      const num = parseInt(p);
      if (!isNaN(num)) {
        if (num > 2000) {
          year = num;
        } else if (num >= 1 && num <= 31 && !p.toLowerCase().includes('semana')) {
          // Solo asignar dia si no es parte de la palabra "Semana X"
          day = num;
        }
      } else {
        const m = MESES[p.toLowerCase()];
        if (m !== undefined) {
          month = m;
        }
      }
    });

    // Extract day from strings like "Semana 5" without months
    if (day !== null && month === null) {
      if (fechaStr.toLowerCase().includes('semana')) {
          day = null; // No real day found, it was just the week number
      }
    }

    if (day === null || month === null) return null;

    let hour = 9; // Default
    if (horaStr) {
      const horaLimpia = horaStr.toLowerCase();
      if (horaLimpia.includes('a')) {
        const horaParts = horaLimpia.split('a');
        hour = parseInt(horaParts[0].trim());
      } else {
        const num = parseInt(horaLimpia.trim());
        if (!isNaN(num)) hour = num;
      }
    }

    return new Date(year, month, day, hour);
  } catch (e) {
    return null;
  }
};

console.log('sábado / 07 / marzo =>', parseCourseDate('sábado / 07 / marzo', ''));
console.log('Semana 5 =>', parseCourseDate('Semana 5', ''));
console.log('11/05/2026 =>', parseCourseDate('11/05/2026', ''));
console.log('14 / marzo =>', parseCourseDate('14 / marzo', ''));
