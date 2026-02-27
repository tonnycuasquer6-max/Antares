/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Auth from './components/Auth';
import { areSupabaseCredentialsSet, supabase } from './services/supabase';
import { useState, useEffect } from 'react';

const LOGO_URL = "/logo-antares.png"; 
const FONDO_HEADER_URL = "/fondo-header.png"; 

export default function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  // ESTO ESCUCHA SI EL USUARIO YA INICIÓ SESIÓN
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowLoginModal(false); // Cierra el modal automáticamente al loguearse
    });

    return () => subscription.unsubscribe();
  }, []);

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
    <div className="bg-black text-white min-h-screen font-sans flex flex-col relative">
      
      {/* HEADER COMPACTO */}
      <header 
        className="w-full h-32 md:h-44 flex flex-col items-center justify-center bg-cover bg-center mt-[5px] relative"
        style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}
      >
        <img src={LOGO_URL} alt="ANTARES" className="h-20 md:h-32 w-auto object-contain" />
      </header>

      {/* ICONO DE PERSONITA (Solo se muestra si NO hay usuario) */}
      {!user && (
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
      )}

      {/* MENÚ HORIZONTAL DE LUJO (Solo se muestra si YA INICIÓ SESIÓN) */}
      {user && (
        <nav className="w-full border-y border-white/10 mt-6 relative z-40 bg-black/40 backdrop-blur-md">
          <ul className="flex justify-center gap-8 md:gap-16 py-4 text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-400">
            
            {/* ATELIER */}
            <li className="group relative cursor-pointer hover:text-white transition-colors py-2">
              Atelier
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 hidden group-hover:flex flex-col bg-black/80 backdrop-blur-md border border-white/10 py-6 px-8 min-w-[220px] gap-4 shadow-2xl text-center">
                <span className="hover:text-gray-300 transition-colors">Alta Joyería</span>
                <span className="hover:text-gray-300 transition-colors">Prêt-à-Porter</span>
              </div>
            </li>

            {/* ALTA JOYERÍA */}
            <li className="cursor-pointer hover:text-white transition-colors py-2">
              Alta Joyería
            </li>

            {/* ESENCIALES (Infaltables) */}
            <li className="group relative cursor-pointer hover:text-white transition-colors py-2">
              Esenciales
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 hidden group-hover:flex flex-col bg-black/80 backdrop-blur-md border border-white/10 py-6 px-8 min-w-[220px] gap-4 shadow-2xl text-center">
                <span className="hover:text-gray-300 transition-colors">Básicos de Joyería</span>
                <span className="hover:text-gray-300 transition-colors">Básicos de Vestuario</span>
              </div>
            </li>

            {/* PRÊT-À-PORTER (Ropa) */}
            <li className="group relative cursor-pointer hover:text-white transition-colors py-2">
              Prêt-à-Porter
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 hidden group-hover:flex flex-col bg-black/80 backdrop-blur-md border border-white/10 py-6 px-8 min-w-[220px] gap-4 shadow-2xl text-center">
                <span className="hover:text-gray-300 transition-colors">Chaquetas</span>
                <span className="hover:text-gray-300 transition-colors">Camisetas</span>
                <span className="hover:text-gray-300 transition-colors">Buzos</span>
                <span className="hover:text-gray-300 transition-colors">Pantalones</span>
              </div>
            </li>

            {/* OBSEQUIOS (Regalos) */}
            <li className="group relative cursor-pointer hover:text-white transition-colors py-2">
              Obsequios
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 hidden group-hover:flex flex-col bg-black/80 backdrop-blur-md border border-white/10 py-6 px-8 min-w-[180px] gap-4 shadow-2xl text-center max-h-64 overflow-y-auto custom-scrollbar">
                {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((price) => (
                  <span key={price} className="hover:text-gray-300 transition-colors">
                    $ {price}.00 USD
                  </span>
                ))}
              </div>
            </li>

          </ul>
        </nav>
      )}

      <main className="flex-grow">
        {/* SECCIÓN HERO (Se oculta si el usuario está logueado para darle protagonismo a la tienda) */}
        {!user && (
          <section className="py-10 flex items-center justify-center text-center px-4">
            <div className="max-w-4xl">
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-[0.2em] uppercase">
                Elegancia Atemporal
              </h2>
            </div>
          </section>
        )}

        {/* CONTENIDO DE INICIO (Puedes poner aquí los productos destacados luego) */}
        <section className="container mx-auto px-4 pb-20 mt-10">
          {!user ? (
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
          ) : (
             <div className="text-center py-20">
               <p className="text-gray-500 tracking-[0.3em] uppercase text-xs">Bienvenido al Atelier de Antares. Seleccione una colección del menú superior.</p>
             </div>
          )}
        </section>
      </main>

      <footer className="bg-black py-8 text-center text-gray-700 text-[9px] tracking-[0.5em] uppercase border-t border-white/5">
        &copy; {new Date().getFullYear()} ANTARES.
      </footer>

      {showLoginModal && (
        <Auth onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}