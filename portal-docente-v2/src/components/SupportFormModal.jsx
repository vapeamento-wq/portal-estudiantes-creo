import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackAppEvent } from '../App';

const URL_SCRIPT_LOGS = import.meta.env.VITE_SCRIPT_LOGS_URL;

const SupportFormModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        codigo: '',
        mensaje: ''
    });
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre || !formData.codigo || !formData.mensaje) {
            setErrorMessage('Por favor completa todos los campos.');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            trackAppEvent("submit_support_form");
            const response = await fetch(URL_SCRIPT_LOGS, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: "reporte_soporte",
                    nombre: formData.nombre,
                    codigo: formData.codigo,
                    mensaje: formData.mensaje
                })
            });

            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                setFormData({ nombre: '', codigo: '', mensaje: '' });
            }, 3000);

        } catch (error) {
            console.error("Error enviando formulario:", error);
            setStatus('error');
            setErrorMessage('Hubo un problema al enviar tu mensaje. Intenta de nuevo más tarde.');
            trackAppEvent("error_support_form");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay oscuro */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={status === 'loading' ? null : onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
                    >
                        {/* Contenedor del Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
                        >
                            {/* Header del Modal */}
                            <div className="bg-[#003366] p-5 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="m-0 text-xl font-bold flex items-center gap-2">
                                        <span>🎧</span> Soporte Técnico
                                    </h3>
                                    <p className="text-[#db9b32] text-xs m-0 mt-1 uppercase tracking-wider font-bold">Portal Estudiantes CREO</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    disabled={status === 'loading'}
                                    className="text-white/70 hover:text-white bg-transparent border-none text-2xl cursor-pointer p-0 leading-none disabled:opacity-50"
                                    aria-label="Cerrar"
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Contenido/Formulario */}
                            <div className="p-6">
                                {status === 'success' ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-6"
                                    >
                                        <div className="text-5xl mb-4">✅</div>
                                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">¡Mensaje Enviado!</h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Tu solicitud ha sido enviada al equipo de soporte de CREO. Te contactaremos pronto.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 mt-0">
                                            ¿Tienes problemas para ver tus horarios? Escríbenos y lo revisaremos.
                                        </p>

                                        {errorMessage && (
                                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                                                <span>⚠️</span> {errorMessage}
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="nombre" className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Nombre Completo</label>
                                            <input
                                                id="nombre"
                                                name="nombre"
                                                type="text"
                                                required
                                                placeholder="Ej: María Pérez"
                                                value={formData.nombre}
                                                onChange={handleChange}
                                                disabled={status === 'loading'}
                                                className="w-full p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] transition-all"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="codigo" className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Código Estudiantil</label>
                                            <input
                                                id="codigo"
                                                name="codigo"
                                                type="text"
                                                required
                                                placeholder="Tu código de estudiante"
                                                value={formData.codigo}
                                                onChange={handleChange}
                                                disabled={status === 'loading'}
                                                className="w-full p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] transition-all"
                                            />
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <label htmlFor="mensaje" className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Mensaje o Problema</label>
                                            <textarea
                                                id="mensaje"
                                                name="mensaje"
                                                required
                                                rows="3"
                                                placeholder="Describe tu problema brevemente..."
                                                value={formData.mensaje}
                                                onChange={handleChange}
                                                disabled={status === 'loading'}
                                                className="w-full p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003366] transition-all resize-y"
                                            ></textarea>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={status === 'loading'}
                                            className="mt-2 w-full bg-[#db9b32] hover:bg-[#c68a2e] text-[#003366] font-extrabold py-3.5 px-6 rounded-xl transition-colors flex justify-center items-center shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {status === 'loading' ? (
                                                <svg className="animate-spin h-5 w-5 text-[#003366]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                'ENVIAR SOLICITUD'
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SupportFormModal;
