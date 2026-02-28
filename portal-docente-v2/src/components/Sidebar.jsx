import React from 'react';
import { motion } from 'framer-motion';
import { getSaludo } from '../utils/helpers';

const Sidebar = ({ docente, selectedCursoIdx, setSelectedCursoIdx }) => {
    return (
        <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 h-fit w-full md:w-auto flex md:block overflow-x-auto gap-4 md:gap-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg rounded-[20px] transition-colors duration-300"
        >
            <div className="hidden md:block text-center mb-8">
                <div className="w-24 h-24 bg-[#db9b32] rounded-full flex items-center justify-center text-4xl text-[#003366] font-bold mx-auto mb-4 shadow-xl border-4 border-white dark:border-slate-700 transition-colors">
                    {docente.nombre.charAt(0)}
                </div>
                <h3 className="m-0 text-[#003366] dark:text-blue-300 font-bold text-lg leading-tight transition-colors">
                    {getSaludo()},<br />{docente.nombre.split(' ')[0]}
                </h3>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gray-100 dark:bg-slate-700/50 px-3 py-1 rounded-full inline-block transition-colors">
                    ID: {docente.idReal}
                </div>
            </div>

            <div className="flex md:block gap-4 md:gap-0">
                {docente.cursos.map((c, i) => (
                    <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                        onClick={() => setSelectedCursoIdx(i)}
                        className={`w-full min-w-[240px] md:min-w-0 p-4 mb-3 text-left rounded-2xl transition-all duration-200 border cursor-pointer group
                            ${selectedCursoIdx === i
                                ? 'bg-white dark:bg-slate-700/50 border-[#db9b32] shadow-md ring-1 ring-[#db9b32]/20'
                                : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/30'
                            }`}
                    >
                        <div className={`font-bold text-[0.95rem] transition-colors ${selectedCursoIdx === i ? 'text-[#003366] dark:text-blue-300' : 'text-[#003366] dark:text-gray-300'}`}>{c.materia}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">{c.horario || 'Ver Cronograma'}</div>
                        <div className={`text-[0.65rem] px-2 py-0.5 rounded-md mt-2 font-bold inline-block transition-colors ${selectedCursoIdx === i
                            ? 'bg-[#003366] text-white dark:bg-blue-600'
                            : 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-gray-400 group-hover:bg-gray-300 dark:group-hover:bg-slate-600'
                            }`}>
                            {c.bloque}
                        </div>
                    </motion.button>
                ))}
            </div>
        </motion.aside>
    );
};

export default Sidebar;
