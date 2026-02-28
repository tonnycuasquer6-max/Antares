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
        <div className="bg-black/80 backdrop-blur-md p-12 rounded-sm max-w-2xl shadow-2xl">
          <h2 className="text-3xl font-serif text-white mb-4">Configuración Requerida</h2>
          <p className="text-gray-400">Verifica tus credenciales de Supabase en los Secrets.</p>
        </div>
      </div>
    );
  }

  // CLASES MAESTRAS
  const puenteInvisibleMenuUsuario = "absolute top-full right-0 pt-4 hidden group-hover:block z-50";
  const puenteInvisibleMenuPrincipal = "absolute top-full left-1/2 -translate-x-1/2 pt-4 hidden group-hover:block z-50";
  const cristalOpacoSubmenuClass = "flex flex-col bg-black/95 backdrop-blur-md border border-white/10 py-6 px-8 shadow-2xl rounded-sm";
  const menuUnderlineClass = "absolute bottom-0 left-1/2 w-0 h-px bg-white group-hover:w-full group-hover:left-0 transition-all duration-300";

  return (
    <div className="bg-black text-white min-h-screen font-sans flex flex-col relative">
      
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <header 
        className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-50 pt-3" 
        style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}
      >
        
        {/* 👇 BOTÓN DE VOLVER (SOLO APARECE CUANDO ESTÁS EN OTRA PANTALLA QUE NO SEA HOME) */}
        {user && activeView !== 'home' && (
          <button 
            onClick={() => setActiveView('home')}
            className="absolute top-6 left-6 md:left-12 flex items-center gap-2 text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none z-50 text-[10px] tracking-[0.2em] uppercase"
          >
            <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path>
            </svg>
            Volver
          </button>
        )}

        {user && (
          <div className="absolute top-6 right-6 md:right-12 flex items-center gap-6 z-50">
            
            <button className="text-white hover:text-gray-400 transition-colors relative cursor-pointer bg-transparent border-none outline-none">
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path>
              </svg>
              <span className="absolute -top-1 -right-2 bg-white text-black text-[9px] font-bold px-[5px] py-[1px] rounded-full">0</span>
            </button>

            <div className="group relative">
              <button className="text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="26" width="26" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                </svg>
              </button>
              
              <div className={puenteInvisibleMenuUsuario}>
                <div className={`${cristalOpacoSubmenuClass} min-w-[200px] text-right`}>
                  <button onClick={() => setActiveView('perfil')} className="text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block">Mi Perfil</button>
                  <button onClick={() => setActiveView('pedidos')} className="text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-5">Mis Pedidos</button>
                  <button onClick={() => setActiveView('deseos')} className="text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-5 mb-5">Lista de Deseos</button>
                  <button onClick={handleLogout} className="text-[10px] tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors text-right bg-transparent border-none p-0 cursor-pointer outline-none block">
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

        {/* 👇 EL MENÚ PRINCIPAL AHORA SOLO EXISTE SI activeView ES 'home' */}
        {user && activeView === 'home' && (
          <nav className="w-full border-none bg-transparent mt-[4px] mb-[4px] relative z-40 px-6 pt-0 animate-fade-in">
            <ul className="flex justify-center gap-10 md:gap-20 py-0 text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-400 border-none bg-transparent">
              
              <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                <span className="hover:text-white transition-colors block relative">
                  Atelier
                  <div className={menuUnderlineClass}></div>
                </span>
                <div className={puenteInvisibleMenuPrincipal}>
                  <div className={`${cristalOpacoSubmenuClass} min-w-[220px] text-center`}>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block">Joyería Exclusiva</span>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Prêt-à-Porter</span>
                  </div>
                </div>
              </li>

              <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                <span className="hover:text-white transition-colors block relative">
                  Joyería
                  <div className={menuUnderlineClass}></div>
                </span>
                <div className={puenteInvisibleMenuPrincipal}>
                  <div className={`${cristalOpacoSubmenuClass} min-w-[260px] text-center`}>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block">Acero Fino</span>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Plata de Ley 925</span>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Gemas y Piedras Naturales</span>
                  </div>
                </div>
              </li>

              <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                <span className="hover:text-white transition-colors block relative">
                  Esenciales
                  <div className={menuUnderlineClass}></div>
                </span>
                <div className={puenteInvisibleMenuPrincipal}>
                  <div className={`${cristalOpacoSubmenuClass} min-w-[220px] text-center`}>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block">Básicos de Joyería</span>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Básicos de Vestuario</span>
                  </div>
                </div>
              </li>

              <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                <span className="hover:text-white transition-colors block relative">
                  Prêt-à-Porter
                  <div className={menuUnderlineClass}></div>
                </span>
                <div className={puenteInvisibleMenuPrincipal}>
                  <div className={`${cristalOpacoSubmenuClass} min-w-[220px] text-center`}>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block">Chaquetas</span>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Camisetas</span>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Buzos</span>
                    <span onClick={() => setActiveView('categoria')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Pantalones</span>
                  </div>
                </div>
              </li>

              <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                <span className="hover:text-white transition-colors block relative">
                  Obsequios
                  <div className={menuUnderlineClass}></div>
                </span>
                <div className={puenteInvisibleMenuPrincipal}>
                  <div className={`${cristalOpacoSubmenuClass} min-w-[180px] text-center max-h-64 overflow-y-auto custom-scrollbar`}>
                    {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((price, idx) => (
                      <span key={price} onClick={() => setActiveView('categoria')} className={`hover:text-gray-300 transition-colors cursor-pointer block ${idx !== 0 ? 'mt-4' : ''}`}>
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

      <main className="flex-grow flex flex-col items-center">
        
        {/* VISTA 1: VISITANTE NO LOGUEADO */}
        {!user && (
          <>
            <section className="py-20 md:py-32 flex items-center justify-center text-center px-4 w-full flex-grow">
              <div className="max-w-4xl">
                <h2 className="text-5xl md:text-8xl font-serif font-bold text-white tracking-[0.2em] uppercase opacity-90 animate-fade-in">
                  Elegancia Atemporal
                </h2>
              </div>
            </section>
          </>
        )}

        {/* VISTA 2: HOME USUARIO LOGUEADO */}
        {user && activeView === 'home' && (
          <section className="container mx-auto px-4 pb-20 mt-10 flex-grow flex items-center justify-center animate-fade-in">
            <div className="text-center py-20">
              <p className="text-gray-500 tracking-[0.3em] uppercase text-xs">Bienvenido al Atelier de Antares. Seleccione una colección del menú superior.</p>
            </div>
          </section>
        )}

        {/* VISTA 3: CATEGORÍAS (CUANDO HACES CLIC EN UN SUBMENÚ) */}
        {user && activeView === 'categoria' && (
          <section className="container mx-auto px-4 py-16 flex-grow flex flex-col items-center justify-center animate-fade-in">
             <h2 className="text-2xl font-serif tracking-[0.3em] uppercase text-white mb-6 text-center">Colección Seleccionada</h2>
             <p className="text-gray-500 tracking-[0.2em] uppercase text-xs">Los artículos de esta colección estarán disponibles muy pronto.</p>
          </section>
        )}

        {/* VISTA 4: MI PERFIL */}
        {user && activeView === 'perfil' && (
          <section className="w-full max-w-3xl mx-auto px-4 py-16 flex-grow animate-fade-in">
            <h2 className="text-2xl font-serif tracking-[0.3em] uppercase text-white mb-10 text-center pb-4">Mi Perfil</h2>
            
            <div className="bg-black/80 backdrop-blur-md p-10 rounded-sm shadow-2xl border-none">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Nombres</label>
                  <p className="text-white font-serif text-lg">{user.user_metadata?.first_name || 'Tonny'}</p>
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Apellidos</label>
                  <p className="text-white font-serif text-lg">{user.user_metadata?.last_name || 'Cuasquer'}</p>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Correo Electrónico</label>
                <p className="text-white font-serif text-lg">{user.email}</p>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Estado de Cuenta</label>
                <p className="text-green-500 text-xs tracking-[0.1em] uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Activo
                </p>
              </div>

              <div className="mb-10 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-3">Acceso y Seguridad</label>
                    <button className="text-white text-[10px] tracking-[0.2em] uppercase px-6 py-3 bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer outline-none rounded-sm border-none w-full">
                    Generar Contraseña
                    </button>
                    <p className="text-gray-500 text-[9px] tracking-[0.1em] mt-3 uppercase">Para ingresar directamente con tu correo electrónico y contraseña.</p>
                </div>
                <div className="pt-8">
                    <button className="text-black text-[10px] tracking-[0.2em] uppercase px-8 py-3 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none rounded-sm border-none w-full">
                    Editar Datos
                    </button>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* VISTA 5: MIS PEDIDOS */}
        {user && activeView === 'pedidos' && (
          <section className="w-full max-w-4xl mx-auto px-4 py-16 flex-grow animate-fade-in">
            <h2 className="text-2xl font-serif tracking-[0.3em] uppercase text-white mb-10 text-center pb-4">Mis Pedidos</h2>
            <div className="text-center py-20 bg-black/80 backdrop-blur-md shadow-2xl rounded-sm border-none">
              <svg stroke="currentColor" fill="none" strokeWidth="1" viewBox="0 0 24 24" className="w-12 h-12 mx-auto text-gray-700 mb-4" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              <p className="text-gray-500 tracking-[0.2em] uppercase text-xs">Aún no has realizado ninguna compra.</p>
              <button onClick={() => setActiveView('home')} className="mt-8 text-white hover:text-gray-400 transition-colors text-[10px] tracking-[0.2em] uppercase cursor-pointer bg-transparent outline-none border-none">
                Explorar Colecciones
              </button>
            </div>
          </section>
        )}

        {/* VISTA 6: LISTA DE DESEOS */}
        {user && activeView === 'deseos' && (
          <section className="w-full max-w-4xl mx-auto px-4 py-16 flex-grow animate-fade-in">
            <h2 className="text-2xl font-serif tracking-[0.3em] uppercase text-white mb-10 text-center pb-4">Lista de Deseos</h2>
            <div className="text-center py-20 bg-black/80 backdrop-blur-md shadow-2xl rounded-sm border-none">
              <svg stroke="currentColor" fill="none" strokeWidth="1" viewBox="0 0 24 24" className="w-12 h-12 mx-auto text-gray-700 mb-4" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              <p className="text-gray-500 tracking-[0.2em] uppercase text-xs">Tu lista de deseos está vacía.</p>
            </div>
          </section>
        )}

      </main>

      <footer className="bg-black py-8 text-center text-gray-700 text-[9px] tracking-[0.5em] uppercase border-none mt-auto px-4">
        &copy; {new Date().getFullYear()} ANTARES. Elegancia Atemporal.
      </footer>

      {showLoginModal && (
        <Auth onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}