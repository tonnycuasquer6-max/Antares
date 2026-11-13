import { 
  LOGO_URL, 
  FONDO_HEADER_URL, 
  estructuraCatalogo, 
  cristalOpacoSubmenuClass, 
  menuUnderlineClass 
} from '../utils/constants';

export default function Header({ store }: { store: any }) {
  const {
    user, userRole, activeView, setActiveView, carrito, cartPulse, 
    userMenuAbierto, setUserMenuAbierto, menuAbierto, setMenuAbierto, 
    setOpenFilter, setOpenFormSelect, handleLogout, irACategoria, 
    hiddenItems, setShowLoginModal, favoritos, setCheckoutPaso
  } = store;

  return (
    <header className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-[100] pt-3 px-4 sm:px-6 md:px-8" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
      {user && activeView !== 'home' && (
        <button onClick={() => setActiveView('home')} className="absolute top-6 left-4 md:left-12 flex items-center gap-1.5 text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none z-50 text-[10px] md:text-xs tracking-[0.2em] uppercase">
          Volver
        </button>
      )}

      {user && (
        <div className="absolute top-6 right-4 md:right-12 flex items-center gap-4 md:gap-6 z-[100]">
          {userRole !== 'admin' && (
            <button onClick={() => { setActiveView('bag'); setCheckoutPaso(1); }} className={`text-white hover:text-gray-400 transition-all duration-300 relative cursor-pointer bg-transparent border-none outline-none ${cartPulse ? 'scale-125 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'scale-100'}`}>
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="20" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
              <span className="absolute -top-1 -right-2 bg-white text-black text-[8px] md:text-[9px] font-bold px-[4px] md:px-[5px] py-[1px] rounded-full">{carrito.length}</span>
            </button>
          )}

          <div 
            className="relative cursor-pointer" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setUserMenuAbierto(!userMenuAbierto); setMenuAbierto(null); setOpenFilter(null); setOpenFormSelect(null); }}
          >
            <div className="text-white hover:text-gray-400 transition-colors bg-transparent border-none outline-none py-2">
              <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="22" width="22"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
            </div>
            <div className={`absolute top-full right-0 pt-2 z-[100] ${userMenuAbierto ? 'block' : 'hidden lg:group-hover:block'}`}>
              <div className={`${cristalOpacoSubmenuClass} min-w-[150px] md:min-w-[200px] text-right`}>
                <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); setActiveView('perfil'); }} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block w-full py-2">Mi Perfil</div>
                {userRole === 'admin' ? (
                  <>
                    <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); setActiveView('pedidos'); }} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-3 w-full py-2">Gestionar Pedidos</div>
                    <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); setActiveView('inventario'); }} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-white hover:text-gray-100 transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-3 mb-3 font-bold w-full py-2">Inventario / Finanzas</div>
                  </>
                ) : (
                  <>
                    <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); setActiveView('pedidos'); }} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-3 w-full py-2">Mis Pedidos</div>
                    <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); setActiveView('deseos'); }} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-3 mb-3 w-full py-2">Deseos ({favoritos.length})</div>
                  </>
                )}
                <hr className="border-white/10 my-2" />
                <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); handleLogout(); }} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors text-right bg-transparent border-none p-0 cursor-pointer outline-none block w-full py-2">Cerrar Sesión</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <img src={LOGO_URL} alt="ANTARES" onClick={() => setActiveView('home')} className="h-16 md:h-32 w-auto mt-[10px] md:mt-[4px] z-[100] cursor-pointer" />

      {user && activeView === 'home' && (
        <nav className="w-full mt-4 mb-2 relative z-[100] px-2 md:px-6 pt-0 animate-fade-in">
          <ul className="flex flex-wrap justify-center gap-y-4 gap-x-6 md:gap-x-16 py-2 text-[13pt] tracking-[0.2em] md:tracking-[0.3em] uppercase border-none bg-transparent px-4 md:px-0">
            {Object.keys(estructuraCatalogo).map(menu => {
              const isMenuHidden = hiddenItems.includes(menu);
              if (userRole !== 'admin' && isMenuHidden) return null;
              return (
                <li key={menu} className="group relative cursor-pointer py-2 border-none bg-transparent" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuAbierto(menuAbierto === menu ? null : menu); setUserMenuAbierto(false); }}>
                  <div className={`inline-block relative transition-colors ${isMenuHidden ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                    {menu}
                    <div className={`${menuUnderlineClass} ${menuAbierto === menu ? 'w-full left-0' : 'w-0 left-1/2 lg:group-hover:w-full lg:group-hover:left-0'}`}></div>
                  </div>
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[100] ${menuAbierto === menu ? 'block' : 'hidden lg:group-hover:block'}`}>
                    <div className={`${cristalOpacoSubmenuClass} min-w-[180px] md:min-w-[220px] text-center`}>
                      {estructuraCatalogo[menu].map(sub => {
                        const isSubHidden = hiddenItems.includes(sub);
                        if (userRole !== 'admin' && isSubHidden) return null;
                        return (
                          <div key={sub} onClick={(e) => { e.stopPropagation(); setMenuAbierto(null); irACategoria(sub); }} className={`cursor-pointer block mt-3 first:mt-0 text-[10px] md:text-xs transition-colors py-2 ${isSubHidden ? 'text-red-500' : 'text-gray-400 hover:text-gray-300'}`}>
                            {sub}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
            
            {(!hiddenItems.includes('Obsequios') || userRole === 'admin') && (
              <li className="group relative cursor-pointer py-2 border-none bg-transparent" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuAbierto(menuAbierto === 'Obsequios' ? null : 'Obsequios'); setUserMenuAbierto(false); }}>
                <div className={`inline-block relative transition-colors ${hiddenItems.includes('Obsequios') ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                  Obsequios
                  <div className={`${menuUnderlineClass} ${menuAbierto === 'Obsequios' ? 'w-full left-0' : 'w-0 left-1/2 lg:group-hover:w-full lg:group-hover:left-0'}`}></div>
                </div>
                <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[100] ${menuAbierto === 'Obsequios' ? 'block' : 'hidden lg:group-hover:block'}`}>
                  <div className={`${cristalOpacoSubmenuClass} min-w-[150px] md:min-w-[180px] text-center max-h-64 overflow-y-auto`}>
                    {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(p => (
                      <div key={p} onClick={(e) => { e.stopPropagation(); setMenuAbierto(null); irACategoria(`Obsequios $${p}`); }} className="text-gray-400 hover:text-gray-300 transition-colors cursor-pointer block mt-3 first:mt-0 text-[10px] md:text-xs py-2">
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

      {!user && (
        <div className="w-full flex justify-center mt-4 mb-4 auth-wrapper">
          <button onClick={() => setShowLoginModal(true)} className="text-white hover:text-gray-400 transition-colors p-0 bg-transparent border-none outline-none cursor-pointer z-50">
            <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="30" width="30"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </button>
        </div>
      )}
    </header>
  );
}