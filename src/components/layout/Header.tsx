import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/useAuth';
import { useShop } from '../../context/useShop';
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
  const isAdminPanel = userRole === 'admin' && ['pedidos', 'inventario'].includes(activeView);
  
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [menuUsuarioActivo, setMenuUsuarioActivo] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const catalogMenus = Object.keys(estructuraCatalogo);

  const cristalOpacoSubmenuClass = "glass-panel flex flex-col py-2.5 px-5 rounded-2xl";
  const normalizeMenuKey = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const handleMenuHover = (menu: string, isVisible: boolean) => {
    if (isVisible || userRole === 'admin') setMenuAbierto(menu);
    setMenuUsuarioActivo(false);
  };
  const handleHeaderPointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    if (event.relatedTarget instanceof Node && submenuRef.current?.contains(event.relatedTarget)) return;
    setMenuAbierto(null);
    setMenuUsuarioActivo(false);
  };
  const isItemHidden = (value: string) => hiddenItems.some(item => normalizeMenuKey(item) === normalizeMenuKey(value));
  const normalizedHiddenItems = hiddenItems.map(item => normalizeMenuKey(item));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const clickedInsideDropdown = target instanceof Element && (
        target.closest('.menu-dropdown') ||
        target.closest('.menu-item-visibility')
      );

      if (headerRef.current && !headerRef.current.contains(target as Node) && !clickedInsideDropdown) {
        setMenuAbierto(null);
        setMenuUsuarioActivo(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!menuAbierto) return;

    const updatePosition = () => {
      const trigger = menuTriggerRefs.current.get(menuAbierto);
      const submenu = submenuRef.current;
      if (!trigger || !submenu) return;

      const triggerRect = trigger.getBoundingClientRect();
      const submenuWidth = submenu.getBoundingClientRect().width;
      submenu.style.left = `${Math.max(8, Math.min(
        triggerRect.left + (triggerRect.width - submenuWidth) / 2,
        window.innerWidth - submenuWidth - 8
      ))}px`;
      submenu.style.top = `${triggerRect.bottom + 8}px`;
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [menuAbierto]);

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
    <header ref={headerRef} onPointerLeave={handleHeaderPointerLeave} className={`site-header screen-only ${isAdminPanel ? 'relative' : 'fixed top-0 left-0'} w-full h-auto flex flex-col items-center glass-panel z-[100] pt-2 px-4 sm:px-6 md:px-8 transition-all duration-500`}>
      
      {/* BotÃ³n Volver */}
      {user && activeView !== 'home' && (
        <button 
          onClick={() => setActiveView('home')} 
          className="absolute top-6 left-4 md:left-12 flex items-center gap-1.5 text-white/70 hover:text-white transition-all cursor-pointer bg-transparent border-none outline-none z-50 text-[10px] md:text-xs tracking-[0.2em] uppercase"
        >
          <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" height="14" width="14"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"></path></svg>
          Volver
        </button>
      )}

      {/* MenÃº de Usuario y Carrito */}
      {user ? (
        <div className="absolute top-6 right-4 md:right-12 flex items-center gap-4 md:gap-6 z-[100]">

          {userRole !== 'admin' && (
            <button
              id="cart-icon"
              aria-label="Abrir carrito"
              onClick={() => setActiveView('bag')}
              className={`text-white hover:text-gray-300 transition-all duration-300 relative cursor-pointer bg-transparent border-none outline-none ${cartPulse ? 'scale-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'scale-100'}`}
            >
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="20" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2 13h10l2-9H6M9 21h.01M17 21h.01"></path></svg>
              <span className="absolute -top-1 -right-2 bg-white text-black text-[8px] md:text-[9px] font-bold px-[5px] py-[1px] rounded-full shadow-lg">{carrito.length}</span>
            </button>
          )}

          <button aria-label="Abrir menÃº de cuenta" className="relative cursor-pointer text-white hover:text-gray-300 transition-colors bg-transparent border-none outline-none py-2" onClick={() => { setActiveView('home'); setMenuUsuarioActivo(!menuUsuarioActivo); setMenuAbierto(null); }}>
            <div className="text-white transition-colors">
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="22" width="22"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
            </div>
          </button>
        </div>
      ) : null}

      {/* Logo */}
      <img src={logo} alt="ANTARES" fetchPriority="high" decoding="async" onClick={() => setActiveView('home')} className="h-14 sm:h-16 md:h-20 max-w-[52vw] w-auto mt-2 mb-0 z-[100] cursor-pointer drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-500" />

      {!user && (
        <button onClick={() => setShowLoginModal(true)} aria-label="Iniciar sesiÃ³n" className="text-white hover:text-gray-400 transition-colors p-0 mb-3 bg-transparent border-none outline-none cursor-pointer z-[100]">
          <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="28" width="28"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </button>
      )}

      {/* NavegaciÃ³n (Solo Home) */}
      {user && activeView === 'home' && (
        <nav className="relative z-[100] w-full flex overflow-x-auto whitespace-nowrap justify-start md:justify-center items-center gap-6 px-4 py-3 no-scrollbar pointer-events-auto">
          <ul className="mx-auto flex w-max min-w-max flex-row items-center gap-6 py-0.5 text-[12px] md:text-[14px] tracking-[0.2em] md:tracking-[0.3em] uppercase border-none bg-transparent">
            {(menuUsuarioActivo ? ['Mi Perfil', ...(userRole === 'admin' ? ['Gestionar Pedidos', 'Inventario / Finanzas'] : ['Mis Pedidos', `Deseos (${favoritos.length})`]), 'Cerrar SesiÃ³n'] : [...catalogMenus, 'Obsequios']).map(menu => {
              if (menuUsuarioActivo) {
                const action = menu.startsWith('Deseos') ? 'deseos' : menu === 'Mi Perfil' ? 'perfil' : menu === 'Mis Pedidos' || menu === 'Gestionar Pedidos' ? 'pedidos' : menu === 'Inventario / Finanzas' ? 'inventario' : null;
                return (
                  <li key={menu} className="relative shrink-0 cursor-pointer py-1" onClick={() => action ? setActiveView(action) : handleLogout()}>
                    <div className={`inline-block relative transition-colors ${menu === 'Cerrar SesiÃ³n' ? 'text-red-400 hover:text-red-300' : 'text-gray-300 hover:text-white'}`}>
                      {menu}
                    </div>
                  </li>
                );
              }

              if (menu === 'Obsequios') {
                return null;
              }

              const isMenuHidden = isItemHidden(menu) || (estructuraCatalogo[menu] && estructuraCatalogo[menu].every(sub => isItemHidden(sub)));
              if (isMenuHidden && userRole !== 'admin') return null;

              return (
                <li key={menu} aria-hidden={userRole !== 'admin' && isMenuHidden} className={`group relative shrink-0 py-1 menu-item-visibility ${menuAbierto === menu ? 'z-[300]' : 'z-0'}`} onPointerEnter={event => {
                  if (event.pointerType === 'mouse') handleMenuHover(menu, !isMenuHidden);
                }}>
                  <button
                    ref={element => {
                      if (element) menuTriggerRefs.current.set(menu, element);
                      else menuTriggerRefs.current.delete(menu);
                    }}
                    type="button"
                    aria-expanded={menuAbierto === menu}
                    aria-haspopup="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isMenuHidden || userRole === 'admin') setMenuAbierto(menuAbierto === menu ? null : menu);
                      setMenuUsuarioActivo(false);
                    }}
                    className={`inline-block relative bg-transparent border-none p-0 cursor-pointer transition-colors duration-300 ${isMenuHidden ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                  >
                    {menu}
                  </button>
                </li>
              );
            })}
            
            {/* Obsequios */}
            {!menuUsuarioActivo && !normalizedHiddenItems.includes('obsequios') && (
              <li aria-hidden={userRole !== 'admin' && normalizedHiddenItems.includes('obsequios')} className="group relative shrink-0 py-1 menu-item-visibility" onPointerEnter={event => {
                if (event.pointerType === 'mouse') handleMenuHover('Obsequios', !normalizedHiddenItems.includes('obsequios'));
              }}>
                <button
                  ref={element => {
                    if (element) menuTriggerRefs.current.set('Obsequios', element);
                    else menuTriggerRefs.current.delete('Obsequios');
                  }}
                  type="button"
                  aria-expanded={menuAbierto === 'Obsequios'}
                  aria-haspopup="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!normalizedHiddenItems.includes('obsequios') || userRole === 'admin') setMenuAbierto(menuAbierto === 'Obsequios' ? null : 'Obsequios');
                    setMenuUsuarioActivo(false);
                  }}
                  className={`inline-block relative bg-transparent border-none p-0 cursor-pointer transition-colors duration-300 ${normalizedHiddenItems.includes('obsequios') ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                >
                  Obsequios
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}

      {user && activeView === 'home' && menuAbierto && createPortal(
        <div
          ref={submenuRef}
          className={`menu-dropdown fixed z-[10000] header-dropdown-panel ${cristalOpacoSubmenuClass} w-max max-w-[calc(100vw-1rem)] text-center`}
          style={{ left: 0, top: 0 }}
          onPointerLeave={event => {
            if (event.pointerType !== 'mouse') return;
            if (event.relatedTarget instanceof Node && headerRef.current?.contains(event.relatedTarget)) return;
            setMenuAbierto(null);
            setMenuUsuarioActivo(false);
          }}
        >
          {menuAbierto === 'Obsequios'
            ? [5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(price => (
              <button
                key={price}
                type="button"
                onClick={() => irACategoria(`Obsequios $${price}`)}
                className="whitespace-nowrap mt-2 first:mt-0 rounded-lg px-3 py-2 text-center text-xs text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                $ {price}.00 USD
              </button>
            ))
            : (estructuraCatalogo[menuAbierto] ?? []).filter(sub => !isItemHidden(sub)).map(sub => (
              <button
                key={sub}
                type="button"
                onClick={() => irACategoria(sub)}
                className="whitespace-nowrap mt-2 first:mt-0 rounded-lg px-3 py-2 text-center text-xs text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                {sub}
              </button>
            ))}
        </div>,
        document.body
      )}
    </header>
  );
}
