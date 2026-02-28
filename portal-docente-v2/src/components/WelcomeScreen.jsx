import React from 'react';
import { motion } from 'framer-motion';

const WelcomeScreen = ({ fechaEspanol, onAdminAccess }) => {
    return (
        <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="col-span-1 md:col-span-2 text-center py-24 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-lg rounded-[20px] transition-colors duration-300 relative overflow-hidden"
        >
            <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-10 relative shadow-2xl mx-auto max-w-3xl border border-white/10">
                <motion.img
                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80"
                    alt="Clase universitaria moderna"
                    className="w-full h-full object-cover"
                    animate={{ scale: [1.05, 1.15, 1.05], objectPosition: ['50% 50%', '40% 60%', '50% 50%'] }}
                    transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#003366]/80 via-transparent to-transparent flex items-end justify-center pb-6">
                    <div className="w-16 h-1 bg-[#db9b32] rounded-full opacity-80 shadow-[0_0_10px_rgba(219,155,50,0.5)]"></div>
                </div>
            </div>
            <h1 className="text-[#003366] dark:text-blue-400 mb-4 text-4xl font-bold">Portal Estudiantes</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
                Gestiona tu programación académica de forma privada y segura.
            </p>

            <div className="mt-10 text-xl text-gray-800 dark:text-gray-200 font-bold capitalize">
                {fechaEspanol}
            </div>
            <div
                className="absolute bottom-5 right-5 cursor-pointer opacity-20 text-xs hover:opacity-100 transition-opacity dark:text-gray-400 text-[#1A1A1A]"
                onClick={onAdminAccess}
            >
                🔒 Acceso Administrativo
            </div>
        </motion.div>
    );
};

export default WelcomeScreen;
