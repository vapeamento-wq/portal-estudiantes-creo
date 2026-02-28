import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { URL_TU_EXCEL_MAESTRO, URL_FIREBASE_CONSOLE, procesarCursos, registrarLog } from '../utils/helpers';

const FIREBASE_DB_URL = `${import.meta.env.VITE_FIREBASE_DB_BASE_URL}/estudiantes.json`;

// MOCK_ANALYTICS has been removed in favor of real Firebase data

const AdminPanel = ({ onBack, onSelectDocente }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [docentesList, setDocentesList] = useState([]);
    const [analyticsData, setAnalyticsData] = useState([]);
    const [filterDocente, setFilterDocente] = useState('');
    const [loadingDocentes, setLoadingDocentes] = useState(true);
    const [docentesListFull, setDocentesListFull] = useState([]); // Raw data for radar
    const [anuncioGlobal, setAnuncioGlobal] = useState('');
    const [anuncioInicio, setAnuncioInicio] = useState('');
    const [anuncioFin, setAnuncioFin] = useState('');
    const [guardandoAnuncio, setGuardandoAnuncio] = useState(false);
    const [mantenimientoActivo, setMantenimientoActivo] = useState(false);

    useEffect(() => {
        // Fetch current teachers on mount
        const fetchData = async () => {
            try {
                // Fetch Teachers
                const resDocentes = await fetch(FIREBASE_DB_URL);
                const dataDocentes = await resDocentes.json();
                if (dataDocentes) {
                    const list = Object.values(dataDocentes).map(d => ({
                        id: d.idReal,
                        nombre: d.nombre,
                        cursosCount: d.cursos ? d.cursos.length : 0
                    }));
                    setDocentesList(list);
                    setDocentesListFull(Object.values(dataDocentes));
                } else {
                    setDocentesList([]);
                    setDocentesListFull([]);
                }

                // Fetch Analytics
                const dbBaseUrl = import.meta.env.VITE_FIREBASE_DB_BASE_URL;
                const resStats = await fetch(`${dbBaseUrl}/analytics/daily.json`);
                const dataStats = await resStats.json();
                if (dataStats) {
                    // Convert object {"YYYY-MM-DD": count} to array [{name: "DD/MM", consultas: count}]
                    const formattedStats = Object.keys(dataStats).slice(-10).map(dateStr => {
                        const [yyyy, mm, dd] = dateStr.split('-');
                        return { name: `${dd}/${mm}`, consultas: dataStats[dateStr] };
                    });
                    setAnalyticsData(formattedStats);
                }

                // Fetch Global Announcement
                const resAnuncio = await fetch(`${dbBaseUrl}/config/anuncio.json`);
                const dataAnuncio = await resAnuncio.json();
                if (dataAnuncio) {
                    if (dataAnuncio.texto) setAnuncioGlobal(dataAnuncio.texto);
                    if (dataAnuncio.inicio) setAnuncioInicio(dataAnuncio.inicio);
                    if (dataAnuncio.fin) setAnuncioFin(dataAnuncio.fin);
                    if (typeof dataAnuncio.mantenimiento !== 'undefined') {
                        setMantenimientoActivo(Boolean(dataAnuncio.mantenimiento));
                    }
                }
            } catch (err) {
                console.error("Error fetching admin data:", err);
            } finally {
                setLoadingDocentes(false);
            }
        };
        fetchData();
    }, []);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadResult('⏳ Analizando archivo Excel...');

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'dd/mm/yyyy' });

                // Detectamos la fila de los headers buscando palabras clave
                let headerRowIdx = -1;
                for (let i = 0; i < Math.min(20, rows.length); i++) {
                    const rowStr = (rows[i] || []).join(' ').toUpperCase();
                    if (rowStr.includes('ESTUDIANTE') || rowStr.includes('DOCENTE') || rowStr.includes('CÉDULA') || rowStr.includes('CEDULA')) {
                        headerRowIdx = i;
                        break;
                    }
                }

                if (headerRowIdx === -1) {
                    setUploading(false);
                    setUploadResult('⚠️ Error: No se pudo detectar la fila de títulos en el Excel. Asegúrese de que existan columnas como "NOMBRE ESTUDIANTE" o "CÉDULA".');
                    return;
                }

                const headers = rows[headerRowIdx] || [];
                const colMap = {};

                // Mapeo dinámico: guardamos { "CÉDULA": 7, "NOMBRE DOCENTE": 6, "ASIGNATURA": 9, "SEMANA 1": 50, etc. }
                headers.forEach((h, idx) => {
                    if (h === undefined || h === null) return;
                    const cleanH = String(h).trim().toUpperCase();
                    colMap[cleanH] = idx;
                });

                // Helper para encontrar columnas aproximadas (por si le cambiaron un espacio o tilde)
                const findCol = (keywords) => {
                    for (const [header, idx] of Object.entries(colMap)) {
                        if (keywords.some(k => header.includes(k))) return idx;
                    }
                    return -1; // No encontrada
                };

                // Identificamos las columnas críticas dinámicamente
                const idxNombre = findCol(['NOMBRE ESTUDIANTE', 'ESTUDIANTE', 'ALUMNO', 'NOMBRE DOCENTE', 'PROFESOR', 'DOCENTE']);
                const idxCedula = findCol(['CÉDULA', 'CEDULA', 'DOCUMENTO', 'ID']);
                const idxMateria = findCol(['ASIGNATURA', 'MATERIA', 'CURSO']);
                const idxGrupo = findCol(['GRUPO', 'GRUPO TUTORIAL']);
                const idxBloque = findCol(['BLOQUE']);
                const idxFInicio = findCol(['FECHA I', 'INICIAL', 'F. INICIO', 'FINICIO', 'FECHA INICIAL', 'FECHA INICIO']);
                const idxFFin = findCol(['FECHA F', 'FINAL', 'F. FIN', 'FFIN', 'FECHA FINAL']);

                // Identificamos las columnas de SEMANA 1 a 16 inteligentemente
                // Si hay varias columnas que se llaman "Semana 1", evalúa el contenido de las filas
                // para elegir la columna que realmente tiene texto largo (fechas, links de zoom)
                // y no las columnas de resumen vacías o con códigos cortos (como V, Z5M).
                const semanasColIndexes = [];
                for (let s = 1; s <= 16; s++) {
                    const candidateIndexes = [];
                    for (let i = 0; i < headers.length; i++) {
                        if (headers[i] === undefined || headers[i] === null) continue;
                        const header = String(headers[i]).trim().toUpperCase();

                        // Regex estricto para evitar falsos positivos
                        const regexStarts = new RegExp(`^(SEMANA|SEM|S)\\s*0?${s}$`);
                        const regexIncludes = new RegExp(`\\b(SEMANA|SEM)\\s*0?${s}\\b`);

                        if (regexStarts.test(header) || regexIncludes.test(header)) {
                            candidateIndexes.push(i);
                        }
                    }

                    let bestIdx = -1;
                    if (candidateIndexes.length === 1) {
                        bestIdx = candidateIndexes[0];
                    } else if (candidateIndexes.length > 1) {
                        let maxScore = -1;
                        for (const idx of candidateIndexes) {
                            let score = 0;
                            // Muestrear hasta 50 filas para sumar la longitud del texto
                            const limit = Math.min(rows.length, headerRowIdx + 50);
                            for (let r = headerRowIdx + 1; r < limit; r++) {
                                if (rows[r] && rows[r][idx]) {
                                    score += String(rows[r][idx]).trim().length;
                                }
                            }
                            if (score > maxScore) {
                                maxScore = score;
                                bestIdx = idx;
                            }
                        }
                    }
                    semanasColIndexes.push(bestIdx !== -1 ? bestIdx : -1);
                }

                if (idxNombre === -1 || idxCedula === -1) {
                    setUploading(false);
                    setUploadResult('⚠️ Error: No se encontraron las columnas de Nombre o Cédula en el Excel (tituladas "NOMBRE ESTUDIANTE" y "CÉDULA").');
                    return;
                }

                let docentesDB = {};
                let countCursos = 0;

                // Empezar a leer desde la fila siguiente al header
                for (let i = headerRowIdx + 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;

                    const nombreProfesor = row[idxNombre];
                    let documento = row[idxCedula];
                    const asignatura = idxMateria !== -1 ? row[idxMateria] : 'Sin Asignatura';

                    if (!documento || !nombreProfesor || !asignatura) continue;

                    // Limpiar cédula
                    documento = String(documento).replace(/\D/g, '');
                    if (!documento) continue;

                    // Extraer los datos del curso
                    const curso = {
                        materia: asignatura,
                        grupo: idxGrupo !== -1 ? (row[idxGrupo] || '') : '',
                        bloque: idxBloque !== -1 ? (row[idxBloque] || '') : '',
                        fInicio: idxFInicio !== -1 ? (row[idxFInicio] || '') : '',
                        fFin: idxFFin !== -1 ? (row[idxFFin] || '') : '',
                        semanasRaw: []
                    };

                    // Extraer las 16 semanas dinámicas
                    for (let s = 0; s < 16; s++) {
                        const colIdx = semanasColIndexes[s];
                        if (colIdx !== -1 && row[colIdx]) {
                            curso.semanasRaw.push(row[colIdx]);
                        } else {
                            curso.semanasRaw.push('-');
                        }
                    }

                    // Insertar en la base de datos
                    if (!docentesDB[documento]) {
                        docentesDB[documento] = {
                            idReal: documento,
                            nombre: nombreProfesor,
                            cursos: []
                        };
                    }
                    docentesDB[documento].cursos.push(curso);
                    countCursos++;
                }

                const countDocentes = Object.keys(docentesDB).length;

                if (countDocentes === 0) {
                    setUploading(false);
                    setUploadResult('⚠️ El archivo no contiene datos válidos o el formato no coincide.');
                    return;
                }

                setUploadResult(`🚀 Subiendo ${countDocentes} estudiantes y ${countCursos} cursos a Firebase...`);

                // Sincronizar directo a Firebase con autenticación secreta
                const secretAuth = import.meta.env.VITE_FIREBASE_SECRET;
                const res = await fetch(`${FIREBASE_DB_URL}?auth=${secretAuth}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(docentesDB)
                });

                if (res.ok) {
                    setUploadResult(`✅ ¡Base de datos de Firebase actualizada con éxito!\nEstudiantes: ${countDocentes} \nCursos: ${countCursos} `);
                } else {
                    setUploadResult(`❌ Error de red al sincronizar con Firebase: ${res.statusText} `);
                }
            } catch (err) {
                console.error(err);
                setUploadResult(`❌ Error procesando el Excel: ${err.message} `);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Calculate Radar (Active Today)
    const [radarHoy, setRadarHoy] = useState([]);
    useEffect(() => {
        if (!docentesListFull.length) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activosMap = new Map(); // Use map for deduplication

        docentesListFull.forEach(docente => {
            if (!docente.cursos || docente.cursos.length === 0) return;

            // Procesamos los cursos usando helper para obtener fechas y status precisos calculados en tiempo real
            const cursosProcesados = procesarCursos(docente.cursos);

            cursosProcesados.forEach(curso => {
                if (!curso.semanas) return;

                curso.semanas.forEach(semana => {
                    // Queremos los que pasen hoy y que tengan zoomLink (ignorar independientes)
                    if (semana.fechaObj && semana.tipo !== 'INDEPENDIENTE' && semana.zoomLink) {
                        const eventDate = new Date(semana.fechaObj);
                        eventDate.setHours(0, 0, 0, 0);

                        if (eventDate.getTime() === today.getTime()) {

                            // Clave única para deduplicar: ID Docente + Hora Exacta + Rango de horas texto
                            const uniqueKey = `${docente.idReal}_${semana.fechaObj.getTime()}_${semana.hora} `;

                            if (activosMap.has(uniqueKey)) {
                                // Ya existe una clase de este profe a esta hora. Combinar nombres de materia.
                                const existing = activosMap.get(uniqueKey);
                                // Evitar duplicar nombres si la materia se llama igual en varios grupos
                                if (!existing.cursoMateria.includes(curso.materia)) {
                                    existing.cursoMateria += ` / ${curso.materia} `;
                                }
                            } else {
                                // Nueva entrada
                                activosMap.set(uniqueKey, {
                                    idDocente: docente.idReal,
                                    nombreDocente: docente.nombre,
                                    cursoMateria: curso.materia,
                                    tipo: semana.tipo,
                                    hora: semana.hora,
                                    numSemana: semana.num,
                                    status: semana.status, // past, present, future (calculado por procesarCursos)
                                    zoomLink: semana.zoomLink,
                                    exactTime: semana.fechaObj.getTime()
                                });
                            }
                        }
                    }
                });
            });
        });
        const activos = Array.from(activosMap.values());

        // Ordenamos con sistema de prioridades:
        // 1. En Curso (present) -> Arriba
        // 2. Próximas (future) -> Medio
        // 3. Terminadas (past) -> Abajo (Al final de la lista)
        // Dentro del mismo grupo de prioridad, ordenamos cronológicamente.

        const statusWeight = {
            'present': 0,
            'future': 1,
            'past': 2
        };

        activos.sort((a, b) => {
            const weightA = statusWeight[a.status];
            const weightB = statusWeight[b.status];

            if (weightA !== weightB) {
                return weightA - weightB; // Ordena por grupo (0, 1, 2)
            }

            // Si están en el mismo grupo de estado, ordena por hora real ascendente
            return a.exactTime - b.exactTime;
        });

        setRadarHoy(activos);
    }, [docentesListFull]);

    const handleGuardarAnuncio = async (e) => {
        e.preventDefault();
        setGuardandoAnuncio(true);
        try {
            const secretAuth = import.meta.env.VITE_FIREBASE_SECRET;
            const dbBaseUrl = import.meta.env.VITE_FIREBASE_DB_BASE_URL;
            await fetch(`${dbBaseUrl}/config/anuncio.json?auth=${secretAuth}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texto: anuncioGlobal,
                    inicio: anuncioInicio || null,
                    fin: anuncioFin || null,
                    fechaActualizacion: new Date().toISOString(),
                    mantenimiento: mantenimientoActivo
                })
            });
            alert('Anuncio Global actualizado y publicado con éxito.');
        } catch (err) {
            console.error(err);
            alert('Error al publicar el anuncio.');
        } finally {
            setGuardandoAnuncio(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f6f8] dark:bg-slate-900 p-5 flex flex-col items-center font-sans transition-colors duration-300">
            <div className="fade-in-up w-full max-w-5xl bg-white dark:bg-slate-800 p-10 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none transition-colors duration-300">

                <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-slate-700 pb-5">
                    <div>
                        <h2 className="text-[#003366] dark:text-blue-400 m-0 text-2xl font-bold">PANEL INTELIGENTE</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-0">Sincronización y Configuración</p>
                    </div>
                    <button onClick={onBack} className="cursor-pointer px-6 py-2.5 rounded-full border-none bg-gray-100 dark:bg-slate-700 font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">⬅ Volver</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">

                    {/* NUEVO: Subida de Excel Mágico */}
                    <div className="bg-[#f5f9ff] dark:bg-blue-900/20 p-6 rounded-2xl border-2 border-dashed border-[#007bff] text-center flex flex-col justify-center transition-colors">
                        <h3 className="m-0 mb-3 text-[#1e40af] dark:text-blue-300 text-xl font-bold">📥 Actualizar BD (Desde Excel)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Sube el archivo Excel actualizado. El sistema lo analizará y sincronizará en tiempo real con Firebase.</p>

                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="block mx-auto mb-4 text-sm text-gray-500 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 transition-colors cursor-pointer disabled:cursor-not-allowed dark:file:bg-blue-900/50 dark:file:text-blue-300"
                        />

                        {uploading && (
                            <div className="flex justify-center items-center gap-2 mb-4 text-[#007bff] dark:text-blue-400 font-bold text-sm">
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analizando y Sincronizando...
                            </div>
                        )}

                        {uploadResult && (
                            <pre className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-left whitespace-pre-wrap text-gray-800 dark:text-gray-300 mt-2 transition-colors">
                                {uploadResult}
                            </pre>
                        )}
                    </div>

                    {/* Chart 1: Daily Hits */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 h-[300px] transition-colors">
                        <h4 className="m-0 mb-5 text-[#003366] dark:text-blue-400 font-bold text-lg">📊 Consultas por Día</h4>
                        <ResponsiveContainer width="100%" height="85%">
                            {analyticsData.length > 0 ? (
                                <BarChart data={analyticsData}>
                                    <XAxis dataKey="name" fontSize={12} stroke="#888" />
                                    <YAxis fontSize={12} stroke="#888" allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="consultas" fill="#003366" radius={[4, 4, 0, 0]} className="dark:fill-blue-500" />
                                </BarChart>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                                    No hay suficientes datos registrados todavía.
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Existing Tools (Excel, Firebase) */}
                    <div className="flex flex-col gap-5">
                        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl flex flex-col gap-4 border border-transparent dark:border-slate-700 transition-colors justify-center">
                            <h4 className="m-0 font-bold dark:text-gray-200 text-lg">Accesos Rápidos</h4>
                            <a href={URL_TU_EXCEL_MAESTRO} target="_blank" rel="noreferrer" className="block p-4 bg-[#27ae60] text-white text-center rounded-xl no-underline font-bold hover:bg-[#219653] transition-colors shadow-sm">Excel Maestro</a>
                            <a href={URL_FIREBASE_CONSOLE} target="_blank" rel="noreferrer" className="block p-4 bg-[#f39c12] text-white text-center rounded-xl no-underline font-bold hover:bg-[#d68910] transition-colors shadow-sm">Firebase Console</a>
                        </div>
                    </div>
                </div>

                {/* NUEVO: Anuncio Global y Mantenimiento */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-100 dark:border-slate-700 pb-4">
                        <h4 className="m-0 text-[#003366] dark:text-blue-400 font-bold text-xl">📢 Anuncios & Mantenimiento</h4>

                        {/* THE SWITCH */}
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-200 dark:border-slate-600">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Modo Mantenimiento:</span>
                            <button
                                onClick={() => setMantenimientoActivo(!mantenimientoActivo)}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${mantenimientoActivo ? 'bg-red-500' : 'bg-gray-300 dark:bg-slate-600'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${mantenimientoActivo ? 'translate-x-8' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${mantenimientoActivo ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {mantenimientoActivo ? 'ACTIVADO' : 'Inactivo'}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleGuardarAnuncio} className="flex flex-col gap-4">
                        <textarea
                            value={anuncioGlobal}
                            onChange={(e) => setAnuncioGlobal(e.target.value)}
                            placeholder="Escribe un anuncio público aquí. Ej: Bienvenidos al nuevo semestre..."
                            className="w-full p-4 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 transition-all min-h-[100px] resize-y"
                        ></textarea>

                        <div className="flex flex-col md:flex-row gap-4 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                            <div className="flex-1 flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mostrar Desde (Opcional)</label>
                                <input
                                    type="datetime-local"
                                    value={anuncioInicio}
                                    onChange={(e) => setAnuncioInicio(e.target.value)}
                                    className="p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#003366] text-sm"
                                />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ocultar El (Opcional)</label>
                                <input
                                    type="datetime-local"
                                    value={anuncioFin}
                                    onChange={(e) => setAnuncioFin(e.target.value)}
                                    className="p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-[#003366] text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                                Si dejas las fechas en blanco y guardas un texto, se mostrará <b>inmediatamente</b> y por tiempo indefinido. Borra el texto para desactivarlo por completo.
                            </span>
                            <button type="submit" disabled={guardandoAnuncio} className="px-6 py-2.5 bg-[#003366] dark:bg-blue-600 text-white font-bold rounded-xl hover:bg-[#002244] dark:hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
                                {guardandoAnuncio ? 'Guardando...' : 'Guardar y Publicar'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* RADAR AND TABLE GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">

                    {/* RADAR DE HOY */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors flex flex-col h-[600px]">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="m-0 text-orange-500 font-bold text-lg flex items-center gap-2">🔥 Radar (Hoy)</h4>
                            <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 font-bold px-2.5 py-1 rounded-full text-xs">{radarHoy.length} Activos</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">Clases remotas programadas para el día de hoy ordenadas por hora.</p>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {radarHoy.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm py-10">No hay clases sincrónicas programadas para hoy.</div>
                            ) : (
                                radarHoy.map((act, i) => {
                                    // Determinar colores basados en el estado (gris=pasado, verde=presente, azul=futuro)
                                    let borderColor = 'border-blue-100/50 dark:border-blue-900/30';
                                    let bgColor = 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20';
                                    let indicatorColor = 'bg-blue-500';
                                    let statusText = 'Pendiente';

                                    if (act.status === 'past') {
                                        borderColor = 'border-gray-200 dark:border-slate-600';
                                        bgColor = 'bg-gray-50 dark:bg-slate-700/30 grayscale hover:grayscale-0';
                                        indicatorColor = 'bg-gray-400';
                                        statusText = 'Terminada';
                                    } else if (act.status === 'present') {
                                        borderColor = 'border-green-200 dark:border-green-800/50';
                                        bgColor = 'bg-green-50/50 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20';
                                        indicatorColor = 'bg-[#25D366] animate-pulse';
                                        statusText = 'En Curso';
                                    }

                                    return (
                                        <div
                                            key={i}
                                            className={`p-4 border rounded-xl transition-all relative overflow-hidden group ${bgColor} ${borderColor}`}
                                        >
                                            {/* Indicador de estado lateral */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${indicatorColor}`} />

                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                <div
                                                    className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-tight cursor-pointer hover:text-[#003366] dark:hover:text-blue-400 transition-colors"
                                                    onClick={() => onSelectDocente(act.idDocente)}
                                                    title="Ver perfil completo"
                                                >
                                                    {act.nombreDocente}
                                                </div>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ml-2 flex-shrink-0 ${act.status === 'past' ? 'bg-gray-200 text-gray-600' :
                                                    act.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {statusText}
                                                </span>
                                            </div>

                                            <div className="text-xs text-gray-600 dark:text-gray-400 font-bold mb-3 pl-2 opacity-80">Semana {act.numSemana} • {act.cursoMateria}</div>

                                            <div className="flex justify-between items-center pl-2">
                                                <span className="text-xs text-gray-500 font-bold flex items-center gap-1">⏰ {act.hora}</span>
                                                <a href={act.zoomLink} target="_blank" rel="noreferrer"
                                                    onClick={(e) => { e.stopPropagation(); registrarLog('admin', `Unido a clase de ${act.nombreDocente} (Sem ${act.numSemana})`); }}
                                                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer no-underline ${act.status === 'past' ? 'bg-gray-400 hover:bg-gray-500' :
                                                        act.status === 'present' ? 'bg-[#25D366] hover:bg-green-600 shadow-[0_2px_10px_rgba(37,211,102,0.2)]' :
                                                            'bg-[#2D8CFF] hover:bg-blue-600'
                                                        }`}
                                                >
                                                    🎥 Entrar
                                                </a>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Directorio de Docentes Real */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors overflow-hidden flex flex-col h-[600px]">
                        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                            <h4 className="m-0 text-[#003366] dark:text-blue-400 font-bold text-xl">👥 Directorio Sincronizado ({docentesList.length})</h4>
                            <form onSubmit={(e) => e.preventDefault()}>
                                <input
                                    type="text"
                                    placeholder="Buscar estudiante o cédula..."
                                    value={filterDocente}
                                    onChange={(e) => setFilterDocente(e.target.value)}
                                    className="p-3 w-full md:w-64 rounded-xl border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] transition-all font-medium text-sm"
                                />
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
                                    <tr className="border-b-2 border-gray-100 dark:border-slate-700">
                                        <th className="p-3 text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Nombre del Estudiante</th>
                                        <th className="p-3 text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Cédula</th>
                                        <th className="p-3 text-sm text-gray-500 dark:text-gray-400 uppercase font-bold">Cursos Asignados</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingDocentes ? (
                                        <tr>
                                            <td colSpan="3" className="p-10 text-center text-gray-500">
                                                <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-[#003366] dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Cargando estudiantes de Firebase...
                                            </td>
                                        </tr>
                                    ) : docentesList.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="p-6 text-center text-gray-500 dark:text-gray-400">No hay estudiantes sincronizados actualmente. Sube el Excel.</td>
                                        </tr>
                                    ) : (
                                        docentesList
                                            .filter(d =>
                                                d.nombre.toLowerCase().includes(filterDocente.toLowerCase()) ||
                                                d.id.includes(filterDocente)
                                            )
                                            .slice(0, 15) // Limit to top 15 matches for quick UI
                                            .map(d => (
                                                <tr
                                                    key={d.id}
                                                    onClick={() => onSelectDocente(d.id)}
                                                    className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group"
                                                >
                                                    <td className="p-3 font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#003366] dark:group-hover:text-blue-400 transition-colors">{d.nombre}</td>
                                                    <td className="p-3 text-gray-600 dark:text-gray-400 font-mono text-sm">{d.id}</td>
                                                    <td className="p-3 text-gray-600 dark:text-gray-400"><span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-bold px-2 py-1 rounded text-xs">{d.cursosCount}</span></td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
