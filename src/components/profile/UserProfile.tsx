import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { supabase } from '../../services/supabase';
import patron from '../../assets/patron.jpeg';

interface UserProfileProps {
  onNavigate: (view: string) => void;
}

export default function UserProfile({ onNavigate }: UserProfileProps) {
  const { user, userRole } = useAuth();
  const { hiddenItems, setHiddenItems, estructuraCatalogo, subcategoriasJoyeria, productos, parseTallasseguro, tallasDisponibles } = useShop();

  const [menuPdfExpandido, setMenuPdfExpandido] = useState<string | null>(null);
  const [categoriasDescarga, setCategoriasDescarga] = useState<string[]>([]);
  const profileDraftKey = `antares_profile_draft_${user?.id || 'guest'}`;
  let savedDraft: Partial<{ tratamiento: string; firstName: string; secondName: string; lastName: string; secondLastName: string; telefono: string }> | null = null;
  try {
    const draft = localStorage.getItem(profileDraftKey);
    savedDraft = draft ? JSON.parse(draft) : null;
  } catch {
    savedDraft = null;
  }

  const [profileForm, setProfileForm] = useState({
    tratamiento: String(savedDraft?.tratamiento ?? user?.user_metadata?.tratamiento ?? ''),
    firstName: String(savedDraft?.firstName ?? user?.user_metadata?.first_name ?? ''),
    secondName: String(savedDraft?.secondName ?? user?.user_metadata?.second_name ?? ''),
    lastName: String(savedDraft?.lastName ?? user?.user_metadata?.last_name ?? ''),
    secondLastName: String(savedDraft?.secondLastName ?? user?.user_metadata?.second_last_name ?? ''),
    telefono: String(savedDraft?.telefono ?? user?.user_metadata?.telefono ?? '')
  });
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [tratoAbierto, setTratoAbierto] = useState(false);
  const tratoTouchStart = useRef<number | null>(null);
  const tratoWheelDelta = useRef(0);
  const [profileSaved, setProfileSaved] = useState(false);
  const tratamientos = ['', 'Sr.', 'Sra.', 'Srta.'];
  const tratamientoIndex = Math.max(0, tratamientos.indexOf(profileForm.tratamiento));

  const LOGO_URL = "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/aa.png";

  const profileIsIncomplete = !profileSaved && (!user?.user_metadata?.first_name || !user?.user_metadata?.last_name || !user?.user_metadata?.telefono);

  useEffect(() => {
    localStorage.setItem(profileDraftKey, JSON.stringify(profileForm));
  }, [profileDraftKey, profileForm]);

  const updateProfileField = (field: keyof typeof profileForm, value: string) => {
    setProfileForm(current => ({ ...current, [field]: value }));
  };

  const cambiarTratamiento = (direccion: number) => {
    const actual = tratamientos.indexOf(profileForm.tratamiento);
    const siguiente = Math.min(Math.max(actual + direccion, 0), tratamientos.length - 1);
    updateProfileField('tratamiento', tratamientos[siguiente]);
  };

  const manejarRuedaTratamiento = (event: React.WheelEvent) => {
    event.preventDefault();
    tratoWheelDelta.current += event.deltaY;
    if (Math.abs(tratoWheelDelta.current) < 70) return;
    cambiarTratamiento(tratoWheelDelta.current > 0 ? 1 : -1);
    tratoWheelDelta.current = 0;
  };

  const manejarTouchTratamiento = (event: React.TouchEvent) => {
    const inicio = tratoTouchStart.current;
    tratoTouchStart.current = event.touches[0]?.clientY ?? null;
    if (inicio === null || inicio === undefined) return;
    const desplazamiento = inicio - (event.touches[0]?.clientY ?? inicio);
    if (Math.abs(desplazamiento) > 18) {
      cambiarTratamiento(desplazamiento > 0 ? 1 : -1);
      tratoTouchStart.current = event.touches[0]?.clientY ?? null;
    }
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError('');
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim() || !profileForm.telefono.trim()) {
      setProfileError('Completa los campos obligatorios para continuar.');
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: profileForm.firstName.trim(),
        second_name: profileForm.secondName.trim(),
        last_name: profileForm.lastName.trim(),
        second_last_name: profileForm.secondLastName.trim(),
        telefono: profileForm.telefono.trim(),
        tratamiento: profileForm.tratamiento
      }
    });
    setSavingProfile(false);

    if (error) {
      setProfileError('No se pudieron guardar tus datos. Inténtalo nuevamente.');
    } else {
      localStorage.removeItem(profileDraftKey);
      setProfileSaved(true);
    }
  };

  const solicitarCambioContrasena = async () => {
    if (!user || !user.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin });
      if (error) throw error;
      alert(`Se ha enviado un enlace oficial de ANTARES al correo ${user.email}. Por favor, revise su bandeja de entrada.`);
    } catch (error) { 
      alert('Hubo un error al procesar su solicitud. Inténtelo más tarde.'); 
    }
  };

  const toggleMenuVisibility = async (itemName: string) => {
    let newHidden = [...hiddenItems];
    const isCurrentlyHidden = hiddenItems.includes(itemName);
    const isMainMenu = Object.keys(estructuraCatalogo).includes(itemName) || itemName === 'Obsequios';

    if (isMainMenu) {
      let itemsToToggle = [itemName];
      if (estructuraCatalogo[itemName]) itemsToToggle = [...itemsToToggle, ...estructuraCatalogo[itemName]];
      if (isCurrentlyHidden) newHidden = newHidden.filter(item => !itemsToToggle.includes(item));
      else newHidden = [...new Set([...newHidden, ...itemsToToggle])];
    } else {
      if (isCurrentlyHidden) newHidden = newHidden.filter(i => i !== itemName);
      else newHidden.push(itemName);
    }
    
    setHiddenItems(newHidden); 
    await supabase.from('configuracion').update({ menus_ocultos: newHidden }).eq('id', 1);
  };

  const isAllSelected = (menuPrincipal: string) => estructuraCatalogo[menuPrincipal].every(sub => categoriasDescarga.includes(sub));

  const toggleAll = (menuPrincipal: string) => {
    const subs = estructuraCatalogo[menuPrincipal];
    if (isAllSelected(menuPrincipal)) {
      setCategoriasDescarga(prev => prev.filter(c => !subs.includes(c)));
    } else {
      const newSelections = [...categoriasDescarga];
      subs.forEach(sub => { if (!newSelections.includes(sub)) newSelections.push(sub); });
      setCategoriasDescarga(newSelections);
    }
  };

  const handleCheckbox = (categoria: string) => {
    setCategoriasDescarga(prev => 
      prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]
    );
  };

  if (profileIsIncomplete) {
    return (
      <section className="w-full max-w-2xl mx-auto px-4 py-12 md:py-20 flex-grow animate-fade-in relative z-10">
        <form onSubmit={handleProfileSubmit} className="liquid-glass liquid-form p-7 md:p-12 shadow-2xl rounded-[2rem]">
          <div className="text-center mb-10">
            <p className="text-[9px] tracking-[0.35em] uppercase text-white/50 mb-4">Bienvenido al Atelier</p>
            <h2 className="text-[15px] md:text-[20px] tracking-[0.4em] uppercase text-white font-light">Completa tu perfil</h2>
            <p className="text-[9px] tracking-[0.15em] uppercase text-white/45 mt-4 leading-relaxed">Necesitamos algunos datos para personalizar tu experiencia.</p>
          </div>

          {profileError && <p className="liquid-notice text-red-300 text-[9px] tracking-[0.15em] uppercase text-center mb-6">{profileError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
            <label className="liquid-field-label">Primer nombre *
              <input required value={profileForm.firstName} onChange={event => updateProfileField('firstName', event.target.value)} placeholder="PRIMER NOMBRE" />
            </label>
            <label className="liquid-field-label">Segundo nombre
              <input value={profileForm.secondName} onChange={event => updateProfileField('secondName', event.target.value)} placeholder="SEGUNDO NOMBRE" />
            </label>
            <label className="liquid-field-label">Primer apellido *
              <input required value={profileForm.lastName} onChange={event => updateProfileField('lastName', event.target.value)} placeholder="PRIMER APELLIDO" />
            </label>
            <label className="liquid-field-label">Segundo apellido
              <input value={profileForm.secondLastName} onChange={event => updateProfileField('secondLastName', event.target.value)} placeholder="SEGUNDO APELLIDO" />
            </label>
            <label className="liquid-field-label">Número telefónico *
              <input required type="tel" value={profileForm.telefono} onChange={event => updateProfileField('telefono', event.target.value)} placeholder="NÚMERO TELEFÓNICO" />
            </label>
            <label className="liquid-field-label relative">Trato
              <button
                type="button"
                aria-expanded={tratoAbierto}
                onClick={() => setTratoAbierto(current => !current)}
                onWheel={manejarRuedaTratamiento}
                onTouchStart={event => { tratoTouchStart.current = event.touches[0]?.clientY ?? null; }}
                onTouchMove={manejarTouchTratamiento}
                className="liquid-select-trigger"
              >
                {profileForm.tratamiento || 'SELECCIONAR'}
              </button>
              {tratoAbierto && (
                <div
                  className="liquid-select-menu"
                  onWheel={manejarRuedaTratamiento}
                  onTouchStart={event => { tratoTouchStart.current = event.touches[0]?.clientY ?? null; }}
                  onTouchMove={manejarTouchTratamiento}
                >
                  <div className="liquid-select-wheel" style={{ transform: `translateY(-${Math.max(0, tratamientoIndex - 1) * 2.5}rem)` }}>
                    {tratamientos.map(tratamiento => (
                      <button
                        key={tratamiento || 'seleccionar'}
                        type="button"
                        onClick={() => { updateProfileField('tratamiento', tratamiento); setTratoAbierto(false); }}
                        className={`liquid-select-option ${profileForm.tratamiento === tratamiento ? 'is-selected' : ''}`}
                      >
                        {tratamiento || 'SELECCIONAR'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </label>
          </div>

          <button type="submit" disabled={savingProfile} className="liquid-button w-full mt-10 py-4 text-[10px] font-bold tracking-[0.35em] uppercase disabled:opacity-50">
            {savingProfile ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <>
      <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-20 flex-grow animate-fade-in relative z-10">
        <div className="profile-card liquid-glass shadow-2xl rounded-[2rem] flex flex-col items-center" style={{ backgroundImage: `linear-gradient(145deg, rgba(13, 14, 18, 0.66), rgba(4, 5, 7, 0.86)), url(${patron})` }}>
          <div className="profile-card-content">
            <div className="profile-identity">
              <p className="profile-treatment">{user?.user_metadata?.tratamiento || ''}</p>
              <h2 className="profile-name">
                {user?.user_metadata?.first_name || 'NO ESPECIFICADO'} {user?.user_metadata?.second_name || ''}
              </h2>
              <h3 className="profile-surname">
                {user?.user_metadata?.last_name || 'NO ESPECIFICADO'} {user?.user_metadata?.second_last_name || ''}
              </h3>
            </div>

            <div className="profile-divider" />

            <div className="profile-contact">
              <p className="profile-contact-label">Correo Electrónico</p>
              <p className="profile-contact-value" title={user?.email}>{user?.email}</p>
              <p className="profile-contact-label profile-phone-label">Teléfono</p>
              <p className="profile-contact-value">{user?.user_metadata?.telefono || 'NO ESPECIFICADO'}</p>
            </div>
          </div>

          <div className="w-full border-t border-white/10 pt-10 mb-12 flex flex-col sm:flex-row justify-center gap-4 md:gap-8">
            <button 
              onClick={() => onNavigate('medidas')} 
              className="text-[8px] md:text-[10px] tracking-[0.3em] uppercase text-white border border-white/20 px-8 py-4 hover:bg-white hover:text-black transition-all duration-500 outline-none cursor-pointer bg-transparent rounded-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            >
              Configurar Medidas
            </button>
            <button 
              onClick={solicitarCambioContrasena} 
              className="text-[8px] md:text-[10px] tracking-[0.3em] uppercase text-white border border-white/20 px-8 py-4 hover:bg-white hover:text-black transition-all duration-500 outline-none cursor-pointer bg-transparent rounded-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            >
              Cambiar Contraseña
            </button>
          </div>

          {/* Opciones Admin - Menús */}
          {userRole === 'admin' && (
            <div className="mb-4 pt-8 md:pt-12 border-t border-white/10 mt-6 w-full flex flex-col items-center">
              <label className="block text-[14px] md:text-[16px] tracking-[0.4em] uppercase text-white mb-4 md:mb-6 text-center font-light drop-shadow-md">Configuración de Menús</label>
              <p className="text-gray-400 text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-center mb-8 md:mb-10 font-light max-w-lg">Oculta o muestra secciones en la página principal para los clientes.</p>
              
              <div className="flex flex-col gap-3 w-full max-w-md mx-auto mb-10">
                {Object.keys(estructuraCatalogo).concat('Obsequios').map(menu => (
                  <div key={menu} className="bg-black/20 backdrop-blur-md p-4 md:p-5 border border-white/10 rounded-sm">
                    <div className="flex justify-between items-center">
                      <span className={`text-[12px] md:text-[14px] tracking-[0.2em] uppercase font-bold ${hiddenItems.includes(menu) ? 'text-red-500/70' : 'text-white'}`}>{menu}</span>
                      <button 
                        onClick={() => toggleMenuVisibility(menu)} 
                        className={`text-[8px] md:text-[9px] uppercase tracking-[0.2em] bg-transparent border px-4 py-2 cursor-pointer transition-colors rounded-sm ${hiddenItems.includes(menu) ? 'border-gray-500 text-gray-400 hover:text-white' : 'border-white/30 text-white hover:bg-white hover:text-black'}`}
                      >
                        {hiddenItems.includes(menu) ? 'MOSTRAR' : 'OCULTAR'}
                      </button>
                    </div>
                    
                    {estructuraCatalogo[menu] && estructuraCatalogo[menu].map((sub: string) => (
                      <div key={sub} className="flex justify-between items-center pl-6 mt-4 pt-4 border-t border-white/5">
                        <span className={`text-[10px] tracking-[0.1em] uppercase ${hiddenItems.includes(sub) ? 'text-red-500/50' : 'text-gray-300 font-light'}`}>{sub}</span>
                        <button 
                          onClick={() => toggleMenuVisibility(sub)} 
                          className={`text-[8px] uppercase tracking-[0.2em] bg-transparent border px-3 py-1.5 cursor-pointer transition-colors rounded-sm ${hiddenItems.includes(sub) ? 'border-gray-600 text-gray-500 hover:text-white' : 'border-white/20 text-gray-300 hover:text-white hover:border-white'}`}
                        >
                          {hiddenItems.includes(sub) ? 'MOSTRAR' : 'OCULTAR'}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opciones Admin - PDF */}
          {userRole === 'admin' && (
            <div className="mb-4 pt-8 md:pt-12 border-t border-white/10 mt-6 w-full flex flex-col items-center">
              <label className="block text-[14px] md:text-[16px] tracking-[0.4em] uppercase text-white mb-4 md:mb-6 text-center font-light drop-shadow-md">Catálogo PDF</label>
              <p className="text-gray-400 text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-center mb-8 md:mb-10 font-light max-w-lg">Seleccione las colecciones que desea incluir en su PDF interactivo comercial.</p>
              
              <div className="flex flex-col gap-4 md:gap-6 mb-10 md:mb-12 w-full max-w-md mx-auto">
                {Object.entries(estructuraCatalogo).map(([menuPrincipal, submenus]) => (
                  <div key={menuPrincipal} className="border border-white/10 rounded-sm bg-black/20">
                    <div 
                      className="w-full flex justify-between items-center p-4 group cursor-pointer" 
                      onClick={() => setMenuPdfExpandido(menuPdfExpandido === menuPrincipal ? null : menuPrincipal)}
                    >
                      <button className="text-gray-300 group-hover:text-white text-[12px] md:text-[14px] tracking-[0.3em] uppercase bg-transparent border-none outline-none cursor-pointer transition-colors text-left flex-grow font-bold">
                        {menuPrincipal}
                      </button>
                      <div 
                        className={`w-4 h-4 border transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer rounded-sm ${isAllSelected(menuPrincipal) ? 'bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-gray-500'}`} 
                        onClick={(e) => { e.stopPropagation(); toggleAll(menuPrincipal); }}
                      >
                        {isAllSelected(menuPrincipal) && <div className="w-2.5 h-2.5 bg-black"></div>}
                      </div>
                    </div>
                    {menuPdfExpandido === menuPrincipal && (
                      <div className="p-4 border-t border-white/5 flex flex-col gap-4 bg-black/40 animate-fade-in">
                        {submenus.map(cat => (
                          <label key={cat} className="flex items-center gap-4 cursor-pointer group w-full pl-2">
                            <div className={`w-4 h-4 border transition-colors flex items-center justify-center flex-shrink-0 rounded-sm ${categoriasDescarga.includes(cat) ? 'bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-gray-500 group-hover:border-white/50'}`}>
                              {categoriasDescarga.includes(cat) && <div className="w-2.5 h-2.5 bg-black"></div>}
                            </div>
                            <input type="checkbox" className="hidden" onChange={() => handleCheckbox(cat)} checked={categoriasDescarga.includes(cat)} />
                            <span className="text-gray-400 group-hover:text-white text-[10px] tracking-[0.2em] uppercase transition-colors font-light">{cat}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={() => window.print()} 
                  className="text-black text-[10px] md:text-[12px] font-bold tracking-[0.3em] uppercase px-8 md:px-10 py-4 md:py-5 bg-white hover:bg-gray-300 transition-all duration-300 cursor-pointer outline-none border-none shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center justify-center gap-3 rounded-sm"
                >
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="16" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Generar Catálogo PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* BLOQUE OCULTO PARA IMPRESIÓN PDF (GÓTICO / LIQUID) */}
      {userRole === 'admin' && (
      <div className="hidden print-only w-full font-serif pb-0" style={{ backgroundColor: '#000000', color: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        
        {(categoriasDescarga.length > 0 ? categoriasDescarga : Object.values(estructuraCatalogo).flat()).map((cat) => {
          const piezasDeCategoria = productos.filter(p => p.categoria === cat);
          const parentMenu = Object.entries(estructuraCatalogo).find(([_, subs]) => subs.includes(cat))?.[0];
          
          if (piezasDeCategoria.length === 0) return null;

          const piezasPorSub: Record<string, typeof productos> = {};
          subcategoriasJoyeria.forEach(sub => {
            const piezas = piezasDeCategoria.filter(p => p.subcategoria === sub);
            if (piezas.length > 0) piezasPorSub[sub] = piezas;
          });
          const piezasSinSub = piezasDeCategoria.filter(p => !subcategoriasJoyeria.includes(p.subcategoria));
          if (piezasSinSub.length > 0) piezasPorSub['Otros'] = piezasSinSub;

          return Object.entries(piezasPorSub).map(([subcat, piezasDeSub]) => {
             const gruposDe4 = [];
             for (let i = 0; i < piezasDeSub.length; i += 4) {
               gruposDe4.push(piezasDeSub.slice(i, i + 4));
             }

             return (
              <div key={`${cat}-${subcat}`}>
                {/* PORTADA EXCLUSIVA */}
                <div className="break-after-page w-full flex flex-col items-center justify-center p-10 box-border border-b-8 border-transparent relative" style={{ backgroundColor: '#000000', height: '280mm' }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#111] to-[#000] z-0"></div>
                  <img src={LOGO_URL} alt="ANTARES" className="h-40 w-auto object-contain mb-20 z-10 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" />
                  <h3 className="text-3xl tracking-[0.5em] uppercase mb-6 text-center z-10 font-light" style={{ color: '#888888' }}>{parentMenu}</h3>
                  <h2 className="text-7xl tracking-[0.3em] uppercase mb-10 text-center font-bold z-10" style={{ color: '#ffffff', textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>{cat}</h2>
                  <h4 className="text-2xl tracking-[0.4em] uppercase text-center z-10" style={{ color: '#666666' }}>— {subcat} —</h4>
                </div>

                {/* PÁGINAS DE PRODUCTOS */}
                {gruposDe4.map((grupo, indexGrupo) => (
                  <div key={`${cat}-${subcat}-${indexGrupo}`} className="break-after-page w-full flex flex-col box-border" style={{ backgroundColor: '#000000', height: '280mm' }}>
                    <div className="grid grid-cols-2 grid-rows-2 w-full h-full border-t border-l border-white/10">
                      {grupo.map((p) => (
                        <div key={p.id} className="flex flex-col items-center text-center relative border-b border-r border-white/10 p-6 h-full bg-gradient-to-br from-[#0a0a0a] to-[#000000]">
                          <div className="absolute -bottom-[8px] -right-[8px] w-4 h-4 bg-black z-20 flex items-center justify-center border border-white/20">
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white"><path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z"/></svg>
                          </div>
                          
                          <div className="relative w-full h-[240px] flex items-center justify-center bg-transparent mb-4 mt-2">
                            <img src={p.imagen_url} className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" alt={p.titulo} />
                            {p.vendido && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                                <span className="tracking-[0.4em] text-[12px] font-bold uppercase border px-6 py-3 bg-black/90 text-white border-white/50 shadow-[0_0_20px_rgba(0,0,0,0.8)]">Agotado</span>
                              </div>
                            )}
                          </div>
                          
                          <h3 className="text-[14px] tracking-[0.2em] font-bold uppercase mb-2 break-words line-clamp-2 text-white drop-shadow-md">{p.titulo}</h3>
                          <p className="text-white text-xl font-light tracking-[0.1em] mb-4 font-serif">${p.precio} USD</p>
                          
                          {p.subcategoria === 'Anillos' ? (
                            <div className="flex gap-3 justify-center mb-4 flex-wrap">
                               {tallasDisponibles.map(t => {
                                 const stock = parseInt(String(parseTallasseguro(p.tallas)[t] || 0));
                                 const isAvailable = stock > 0;
                                 return (
                                   <div key={t} className="flex flex-col items-center gap-1.5">
                                     <div className="font-serif text-[12px] font-bold flex items-center justify-center w-8 h-8 rounded-sm" style={{ border: `1px solid ${isAvailable ? 'rgba(255,255,255,0.6)' : 'rgba(255,0,0,0.3)'}`, color: isAvailable ? '#ffffff' : '#ff0000', backgroundColor: isAvailable ? 'transparent' : 'rgba(255,0,0,0.05)' }}>
                                       {t}
                                     </div>
                                     <span className="font-serif text-[10px]" style={{ color: isAvailable ? '#aaaaaa' : '#ff0000', opacity: isAvailable ? 1 : 0.7 }}>
                                       {stock}
                                     </span>
                                   </div>
                                 );
                               })}
                            </div>
                          ) : (
                            <div className="h-6 mb-4"></div> 
                          )}

                          <p className="text-[11px] leading-relaxed px-6 line-clamp-3 uppercase text-gray-400 mt-auto mb-4">{p.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
             );
          });
        })}
      </div>
      )}
    </>
  );
}