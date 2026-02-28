/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Auth from './components/Auth';
import { areSupabaseCredentialsSet, supabase } from './services/supabase';
import { useState, useEffect } from 'react';

const LOGO_URL = "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/aa.png"; 
const FONDO_HEADER_URL = "/fondo-header.png"; 

export default function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // ESTADO PARA CONTROLAR LAS VISTAS
  const [activeView, setActiveView] = useState('home');

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
    setActiveView('home'); 
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

  // 👇 CLASES CON EL EFECTO EXACTO DE LA FOTO 2 (LOGIN)
  const cristalOpacoClass = "flex flex-col bg-black/80 backdrop-blur-md border border-white/10 py-5 px-6 shadow-2xl rounded-sm";

  return (
    <div className="bg-black text-white min-h-screen font-sans flex flex-col relative">
      
      <header 
        className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-50" 
        style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}
      >
        {user && (
          <div className="absolute top-6 right-6 md:right-12 flex items-center gap-6 z-50">
            
            {/* BOTÓN CARRITO */}
            <button className="text-white hover:text-gray-400 transition-colors relative cursor-pointer bg-transparent border-none outline-none">
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path>
              </svg>
              <span className="absolute -top-1 -right-2 bg-white text-black text-[9px] font-bold px-[5px] py-[1px] rounded-full">0</span>
            </button>

            {/* 👇 MENÚ DE USUARIO (CON PUENTE INVISIBLE pt-3) */}
            <div className="group relative">
              <button className="text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none py-2">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="26" width="26" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                </svg>
              </button>
              
              {/* pt-3 crea un puente invisible para que el mouse no pierda el hover */}
              <div className="absolute top-full right-0 pt-3 hidden group-hover:block z-50">
                <div className={`${cristalOpacoClass} min-w-[200px] text-right`}>
                  <button onClick={() => setActiveView('perfil')} className="text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none">Mi Perfil</button>
                  <button onClick={() => setActiveView('pedidos')} className="text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none mt-4">Mis Pedidos</button>
                  <button onClick={() => setActiveView('deseos')} className="text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none mt-4">Lista de Deseos</button>
                  <hr className="border-white/10 my-4" />
                  <button onClick={handleLogout} className="text-[10px] tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors text-right bg-transparent border-none p-0 cursor-pointer outline-none">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <img 
          src={LOGO_URL} 
          alt="ANTARES" 
          onClick={() => user && setActiveView('home')}
          className={`h-20 md:h-32 w-auto object-contain mt-[4px] z-10 ${user ? 'cursor-pointer' : ''}`} 
        />

        {user && (
          <nav className="w-full border-none mt-[4px] mb-[4px] relative z-40">
            <ul className="flex justify-center gap-8 md:gap-16 py-0 text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-400">
              
              {/* ATELIER */}
              <li className="group relative cursor-pointer py-2">
                <span className="hover:text-white transition-colors block">Atelier</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block z-50">
                  <div className={`${cristalOpacoClass} min-w-[220px] text-center`}>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block">Joyería Exclusiva</span>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Prêt-à-Porter</span>
                  </div>
                </div>
              </li>

              {/* JOYERÍA */}
              <li className="group relative cursor-pointer py-2">
                <span className="hover:text-white transition-colors block">Joyería</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block z-50">
                  <div className={`${cristalOpacoClass} min-w-[260px] text-center`}>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block">Acero Fino</span>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Plata de Ley 925</span>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Gemas y Piedras Naturales</span>
                  </div>
                </div>
              </li>

              {/* ESENCIALES */}
              <li className="group relative cursor-pointer py-2">
                <span className="hover:text-white transition-colors block">Esenciales</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block z-50">
                  <div className={`${cristalOpacoClass} min-w-[220px] text-center`}>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block">Básicos de Joyería</span>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Básicos de Vestuario</span>
                  </div>
                </div>
              </li>

              {/* PRÊT-À-PORTER */}
              <li className="group relative cursor-pointer py-2">
                <span className="hover:text-white transition-colors block">Prêt-à-Porter</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block z-50">
                  <div className={`${cristalOpacoClass} min-w-[220px] text-center`}>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block">Chaquetas</span>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Camisetas</span>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Buzos</span>
                    <span className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Pantalones</span>
                  </div>
                </div>
              </li>

              {/* OBSEQUIOS */}
              <li className="group relative cursor-pointer py-2">
                <span className="hover:text-white transition-colors block">Obsequios</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 hidden group-hover:block z-50">
                  <div className={`${cristalOpacoClass} min-w-[180px] text-center max-h-64 overflow-y-auto custom-scrollbar`}>
                    {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((price, idx) => (
                      <span key={price} className={`hover:text-gray-300 transition-colors cursor-pointer block ${idx !== 0 ? 'mt-4' : ''}`}>
                        $ {price}.00 USD
                      </span>
                    ))}
                  </div>
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

      {/* 👇 AQUÍ EMPIEZAN LAS VISTAS DINÁMICAS */}
      <main className="flex-grow flex flex-col items-center">
        
        {/* VISTA 1: VISITANTE NO LOGUEADO */}
        {!user && (
          <>
            <section className="py-10 flex items-center justify-center text-center px-4 w-full">
              <div className="max-w-4xl">
                <h2 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-[0.2em] uppercase">
                  Elegancia Atemporal
                </h2>
              </div>
            </section>
            <section className="container mx-auto px-4 pb-20 mt-10 w-full">
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

        {/* VISTA 2: HOME USUARIO LOGUEADO */}
        {user && activeView === 'home' && (
          <section className="container mx-auto px-4 pb-20 mt-10 flex-grow flex items-center justify-center">
            <div className="text-center py-20">
              <p className="text-gray-500 tracking-[0.3em] uppercase text-xs">Bienvenido al Atelier de Antares. Seleccione una colección del menú superior.</p>
            </div>
          </section>
        )}

        {/* VISTA 3: MI PERFIL */}
        {user && activeView === 'perfil' && (
          <section className="w-full max-w-3xl mx-auto px-4 py-16 flex-grow animate-fade-in">
            <h2 className="text-2xl font-serif tracking-[0.3em] uppercase text-white mb-10 text-center border-b border-white/10 pb-4">Mi Perfil</h2>
            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-8 rounded-sm shadow-2xl">
              <div className="mb-6">
                <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Correo Electrónico</label>
                <p className="text-white font-serif text-lg">{user.email}</p>
              </div>
              <div className="mb-8">
                <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Estado de Cuenta</label>
                <p className="text-green-500 text-xs tracking-[0.1em] uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Activo
                </p>
              </div>
              <button className="border border-white/20 hover:border-white transition-colors text-white text-[10px] tracking-[0.2em] uppercase px-6 py-3 bg-transparent cursor-pointer outline-none">
                Editar Datos
              </button>
            </div>
          </section>
        )}

        {/* VISTA 4: MIS PEDIDOS */}
        {user && activeView === 'pedidos' && (
          <section className="w-full max-w-4xl mx-auto px-4 py-16 flex-grow animate-fade-in">
            <h2 className="text-2xl font-serif tracking-[0.3em] uppercase text-white mb-10 text-center border-b border-white/10 pb-4">Mis Pedidos</h2>
            <div className="text-center py-20 bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl rounded-sm">
              <svg stroke="currentColor" fill="none" strokeWidth="1" viewBox="0 0 24 24" className="w-12 h-12 mx-auto text-gray-700 mb-4" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              <p className="text-gray-500 tracking-[0.2em] uppercase text-xs">Aún no has realizado ninguna compra.</p>
              <button onClick={() => setActiveView('home')} className="mt-8 border-b border-white/30 hover:border-white pb-1 text-white transition-colors text-[10px] tracking-[0.2em] uppercase cursor-pointer bg-transparent outline-none">
                Explorar Colecciones
              </button>
            </div>
          </section>
        )}

        {/* VISTA 5: LISTA DE DESEOS */}
        {user && activeView === 'deseos' && (
          <section className="w-full max-w-4xl mx-auto px-4 py-16 flex-grow animate-fade-in">
            <h2 className="text-2xl font-serif tracking-[0.3em] uppercase text-white mb-10 text-center border-b border-white/10 pb-4">Lista de Deseos</h2>
            <div className="text-center py-20 bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl rounded-sm">
              <svg stroke="currentColor" fill="none" strokeWidth="1" viewBox="0 0 24 24" className="w-12 h-12 mx-auto text-gray-700 mb-4" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              <p className="text-gray-500 tracking-[0.2em] uppercase text-xs">Tu lista de deseos está vacía.</p>
            </div>
          </section>
        )}

      </main>

      <footer className="bg-black py-8 text-center text-gray-700 text-[9px] tracking-[0.5em] uppercase border-t border-white/5 mt-auto">
        &copy; {new Date().getFullYear()} ANTARES.
      </footer>

      {showLoginModal && (
        <Auth onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}