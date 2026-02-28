import React, { useState, useEffect } from 'react';

// --- ⚡ CONFIGURACIÓN MAESTRA (V21.0 - CON LOGS DE ERROR) ---

// 1. LECTURA (Firebase)
const FIREBASE_DB_URL = "https://portal-creo-db-default-rtdb.firebaseio.com/docentes/";

// 2. ESCRITURA DE LOGS (Tu Script de Google)
const URL_SCRIPT_LOGS = "https://script.google.com/macros/s/AKfycbzME0D_wVP6l4AxLsZMFT4gIDJoD5LAlUhrQ1OL3Al1tAUZZvmiiF1VOlYmiUqY_DeL/exec";

// 3. ACCESO AL EXCEL MAESTRO
const URL_TU_EXCEL_MAESTRO = "https://docs.google.com/spreadsheets/d/1fHgj_yep0s7955EeaRpFiJeBLJX_-PLtjOFxWepoprQ/edit";

const URL_FIREBASE_CONSOLE = "https://console.firebase.google.com/";
const WHATSAPP_NUMBER = "573106964025";
const ADMIN_PASS = "admincreo";

// --- COMPONENTE TOAST ---
const Toast = ({ msg, show }) => (
    <div className={`toast-notification ${show ? 'show' : ''}`}>{msg}</div>
);

const App = () => {
    const [view, setView] = useState('user');
    const [passInput, setPassInput] = useState('');

    // Estados Usuario
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [docente, setDocente] = useState(null);
    const [selectedCursoIdx, setSelectedCursoIdx] = useState(0);

    // Estados Admin (Diagnóstico)
    const [adminSearch, setAdminSearch] = useState('');
    const [adminResult, setAdminResult] = useState(null);

    const [fechaActual, setFechaActual] = useState(new Date());
    const [toast, setToast] = useState({ show: false, msg: '' });

    useEffect(() => {
        const timer = setInterval(() => setFechaActual(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatoFechaHora = () => {
        const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
        const fecha = fechaActual.toLocaleDateString('es-CO', opcionesFecha);
        const hora = fechaActual.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        return { fecha: fecha.charAt(0).toUpperCase() + fecha.slice(1), hora: hora };
    };

    const showToast = (mensaje) => {
        setToast({ show: true, msg: mensaje });
        setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    };

    // --- FUNCIÓN DE REGISTRO DE LOGS ---
    const registrarLog = (documento, accion) => {
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
            }).catch(() => console.log("Error enviando log"));
        } catch (e) { console.error("Error en registrarLog:", e); }
    };



    const getSaludo = () => {
        const hora = new Date().getHours();
        if (hora < 12) return "Buenos días";
        if (hora < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    // --- BÚSQUEDA PRINCIPAL (CON REGISTRO DE ÉXITOS Y ERRORES) ---
    const handleSearch = (e) => {
        e.preventDefault();
        const idBusqueda = searchTerm.replace(/\D/g, '');
        if (!idBusqueda) { showToast('❌ Documento inválido'); return; }

        setLoading(true);
        setDocente(null);

        fetch(`${FIREBASE_DB_URL}${idBusqueda}.json`)
            .then(res => res.json())
            .then(data => {
                setLoading(false);
                if (data) {
                    const cursosProcesados = procesarCursos(data.cursos);
                    setDocente({ ...data, cursos: cursosProcesados });
                    setSelectedCursoIdx(0);
                    // LOG: ✅ ÉXITO
                    registrarLog(idBusqueda, '✅ Consulta Exitosa');
                } else {
                    showToast('❌ No encontrado');
                    // LOG: ❌ ERROR (Cédula no existe en Firebase)
                    registrarLog(idBusqueda, '❌ ID No Encontrado');
                }
            })
            .catch(() => {
                setLoading(false);
                showToast('⚠️ Error de Red');
                // LOG: ⚠️ FALLO TÉCNICO
                registrarLog(idBusqueda, '⚠️ Error Crítico de Red');
            });
    };

    // --- BÚSQUEDA DIAGNÓSTICO (Admin) ---
    const handleAdminDiagnostico = (e) => {
        e.preventDefault();
        const idBusqueda = adminSearch.replace(/\D/g, '');
        if (!idBusqueda) return;

        setAdminResult('Cargando...');
        fetch(`${FIREBASE_DB_URL}${idBusqueda}.json`)
            .then(res => res.json())
            .then(data => {
                if (data) setAdminResult(`✅ ENCONTRADO EN NUBE:\nNombre: ${data.nombre}\nCursos: ${data.cursos.length}`);
                else setAdminResult(`❌ NO EXISTE EN FIREBASE.`);
            })
            .catch(() => setAdminResult('⚠️ Error de conexión'));
    };

    const procesarCursos = (cursos) => {
        return cursos.map(curso => {
            const semanasProcesadas = [];
            const semanasRaw = curso.semanasRaw || [];
            semanasRaw.forEach((texto, i) => {
                if (i >= 16) return;
                if (!texto || texto.length < 5 || texto.startsWith("-") || texto.toLowerCase().includes("pendiente")) return;

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
                const horaMatch = texto.match(/(\d{1,2}\s*[aA]\s*\d{1,2})/i);
                let horaDisplay = horaMatch ? horaMatch[0] : "Programada";
                if (esTrabajoIndependiente) horaDisplay = "Todo el día";

                const partes = texto.split('-');
                let fechaDisplay = partes[0] || `Semana ${i + 1}`;
                fechaDisplay = fechaDisplay.replace(/^202[0-9]\s*\/\s*/, '').replace(/\s*\/\s*/g, '/');

                semanasProcesadas.push({
                    num: i + 1, fecha: fechaDisplay, hora: horaDisplay,
                    tipo: tipo, displayTexto: displayTexto, ubicacion: ubicacion,
                    zoomId: zoomId, zoomLink: finalLink
                });
            });
            return { ...curso, semanas: semanasProcesadas };
        });
    };

    const handleReset = () => { setDocente(null); setSearchTerm(''); setSelectedCursoIdx(0); };

    const handleLogin = (e) => {
        e.preventDefault();
        if (passInput === ADMIN_PASS) setView('admin');
        else alert("Contraseña incorrecta");
    };

    const cursoActivo = docente && docente.cursos.length > 0 ? docente.cursos[selectedCursoIdx] : null;

    // --- VISTA ADMIN ---
    if (view === 'admin') {
        return (
            <div style={{ fontFamily: 'Segoe UI', background: '#f4f6f8', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="fade-in-up" style={{ maxWidth: '800px', width: '100%', background: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                        <div>
                            <h2 style={{ color: '#003366', margin: 0 }}>PANEL DE CONTROL</h2>
                            <p style={{ color: '#666', margin: '5px 0 0' }}>Estado: 🟢 Operativo | Logs: 🟢 Activos</p>
                        </div>
                        <button onClick={() => setView('user')} style={{ cursor: 'pointer', padding: '10px 25px', borderRadius: '30px', border: 'none', background: '#f0f0f0', fontWeight: 'bold', color: '#333' }}>⬅ Volver</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div style={{ background: '#f5f9ff', padding: '25px', borderRadius: '20px', border: '1px solid #dbeafe' }}>
                            <h3 style={{ marginTop: 0, color: '#1e40af' }}>🕵️♂️ Diagnóstico Rápido</h3>
                            <p style={{ fontSize: '0.85rem', color: '#555' }}>Verifica cédulas sin generar registros de asistencia.</p>
                            <form onSubmit={handleAdminDiagnostico} style={{ marginTop: '15px' }}>
                                <input
                                    placeholder="Cédula a probar..."
                                    value={adminSearch}
                                    onChange={e => setAdminSearch(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ccc', marginBottom: '10px', boxSizing: 'border-box' }}
                                />
                                <button style={{ width: '100%', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Consultar Nube</button>
                            </form>
                            {adminResult && (
                                <pre style={{ background: 'white', padding: '10px', borderRadius: '10px', marginTop: '15px', fontSize: '0.85rem', border: '1px solid #ddd', whiteSpace: 'pre-wrap', color: '#333' }}>
                                    {adminResult}
                                </pre>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <h3 style={{ marginTop: 0, color: '#333' }}>🚀 Accesos Directos</h3>

                            <a href={URL_TU_EXCEL_MAESTRO} target="_blank" rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: '#27ae60', color: 'white', textDecoration: 'none', borderRadius: '15px', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(39, 174, 96, 0.3)' }}>
                                <span style={{ fontSize: '1.5rem' }}>📊</span>
                                <div>
                                    <div>Abrir Excel Maestro</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Gestión y Asistencia</div>
                                </div>
                            </a>

                            <a href={URL_FIREBASE_CONSOLE} target="_blank" rel="noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: '#f39c12', color: 'white', textDecoration: 'none', borderRadius: '15px', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(243, 156, 18, 0.3)' }}>
                                <span style={{ fontSize: '1.5rem' }}>🔥</span>
                                <div>
                                    <div>Consola Firebase</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Base de Datos en Vivo</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VISTA MANTENIMIENTO (EMERGENCIA) ---
    return (
        <div className="portal-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f6f8', fontFamily: 'Segoe UI, sans-serif' }}>
            <div className="glass-panel fade-in-up" style={{ textAlign: 'center', padding: '60px 40px', background: 'white', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', maxWidth: '600px', width: '90%' }}>
                <div style={{ fontSize: '5rem', marginBottom: '20px' }}>⚙️</div>
                <h1 style={{ color: '#003366', marginBottom: '15px', fontSize: '2.5rem', fontWeight: '800' }}>Portal en Mantenimiento</h1>
                <p style={{ color: '#666', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '30px' }}>
                    Estamos realizando actualizaciones importantes en el sistema para mejorar tu experiencia.<br /><br />
                    Por favor, intenta ingresar nuevamente más tarde.
                </p>
                <div style={{ padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    Disculpa las molestias ocasionadas.
                </div>
            </div>
            <style>{`
                .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default App;
