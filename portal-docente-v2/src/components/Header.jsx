import React from 'react';
import { trackAppEvent } from '../App';

const Header = ({ onReset, docente, searchTerm, setSearchTerm, onSearch, loading }) => {
  return (
    <header className="bg-[#003366] py-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center relative z-10 gap-4 md:gap-0">
        <div className="text-center md:text-left flex flex-col justify-center items-center md:items-start" onClick={onReset}>
          <h1 className="m-0 text-[#db9b32] text-2xl md:text-3xl font-extrabold tracking-tighter cursor-pointer">PORTAL ESTUDIANTES</h1>
          <h2 className="mt-1 text-xs md:text-sm text-white/80 font-medium tracking-[2px] uppercase cursor-pointer">CREO - UNIVERSIDAD DEL MAGDALENA</h2>

          {docente && (
            <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
              <a
                href="https://campusvirtual.unimagdalena.edu.co"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => { e.stopPropagation(); trackAppEvent("click_campus_virtual"); }}
                className="group flex items-center gap-2 bg-gradient-to-r from-[#db9b32] to-[#f4b953] hover:from-[#f4b953] hover:to-[#db9b32] text-[#003366] px-5 py-2.5 rounded-full text-sm font-extrabold shadow-lg shadow-[#db9b32]/30 hover:shadow-[#db9b32]/50 transform hover:-translate-y-0.5 transition-all duration-300"
              >
                <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                Campus Virtual
              </a>

              <a
                href="https://universidadmag-my.sharepoint.com/:f:/g/personal/acantillo_unimagdalena_edu_co/IgAtZLm1Z-5YRIkHr25vC6BRAYbjxQUbr8id7AALp2TlW28?e=Zt8nYB"
                target="_blank"
                rel="noreferrer"
                onClick={(e) => { e.stopPropagation(); trackAppEvent("click_centro_ayuda"); }}
                className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 border border-white/20 hover:border-white/50 no-underline"
              >
                <span className="text-lg transform group-hover:scale-110 transition-transform">🎬</span> Mini Clips Campus
              </a>
            </div>
          )}
        </div>
        <div className="w-full md:w-auto flex justify-center">
          {!docente && (
            <form onSubmit={onSearch} className="bg-white dark:bg-slate-800 p-1 rounded-full flex shadow-lg transition-transform w-full md:w-auto">
              <input
                placeholder="Código del Estudiante"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                maxLength={15}
                className="p-3 px-5 rounded-full border-none outline-none text-base w-full md:w-[200px] bg-transparent dark:text-white placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#db9b32] text-[#003366] border-none py-2 px-6 font-extrabold rounded-full uppercase tracking-wider cursor-pointer hover:bg-[#c68a2e] transition-colors whitespace-nowrap min-w-[140px] flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-[#003366]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'CONSULTAR'}
              </button>
            </form>
          )}
          {docente && (
            <button
              onClick={onReset}
              className="bg-[#db9b32] text-[#003366] border-none py-2 px-6 font-extrabold rounded-full uppercase tracking-wider cursor-pointer text-xs hover:bg-[#c68a2e] transition-colors"
            >
              ↺ Salir
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
