export const URL_SCRIPT_LOGS = import.meta.env.VITE_SCRIPT_LOGS_URL;
export const URL_TU_EXCEL_MAESTRO = import.meta.env.VITE_EXCEL_MAESTRO_URL;
export const URL_FIREBASE_CONSOLE = import.meta.env.VITE_FIREBASE_CONSOLE_URL;

export const registrarLog = (documento, accion) => {
  try {
    const datosLog = {
      fecha: new Date().toLocaleString('es-CO'),
      doc: documento,
      estado: `[APP] ${accion}`
    };
    fetch(URL_SCRIPT_LOGS, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosLog)
    }).catch(err => console.log("Error enviando log:", err));

    // Si es una consulta exitosa, registrar también en Firebase Analytics
    if (accion.includes("Exitosa")) {
      recordFirebaseHit();
    }
  } catch (e) { console.error("Error en registrarLog:", e); }
};

const recordFirebaseHit = async () => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const secret = import.meta.env.VITE_FIREBASE_SECRET;
    const dbUrl = import.meta.env.VITE_FIREBASE_DB_BASE_URL;

    // Fetch current count
    const getRes = await fetch(`${dbUrl}/analytics/daily/${dateStr}.json`);
    const currentCount = await getRes.json() || 0;

    // Increment and save
    await fetch(`${dbUrl}/analytics/daily/${dateStr}.json?auth=${secret}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentCount + 1)
    });
  } catch (err) {
    console.error("Error administrando analytics:", err);
  }
};

const MESES = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

const parseCourseDate = (fechaStr, horaStr) => {
  try {
    // fechaStr format: "21 / febrero" (Year is handled separately or assumed current/next for logic)
    // Actually the input raw string has Year: "2026 / 21 / febrero"

    // Clean up string: "2026 / 21 / febrero" -> ["2026", "21", "febrero"]
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
          day = num;
        }
      } else {
        const m = MESES[p.toLowerCase()];
        if (m !== undefined) {
          month = m;
        }
      }
    });

    if (day !== null && month === null) {
      if (fechaStr.toLowerCase().includes('semana')) {
        day = null;
      }
    }

    if (day === null || month === null) return null;

    // Hora: "11 a 13" o "7 A 9" -> Take start hour "11" o "7"
    let hour = 9; // Default
    if (horaStr) {
      const horaLimpia = horaStr.toLowerCase().trim();
      // Only parse as 'a' range if it actually matches "number a number" or similar
      const matchA = horaLimpia.match(/^(\d+)\s*a\s*(\d+)$/);
      if (matchA) {
        hour = parseInt(matchA[1], 10);
      } else {
        const num = parseInt(horaLimpia);
        if (!isNaN(num)) hour = num;
      }
    }

    return new Date(year, month, day, hour);
  } catch (e) {
    console.warn("Error parseando fecha:", fechaStr, e);
    return null;
  }
};

export const procesarCursos = (cursos) => {
  if (!cursos || !Array.isArray(cursos)) return []; // Fix white screen crash

  const hoy = new Date();

  // Reset hours to compare dates only for "Present" day, but we want "Week" granularity.
  // Strategy: If date is < today (minus 1 day buffer), it's Past.
  // If date is today, it's Present.
  // If date is future, it's Future.

  return cursos.map(curso => {
    const semanasProcesadas = [];
    const semanasRaw = curso.semanasRaw || [];
    let lastValidStatus = 'future'; // Fallback logical if no previous date exists

    semanasRaw.forEach((texto, i) => {
      // Basic validation
      if (i >= 16) return;
      if (!texto || texto.length < 5 || texto.startsWith("-") || texto.toLowerCase().includes("pendiente")) return;

      // --- 1. Parsing Logic ---
      const partes = texto.split('-');
      // Example part[0]: "2026 / 21 / febrero"
      let fechaRaw = partes[0].trim();

      // Extract Hour: "11 a 13" -> part[1] typically
      // But data format varies. Example: "2026 / 21 / febrero-11 a 13- ..."
      // partes[1] is usually hour range if standard format.
      let horaRaw = partes[1] ? partes[1].trim() : "00 a 00";

      // Display Strings
      let fechaDisplay = fechaRaw.replace(/^202[0-9]\s*\/\s*/, '').replace(/\s*\/\s*/g, ' / '); // "21 / febrero"
      let horaDisplay = horaRaw;

      // --- 2. Build Date Object for Logic ---
      const fechaObj = parseCourseDate(fechaRaw, horaRaw);

      // --- 3. Content Logic (Zoom, Location, etc) ---
      let tipo = 'ZOOM';
      let displayTexto = '';
      let ubicacion = '';
      let finalLink = null;
      let zoomId = null;
      let esTrabajoIndependiente = false;
      const textoUpper = texto.toUpperCase();

      if (textoUpper.includes("TRABAJO INDEPEN") || textoUpper.includes("TRABAJO AUTONOMO")) {
        tipo = 'INDEPENDIENTE';
        displayTexto = "Trabajo Independiente";
        ubicacion = "Estudio Autónomo";
        esTrabajoIndependiente = true;
        horaDisplay = "Todo el día";
      }
      else if (textoUpper.includes("PRESENCIAL") || textoUpper.includes("CAMPUS")) {
        tipo = 'PRESENCIAL';
        displayTexto = "Campus Principal - Presencial";
        ubicacion = "Sede Principal";
        if (texto.includes("Salón") || texto.includes("Aula")) ubicacion = texto;
      }
      else {
        const idMatch = texto.match(/ID\s*[-:.]?\s*(\d{9,11})/i);
        zoomId = idMatch ? idMatch[1] : null;
        if (zoomId) finalLink = `https://zoom.us/j/${zoomId}`;
        else {
          const linkMatch = texto.match(/https?:\/\/[^\s,]+/);
          if (linkMatch && linkMatch[0]) {
            let cleanLink = linkMatch[0];
            if (cleanLink.includes("-USUARIO")) cleanLink = cleanLink.split("-USUARIO")[0];
            finalLink = cleanLink;
          }
        }
      }

      // --- 4. Determine Status (Past/Present/Future) ---
      let status = 'future';
      if (fechaObj && !isNaN(fechaObj.getTime())) {
        const todayDate = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const eventDateObj = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), fechaObj.getDate());

        if (eventDateObj < todayDate) {
          status = 'past';
        } else if (eventDateObj.getTime() === todayDate.getTime()) {
          if (esTrabajoIndependiente) {
            status = 'present'; // Si es independiente y es hoy, está en curso todo el día.
          } else {
            // Detectar hora exacta para ver si ya pasó o está por pasar
            let hInicio = 0;
            let hFin = 24;
            const hLimpia = horaRaw.toLowerCase().trim();
            const matchH = hLimpia.match(/^(\d+)\s*a\s*(\d+)$/);
            if (matchH) {
              hInicio = parseInt(matchH[1], 10);
              hFin = parseInt(matchH[2], 10);
            } else {
              const num = parseInt(hLimpia);
              if (!isNaN(num)) {
                hInicio = num;
                hFin = num + 2; // Asumimos default de 2 horas
              }
            }

            const currentHourDec = hoy.getHours() + (hoy.getMinutes() / 60);
            if (currentHourDec >= hInicio && currentHourDec < hFin) {
              status = 'present';
            } else if (currentHourDec >= hFin) {
              status = 'past';
            } else {
              status = 'future';
            }
          }
        } else {
          status = 'future';
        }

        lastValidStatus = status; // Update fallback for next iterations
      } else {
        // If the date is invalid (e.g. "Semana 5"), assume it continues the timeline from the previous node
        status = lastValidStatus;
      }



      const fechaValida = fechaObj && !isNaN(fechaObj.getTime());

      semanasProcesadas.push({
        num: i + 1,
        fecha: fechaDisplay,
        hora: horaDisplay,
        tipo: tipo,
        displayTexto: displayTexto,
        ubicacion: ubicacion,
        zoomId: zoomId,
        zoomLink: finalLink,
        status: status, // 'past', 'present', 'future'
        fechaObj: fechaValida ? fechaObj : null, // Passed for countdown logic
        fechaRaw: fechaValida ? fechaObj.toISOString() : null
      });
    });
    return { ...curso, semanas: semanasProcesadas };
  });
};

export const formatoFechaHora = (fechaActual) => {
  const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
  const fecha = fechaActual.toLocaleDateString('es-CO', opcionesFecha);
  const hora = fechaActual.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  return { fecha: fecha.charAt(0).toUpperCase() + fecha.slice(1), hora: hora };
};

export const getSaludo = () => {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 18) return "Buenas tardes";
  return "Buenas noches";
};
