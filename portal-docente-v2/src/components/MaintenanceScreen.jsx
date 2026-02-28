import React from 'react';

const MaintenanceScreen = ({ onAdminAccess }) => {
    return (
        <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-900 flex flex-col justify-center items-center text-center px-4 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl max-w-lg border border-gray-100 dark:border-slate-700">
                <div className="text-6xl mb-6 animate-bounce">🛠️</div>
                <h1 className="text-3xl font-bold text-[#003366] dark:text-blue-400 mb-4">Portal en Mantenimiento</h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                    Estamos realizando actualizaciones urgentes en nuestra base de datos para mejorar tu experiencia.
                    El servicio se restablecerá a la brevedad.
                </p>
                <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-lg font-bold text-sm">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    Trabajando en el sistema
                </div>
            </div>
            <div
                className="mt-8 opacity-10 hover:opacity-100 cursor-pointer transition-opacity text-[#1A1A1A] dark:text-gray-400"
                onClick={onAdminAccess}
            >
                🔒 Acceso Admin
            </div>
        </div>
    );
};

export default MaintenanceScreen;
