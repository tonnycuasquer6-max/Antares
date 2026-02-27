/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Auth from './components/Auth';
import { areSupabaseCredentialsSet } from './services/supabase';
import { useState } from 'react';

// RUTA DE TUS IMÁGENES EN LA CARPETA PUBLIC
const LOGO_URL = "/logo-antares.png"; 
const FONDO_HEADER_URL = "/fondo-header.png"; 

export default function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!areSupabaseCredentialsSet) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-center p-6">
        <div className="border border-gray-800 p-12 rounded-lg bg-black bg-opacity-80 max-w-2xl">
          <h2 className="text-3xl font-serif text-white mb-4">Configuración Requerida</h2>
          <p className="text-gray-400">Verifica tus credenciales de Supabase en los Secrets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen font-sans flex flex-col">
      
      {/* HEADER COMPACTO: 5px de margen superior */}
      <header 
        className="w-full h-32 md:h-44 flex items-center justify-center bg-cover bg-center mt-[5px] relative"
        style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}
      >
        {/* LOGO GÓTICO CENTRADO */}
        <img 
          src={LOGO_URL} 
          alt="ANTARES" 
          className="h-20 md:h-32 w-auto object-contain"
          onError={(e) => { e.currentTarget.src = "./logo-antares.png"; }}
        />
      </header>

      {/* ICONO DE PERSONITA: Sin fondo y con 5px de separación del header */}
      <div className="w-full flex justify-center mt-[5px]">
        <button 
          onClick={() => setShowLoginModal(true)}
          className="text-white hover:text-gray-400 transition-colors p-0 bg-transparent border-none outline-none"
        >
          <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="35" width="35" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </div>

      <main className="flex-grow">
        {/* SECCIÓN HERO SIN LÍNEA DIVISORIA */}
        <section className="py-10 flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-[0.2em] uppercase">
              Elegancia Atemporal
            </h2>
            {/* Línea eliminada según tu instrucción */}
          </div>
        </section>

        {/* SECCIÓN DE CATEGORÍAS */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Joyería Femenina', 'Joyería de Hombre', 'Ropa de Mujer', 'Ropa de Varón'].map((cat) => (
              <div key={cat} className="group relative h-64 overflow-hidden bg-zinc-900 border border-gray-900 cursor-pointer">
                <div className="absolute inset-0 bg-black opacity-60 group-hover:opacity-40 transition-all"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <h4 className="text-xl md:text-2xl font-serif text-white tracking-[0.3em] uppercase">{cat}</h4>
                  <div className="mt-2 h-px w-0 group-hover:w-20 bg-white transition-all"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-black py-8 text-center text-gray-700 text-[9px] tracking-[0.5em] uppercase">
        &copy; {new Date().getFullYear()} ANTARES.
      </footer>

      {showLoginModal && (
        <Auth onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}