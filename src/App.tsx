/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Auth from './components/Auth';
import { areSupabaseCredentialsSet, supabase } from './services/supabase';
import { useState, useEffect } from 'react';

// RUTAS ABSOLUTAS DESDE SUPABASE
const LOGO_URL = "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/aa.png"; 
const FONDO_HEADER_URL = "/fondo-header.png"; 

export default function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowLoginModal(false); 
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!areSupabaseCredentialsSet) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-center p-6">
        <div className="border border-gray-800 p-12 rounded-lg bg-black/80 max-w-2xl backdrop-blur-md">
          <h2 className="text-3xl font-serif text-white mb-4">Configuración Requerida</h2>
          <p className="text-gray-400">Verifica tus credenciales de Supabase en los Secrets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen font-sans flex flex-col relative">
      
      <header 
        className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-50" 
        style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}
      >
        
        {/* ICONOS SUPERIORES DERECHOS */}
        {user && (
          <div className="absolute top-6 right-6 md:right-12 flex items-center gap-6 z-50">
            
            <button className="text-white hover:text-gray-400 transition-colors relative cursor-pointer bg-transparent border-none outline-none">
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path>
              </svg>
              <span className="absolute -top-1 -right-2 bg-white text-black text-[9px] font-bold px-[5px] py-[1px] rounded-full">0</span>
            </button>

            {/* PERFIL DE USUARIO Y SUBMENÚ (VIDRIO ULTRA BORROSO) */}
            <div className="group relative">
              <button className="text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="26" width="26" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                </svg>
              </button>
              {/* 👇 CAMBIO AQUÍ: bg-black/70 backdrop-blur-3xl */}
              <div className="absolute top-full right-0 mt-4 hidden group-hover:flex flex-col bg-black/70 backdrop-blur-3xl py-5 px-6 min-w-[200px] gap-4 shadow-2xl text-right z-50 rounded-sm">
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer">Mi Perfil</span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer">Mis Pedidos</span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer">Lista de Deseos</span>
                <hr className="border-white/10 my-1" />
                <button onClick={handleLogout} className="text-[10px] tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors text-right bg-transparent border-none p-0 cursor-pointer">
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOGO PRINCIPAL */}
        <img 
          src={LOGO_URL} 
          alt="ANTARES" 
          className="h-20 md:h-32 w-auto object-contain mt-[4px] z-10" 
        />

        {/* MENÚ HORIZONTAL (SUBMENÚS CON VIDRIO ULTRA BORROSO) */}
        {user && (
          <nav className="w-full border-none mt-[4px] mb-[4px] relative z-40">
            <ul className="flex justify-center gap-8 md:gap-16 py-0 text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-400">
              
              <li className="group relative cursor-pointer hover:text-white transition-colors py-2">
                Atelier
                {/* 👇 CAMBIO AQUÍ: bg-black/70 backdrop-blur-3xl */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 hidden group-hover:flex flex-col bg-black/70 backdrop-blur-3xl py-6 px-8 min-w-[220px] gap-4 shadow-2xl text-center rounded-sm">
                  <span className="hover:text-gray-300 transition-colors">Joyería Exclusiva</span>
                  <span className="hover:text-gray-300 transition-colors">Prêt-à-Porter</span>
                </div>
              </li>

              <li className="group relative cursor-pointer hover:text-white transition-colors py-2">
                Joyería
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 hidden group-hover:flex flex-col bg-black/70 backdrop-blur-3xl py-6 px-8 min-w-[260px] gap-4 shadow-2xl text-center rounded-sm">
                  <span className="hover:text-gray-300 transition-colors">Acero Fino</span>
                  <span className="hover:text-gray-300 transition-colors">Plata de Ley 925</span>
                  <span className="hover:text-gray-300 transition-colors">Gemas y Piedras Naturales</span>
                </div>
              </li>

              <li className="group relative cursor-pointer hover:text-white transition-colors py-2">
                Esenciales
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 hidden group-hover:flex flex-col bg-black/70 backdrop-blur-3xl py-6 px-8 min-w-[220px] gap-4 shadow-2xl text-center rounded-sm">
                  <span className="hover:text-gray-300 transition-colors">Básicos de Joyería</span>
                  <span className="hover:text-gray-300 transition-colors">Básicos de Vestuario</span>
                </div>
              </li>

              <li className="group relative cursor-pointer hover:text-white transition-colors py-2">
                Prêt-à-Porter
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 hidden group-hover:flex flex-col bg-black/70 backdrop-blur-3xl py-6 px-8 min-w-[220px] gap-4 shadow-2xl text-center rounded-sm">
                  <span className="hover:text-gray-300 transition-colors">Chaquetas</span>
                  <span className="hover:text-gray-300 transition-colors">Camisetas</span>
                  <span className="hover:text-gray-300 transition-colors">Buzos</span>
                  <span className="hover:text-gray-300 transition-colors">Pantalones</span>
                </div>
              </li>

              <li className="group relative cursor-pointer hover:text-white transition-colors py-2">
                Obsequios
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 hidden group-hover:flex flex-col bg-black/70 backdrop-blur-3xl py-6 px-8 min-w-[180px] gap-4 shadow-2xl text-center max-h-64 overflow-y-auto custom-scrollbar rounded-sm">
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

        {!user && (
          <div className="w-full flex justify-center mt-[4px] mb-[4px]">
            <button 
              onClick={() => setShowLoginModal(true)}
              className="text-white hover:text-gray-400 transition-colors p-0 bg-transparent border-none outline-none cursor-pointer"
            >
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="35" width="35" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
          </div>
        )}

      </header>

      <main className="flex-grow">
        {!user && (
          <>
            <section className="py-10 flex items-center justify-center text-center px-4">
              <div className="max-w-4xl">
                <h2 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-[0.2em] uppercase">
                  Elegancia Atemporal
                </h2>
              </div>
            </section>
            <section className="container mx-auto px-4 pb-20 mt-10">
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
          </>
        )}

        {user && (
          <section className="container mx-auto px-4 pb-20 mt-10">
            <div className="text-center py-20">
              <p className="text-gray-500 tracking-[0.3em] uppercase text-xs">Bienvenido al Atelier de Antares. Seleccione una colección del menú superior.</p>
            </div>
          </section>
        )}
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