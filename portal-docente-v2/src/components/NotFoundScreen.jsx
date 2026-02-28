import React from 'react';
import { motion } from 'framer-motion';

const NotFoundScreen = ({ searchId, onReset, onOpenSupport }) => {
    return (
        <motion.div
            key="not-found"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="col-span-1 md:col-span-2 text-center py-16 px-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-red-100 dark:border-red-900/30 shadow-lg rounded-[20px] transition-colors duration-300"
        >
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl border-[8px] border-white dark:border-slate-800 shadow-sm">
                🤔
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] dark:text-white mb-4">
                Estudiante no encontrado
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-base md:text-lg">
                No pudimos encontrar una programación académica asociada al código <strong>{searchId}</strong> en nuestra base de datos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                    onClick={onReset}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors w-full sm:w-auto border-none cursor-pointer"
                >
                    Intentar de nuevo
                </button>
                <button
                    onClick={onOpenSupport}
                    className="px-6 py-3 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-xl transition-colors w-full sm:w-auto border-none flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                    <span>🎧</span> Contactar Soporte
                </button>
            </div>
        </motion.div>
    );
};

export default NotFoundScreen;
