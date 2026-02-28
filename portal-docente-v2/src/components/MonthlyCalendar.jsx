import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { registrarLog } from '../utils/helpers';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MonthlyCalendar = ({ cursoActivo, docenteId }) => {
    // Determine the initial month to display based on the first valid future/present class, or just the first class
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        if (cursoActivo && cursoActivo.semanas && cursoActivo.semanas.length > 0) {
            // Find the first valid date
            const firstValid = cursoActivo.semanas.find(s => s.fechaObj);
            if (firstValid) {
                setCurrentDate(new Date(firstValid.fechaObj.getTime()));
            }
        }
    }, [cursoActivo]);

    if (!cursoActivo || !cursoActivo.semanas) return null;

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Calendar math
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = endOfMonth.getDate();

    // Day of week for the 1st of the month (0 = Sunday, 1 = Monday, etc.)
    // We want Monday = 0, Sunday = 6 for our grid
    let startDayOfWeek = startOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const previousMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
        setSelectedDay(null);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
        setSelectedDay(null);
    };

    // Filter course weeks to only those in the current viewing month
    const eventsThisMonth = cursoActivo.semanas.filter(s => {
        if (!s.fechaObj) return false;
        return s.fechaObj.getMonth() === currentMonth && s.fechaObj.getFullYear() === currentYear;
    });

    // Build grid cells
    const calendarCells = [];
    const totalCells = Math.ceil((daysInMonth + startDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
        const dayNumber = i - startDayOfWeek + 1;
        const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;

        let dayEvents = [];
        let isToday = false;

        if (isCurrentMonth) {
            const cellDateObj = new Date(currentYear, currentMonth, dayNumber);
            const hoy = new Date();
            if (cellDateObj.getDate() === hoy.getDate() && cellDateObj.getMonth() === hoy.getMonth() && cellDateObj.getFullYear() === hoy.getFullYear()) {
                isToday = true;
            }

            dayEvents = eventsThisMonth.filter(s => s.fechaObj && s.fechaObj.getDate() === dayNumber);
        }

        calendarCells.push({
            id: i,
            dayNumber: isCurrentMonth ? dayNumber : null,
            isCurrentMonth,
            isToday,
            events: dayEvents
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full"
        >
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl border border-gray-100 dark:border-slate-600">
                <button
                    onClick={previousMonth}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer text-gray-700 dark:text-gray-200 border-none bg-transparent"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h4 className="text-xl font-bold text-[#003366] dark:text-blue-400 capitalize m-0">
                    {MESES[currentMonth]} {currentYear}
                </h4>
                <button
                    onClick={nextMonth}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer text-gray-700 dark:text-gray-200 border-none bg-transparent"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {DIAS_SEMANA.map(dia => (
                    <div key={dia} className="text-center font-bold text-sm text-gray-500 dark:text-gray-400 py-2">
                        {dia}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 auto-rows-fr">
                {calendarCells.map(cell => (
                    <div
                        key={cell.id}
                        onClick={() => {
                            if (cell.isCurrentMonth && cell.events.length > 0) {
                                setSelectedDay(cell.id === selectedDay ? null : cell.id);
                            }
                        }}
                        className={`min-h-[80px] sm:min-h-[100px] p-2 rounded-xl border transition-all duration-300 relative flex flex-col items-center justify-center
                            ${!cell.isCurrentMonth ? 'bg-transparent border-transparent opacity-0' :
                                cell.events.length > 0 ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}
                            ${cell.id === selectedDay ? 'bg-[#003366] dark:bg-blue-600 border-[#003366] shadow-lg scale-105' :
                                cell.isToday ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                                    cell.isCurrentMonth ? 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 hover:border-[#db9b32] dark:hover:border-yellow-500' : ''
                            }`}
                    >
                        {cell.isCurrentMonth && (
                            <>
                                <div className={`text-center font-bold text-lg mb-1 ${cell.isToday ? 'text-[#2D8CFF]' : cell.id === selectedDay ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {cell.dayNumber}
                                </div>
                                <div className="flex flex-wrap justify-center gap-1 mt-1">
                                    {cell.events.map((ev, eIdx) => (
                                        <div
                                            key={eIdx}
                                            className={`w-2 h-2 rounded-full 
                                                ${ev.status === 'past' ? 'bg-gray-400 dark:bg-slate-500 opacity-60' :
                                                    ev.status === 'present' ? 'bg-[#25D366]' :
                                                        'bg-[#003366] dark:bg-blue-500'
                                                }`}
                                            title={ev.displayTexto}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Selected Day Details View */}
            <AnimatePresence>
                {selectedDay !== null && calendarCells[selectedDay] && calendarCells[selectedDay].events.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 overflow-hidden"
                    >
                        <h4 className="text-[#003366] dark:text-blue-400 m-0 mb-4 text-lg font-bold flex items-center justify-between">
                            <span>📅 Clases del {calendarCells[selectedDay].dayNumber} de {MESES[currentMonth]}</span>
                            <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer bg-transparent border-none">✖</button>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {calendarCells[selectedDay].events.map((ev, eIdx) => (
                                <div
                                    key={eIdx}
                                    className={`p-4 rounded-xl border flex flex-col gap-2 shadow-sm bg-white dark:bg-slate-700
                                        ${ev.status === 'past' ? 'border-gray-200 dark:border-slate-600 opacity-70 grayscale-[0.2]' :
                                            ev.status === 'present' ? 'border-[#25D366] ring-1 ring-[#25D366]/30' :
                                                'border-[#003366]/20 dark:border-blue-500/30'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase
                                                ${ev.status === 'past' ? 'bg-gray-100 text-gray-500 dark:bg-slate-600 dark:text-gray-300' :
                                                    ev.status === 'present' ? 'bg-green-100 text-green-700 mix-blend-multiply dark:mix-blend-normal dark:bg-green-900/30 dark:text-green-400' :
                                                        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {ev.status === 'past' ? 'Terminada' : ev.status === 'present' ? 'En Curso' : 'Pendiente'}
                                            </span>
                                        </div>
                                        <div className="text-xs font-bold text-gray-400">Semana {ev.num}</div>
                                    </div>

                                    <h5 className="font-bold text-gray-800 dark:text-gray-100 m-0 mt-1 leading-tight text-[0.95rem]">
                                        {ev.tipo === 'INDEPENDIENTE' ? '🏠 ' : '🏫 '} {ev.displayTexto}
                                    </h5>

                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">⏰ {ev.hora !== '00 a 00' ? ev.hora : 'Por Definir'}</span>
                                            {ev.ubicacion && ev.tipo === 'PRESENCIAL' && (
                                                <span className="text-[0.65rem] font-semibold text-gray-400 flex items-center gap-1">📍 {ev.ubicacion}</span>
                                            )}
                                        </div>

                                        {ev.zoomLink && (
                                            <div className="flex flex-col items-end gap-1">
                                                <a
                                                    href={ev.zoomLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer no-underline
                                                        ${ev.status === 'past' ? 'bg-gray-400 hover:bg-gray-500' :
                                                            ev.status === 'present' ? 'bg-[#25D366] hover:bg-green-600 shadow-[0_2px_10px_rgba(37,211,102,0.2)]' :
                                                                'bg-[#2D8CFF] hover:bg-blue-600'
                                                        }`}
                                                    onClick={() => registrarLog(docenteId, `🎥 Zoom Sem ${ev.num}`)}
                                                >
                                                    🎥 Entrar
                                                </a>
                                                {ev.zoomId && <span className="text-[0.65rem] font-mono text-gray-400 tracking-wide">ID: {ev.zoomId}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.5);
                    border-radius: 4px;
                }
            `}</style>
        </motion.div>
    );
};

export default MonthlyCalendar;
