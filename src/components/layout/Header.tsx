import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { supabase } from '../../services/supabase';
import logo from '../../assets/logo.png';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  setActiveCategory: (cat: string) => void;
}

export default function Header({ activeView, setActiveView, setActiveCategory }: HeaderProps) {
  const { user, userRole, setShowLoginModal } = useAuth();
  const { carrito, cartPulse, favoritos, estructuraCatalogo, hiddenItems } = useShop();
  
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [menuUsuarioActivo, setMenuUsuarioActivo] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const cristalOpacoSubmenuClass = "liquid-submenu flex flex-col py-6 px-8 shadow-2xl rounded-2xl";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMenuAbierto(null);
        setMenuUsuarioActivo(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveView('home');
  };

  const irACategoria = (nombreCategoria: string) => {
    setActiveCategory(nombreCategoria);
    setActiveView('categoria');
    setMenuAbierto(null);
    setMenuUsuarioActivo(false);
  };

  return (
    <header ref={headerRef} className="fixed top-0 left-0 w-full h-auto flex flex-col items-center liquid-header z-[100] pt-2 px-4 sm:px-6 md:px-8 transition-all duration-500">
      
      {/* Botón Volver */}
      {user && activeView !== 'home' && (
        <button 
          onClick={() => setActiveView('home')} 
          className="absolute top-6 left-4 md:left-12 flex items-center gap-1.5 text-white/70 hover:text-white transition-all cursor-pointer bg-transparent border-none outline-none z-50 text-[10px] md:text-xs tracking-[0.2em] uppercase"
        >
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" height="14" width="14"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"></path></svg>
          Volver
        </button>
      )}

      {/* Menú de Usuario y Carrito */}
      {user ? (
        <div className="absolute top-6 right-4 md:right-12 flex items-center gap-4 md:gap-6 z-[100]">
          {userRole !== 'admin' && (
            <button 
              onClick={() => setActiveView('bag')} 
              className={`text-white hover:text-gray-300 transition-all duration-300 relative cursor-pointer bg-transparent border-none outline-none ${cartPulse ? 'scale-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'scale-100'}`}
            >
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="20" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
              <span className="absolute -top-1 -right-2 bg-white text-black text-[8px] md:text-[9px] font-bold px-[5px] py-[1px] rounded-full shadow-lg">{carrito.length}</span>
            </button>
          )}

          <button aria-label="Abrir menú de cuenta" className="relative cursor-pointer text-white hover:text-gray-300 transition-colors bg-transparent border-none outline-none py-2" onClick={() => { setMenuUsuarioActivo(!menuUsuarioActivo); setMenuAbierto(null); }}>
            <div className="text-white transition-colors">
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="22" width="22"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
            </div>
          </button>
        </div>
      ) : null}

      {/* Logo */}
      <img src={logo} alt="ANTARES" onClick={() => setActiveView('home')} className="h-16 md:h-20 w-auto mt-2 mb-0 z-[100] cursor-pointer drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-500" />

      {!user && (
        <button onClick={() => setShowLoginModal(true)} aria-label="Iniciar sesión" className="text-white hover:text-gray-400 transition-colors p-0 mb-3 bg-transparent border-none outline-none cursor-pointer z-[100]">
          <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="28" width="28"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </button>
      )}

      {/* Navegación (Solo Home) */}
      {user && activeView === 'home' && (
        <nav className="w-full relative z-[100] px-2 md:px-6 pb-2 animate-fade-in">
          <ul className="flex flex-wrap justify-center gap-y-3 gap-x-6 md:gap-x-12 py-1 text-[11px] md:text-[13px] tracking-[0.3em] uppercase border-none bg-transparent">
            {(menuUsuarioActivo ? ['Mi Perfil', ...(userRole === 'admin' ? ['Gestionar Pedidos', 'Inventario / Finanzas'] : ['Mis Pedidos', `Deseos (${favoritos.length})`]), 'Cerrar Sesión'] : [...Object.keys(estructuraCatalogo), 'Obsequios']).map(menu => {
              if (menuUsuarioActivo) {
                const action = menu.startsWith('Deseos') ? 'deseos' : menu === 'Mi Perfil' ? 'perfil' : menu === 'Mis Pedidos' || menu === 'Gestionar Pedidos' ? 'pedidos' : menu === 'Inventario / Finanzas' ? 'inventario' : null;
                return (
                  <li key={menu} className="relative cursor-pointer py-2" onClick={() => action ? setActiveView(action) : handleLogout()}>
                    <div className={`inline-block relative transition-colors ${menu === 'Cerrar Sesión' ? 'text-red-400 hover:text-red-300' : 'text-gray-300 hover:text-white'}`}>
                      {menu}
                    </div>
                  </li>
                );
              }

              if (menu === 'Obsequios') {
                return null;
              }

              const isMenuHidden = hiddenItems.includes(menu);
              if (userRole !== 'admin' && isMenuHidden) return null;
              
              return (
                <li key={menu} className="group relative cursor-pointer py-2" onMouseEnter={() => { setMenuAbierto(menu); setMenuUsuarioActivo(false); }} onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === menu ? null : menu); setMenuUsuarioActivo(false); }}>
                  <div className={`inline-block relative transition-colors duration-300 ${isMenuHidden ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                    {menu}
                  </div>
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 z-[100] ${menuAbierto === menu ? 'block' : 'hidden'}`}>
                    <div className={`${cristalOpacoSubmenuClass} min-w-[180px] md:min-w-[240px] text-center`}>
                      {estructuraCatalogo[menu].map(sub => {
                        const isSubHidden = hiddenItems.includes(sub);
                        if (userRole !== 'admin' && isSubHidden) return null;
                        return (
                          <div key={sub} onClick={() => irACategoria(sub)} className={`cursor-pointer block mt-4 first:mt-0 text-[10px] md:text-xs transition-colors py-2 ${isSubHidden ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                            {sub}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
            
            {/* Obsequios */}
            {!menuUsuarioActivo && (!hiddenItems.includes('Obsequios') || userRole === 'admin') && (
              <li className="group relative cursor-pointer py-2" onMouseEnter={() => { setMenuAbierto('Obsequios'); setMenuUsuarioActivo(false); }} onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === 'Obsequios' ? null : 'Obsequios'); setMenuUsuarioActivo(false); }}>
                <div className={`inline-block relative transition-colors duration-300 ${hiddenItems.includes('Obsequios') ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                  Obsequios
                </div>
                <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 z-[100] ${menuAbierto === 'Obsequios' ? 'block' : 'hidden'}`}>
                  <div className={`${cristalOpacoSubmenuClass} min-w-[150px] md:min-w-[200px] text-center max-h-64 overflow-y-auto`}>
                    {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(p => (
                      <div key={p} onClick={() => irACategoria(`Obsequios $${p}`)} className="text-gray-400 hover:text-white transition-colors cursor-pointer block mt-4 first:mt-0 text-[10px] md:text-xs py-2">
                        $ {p}.00 USD
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}