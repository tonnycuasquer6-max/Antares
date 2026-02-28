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
  const [userRole, setUserRole] = useState('admin'); 
  
  const [activeView, setActiveView] = useState('home');
  const [activeCategory, setActiveCategory] = useState(''); 
  
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [nuevaPieza, setNuevaPieza] = useState({ titulo: '', descripcion: '', precio: '', imagen: null });
  
  // 👇 EL CATÁLOGO AHORA EMPIEZA VACÍO Y ES DINÁMICO 👇
  const [productos, setProductos] = useState<any[]>([]);
  
  const [categoriasDescarga, setCategoriasDescarga] = useState<string[]>([]);
  const [menuPdfExpandido, setMenuPdfExpandido] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowLoginModal(false); 
        fetchUserRole(session.user.id);
      } else {
        setUserRole('cliente');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase.from('perfiles').select('rol').eq('id', userId).single();
      if (data) setUserRole(data.rol);
    } catch (error) {
      console.error("Error al obtener rol:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveView('home'); 
  };

  const irACategoria = (nombreCategoria) => {
    setActiveCategory(nombreCategoria);
    setActiveView('categoria');
    setShowInlineForm(false);
  };

  const handleCheckbox = (categoria) => {
    setCategoriasDescarga(prev => 
      prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]
    );
  };

  // 👇 FUNCIÓN PARA AÑADIR PIEZAS VISUALMENTE 👇
  const handlePublicarLocal = (e) => {
    e.preventDefault();
    if (!nuevaPieza.titulo || !nuevaPieza.precio) return alert('Ponle un título y precio a la pieza.');
    
    const nuevoId = Date.now();
    // Crea una URL temporal para la imagen si se subió una
    const imageUrl = nuevaPieza.imagen ? URL.createObjectURL(nuevaPieza.imagen) : 'https://images.unsplash.com/photo-1610486241074-b778f69d2d0b?q=80&w=1000';

    setProductos([{
      id: nuevoId,
      titulo: nuevaPieza.titulo,
      descripcion: nuevaPieza.descripcion,
      precio: nuevaPieza.precio,
      categoria: activeCategory,
      imagen_url: imageUrl
    }, ...productos]);

    setShowInlineForm(false);
    setNuevaPieza({ titulo: '', descripcion: '', precio: '', imagen: null });
  };

  // 👇 FUNCIÓN PARA BORRAR PIEZAS VISUALMENTE 👇
  const handleBorrarLocal = (id) => {
    if(window.confirm('¿Seguro que deseas retirar esta pieza del catálogo?')) {
      setProductos(productos.filter(p => p.id !== id));
    }
  };

  if (!areSupabaseCredentialsSet) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-center p-6 font-serif">
        <div className="bg-black/80 backdrop-blur-md p-12 rounded-sm max-w-2xl shadow-2xl border-none">
          <h2 className="text-3xl text-white mb-4 tracking-[0.2em] uppercase">Configuración Requerida</h2>
          <p className="text-gray-400">Verifica tus credenciales de Supabase en los Secrets.</p>
        </div>
      </div>
    );
  }

  const puenteInvisibleMenuUsuario = "absolute top-full right-0 pt-4 hidden group-hover:block z-50";
  const puenteInvisibleMenuPrincipal = "absolute top-full left-1/2 -translate-x-1/2 pt-4 hidden group-hover:block z-50";
  const cristalOpacoSubmenuClass = "flex flex-col bg-black/95 backdrop-blur-md border border-white/10 py-6 px-8 shadow-2xl rounded-sm";
  const menuUnderlineClass = "absolute bottom-0 left-1/2 w-0 h-px bg-white group-hover:w-full group-hover:left-0 transition-all duration-300";

  const estructuraCatalogo = {
    'Atelier': ['Joyería Exclusiva', 'Prêt-à-Porter'],
    'Joyería': ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
    'Esenciales': ['Básicos de Joyería', 'Básicos de Vestuario'],
    'Prêt-à-Porter': ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones']
  };

  return (
    <div className="bg-black text-white min-h-screen font-serif flex flex-col relative print:bg-black print:text-white">
      
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media print {
          @page { margin: 0; }
          body { background-color: black !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>

      <div className="screen-only flex flex-col flex-grow w-full">
        <header className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-50 pt-3" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
          
          {user && activeView !== 'home' && (
            <button onClick={() => setActiveView('home')} className="absolute top-6 left-6 md:left-12 flex items-center gap-1.5 text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none z-50 text-xs tracking-[0.2em] uppercase">
              <span className="text-sm font-light relative -top-[1px]">&lt;</span> Volver
            </button>
          )}

          {user && (
            <div className="absolute top-6 right-6 md:right-12 flex items-center gap-6 z-50">
              <button className="text-white hover:text-gray-400 transition-colors relative cursor-pointer bg-transparent border-none outline-none">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="24" width="24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                <span className="absolute -top-1 -right-2 bg-white text-black text-[9px] font-bold px-[5px] py-[1px] rounded-full">0</span>
              </button>

              <div className="group relative">
                <button className="text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none">
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="26" width="26"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
                </button>
                <div className={puenteInvisibleMenuUsuario}>
                  <div className={`${cristalOpacoSubmenuClass} min-w-[200px] text-right`}>
                    <button onClick={() => setActiveView('perfil')} className="text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block">Mi Perfil</button>
                    <button onClick={() => setActiveView('pedidos')} className="text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-5">Mis Pedidos</button>
                    <button onClick={() => setActiveView('deseos')} className="text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-5 mb-5">Lista de Deseos</button>
                    <hr className="border-white/10 my-4" />
                    <button onClick={handleLogout} className="text-xs tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors text-right bg-transparent border-none p-0 cursor-pointer outline-none block">Cerrar Sesión</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <img src={LOGO_URL} alt="ANTARES" onClick={() => setActiveView('home')} className={`h-20 md:h-32 w-auto object-contain mt-[4px] z-10 cursor-pointer`} />

          {user && activeView === 'home' && (
            <nav className="w-full border-none bg-transparent mt-[4px] mb-[4px] relative z-40 px-6 pt-0 animate-fade-in">
              <ul className="flex justify-center gap-10 md:gap-20 py-0 text-xs md:text-sm tracking-[0.3em] uppercase text-gray-400 border-none bg-transparent">
                
                <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                  <span className="hover:text-white transition-colors block relative">Atelier<div className={menuUnderlineClass}></div></span>
                  <div className={puenteInvisibleMenuPrincipal}>
                    <div className={`${cristalOpacoSubmenuClass} min-w-[220px] text-center`}>
                      <span onClick={() => irACategoria('Joyería Exclusiva')} className="hover:text-gray-300 transition-colors cursor-pointer block">Joyería Exclusiva</span>
                      <span onClick={() => irACategoria('Prêt-à-Porter')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Prêt-à-Porter</span>
                    </div>
                  </div>
                </li>

                <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                  <span className="hover:text-white transition-colors block relative">Joyería<div className={menuUnderlineClass}></div></span>
                  <div className={puenteInvisibleMenuPrincipal}>
                    <div className={`${cristalOpacoSubmenuClass} min-w-[260px] text-center`}>
                      <span onClick={() => irACategoria('Acero Fino')} className="hover:text-gray-300 transition-colors cursor-pointer block">Acero Fino</span>
                      <span onClick={() => irACategoria('Plata de Ley 925')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Plata de Ley 925</span>
                      <span onClick={() => irACategoria('Gemas y Piedras Naturales')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Gemas y Piedras Naturales</span>
                    </div>
                  </div>
                </li>

                <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                  <span className="hover:text-white transition-colors block relative">Esenciales<div className={menuUnderlineClass}></div></span>
                  <div className={puenteInvisibleMenuPrincipal}>
                    <div className={`${cristalOpacoSubmenuClass} min-w-[220px] text-center`}>
                      <span onClick={() => irACategoria('Básicos de Joyería')} className="hover:text-gray-300 transition-colors cursor-pointer block">Básicos de Joyería</span>
                      <span onClick={() => irACategoria('Básicos de Vestuario')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Básicos de Vestuario</span>
                    </div>
                  </div>
                </li>

                <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                  <span className="hover:text-white transition-colors block relative">Prêt-à-Porter<div className={menuUnderlineClass}></div></span>
                  <div className={puenteInvisibleMenuPrincipal}>
                    <div className={`${cristalOpacoSubmenuClass} min-w-[220px] text-center`}>
                      <span onClick={() => irACategoria('Chaquetas')} className="hover:text-gray-300 transition-colors cursor-pointer block">Chaquetas</span>
                      <span onClick={() => irACategoria('Camisetas')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Camisetas</span>
                      <span onClick={() => irACategoria('Buzos')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Buzos</span>
                      <span onClick={() => irACategoria('Pantalones')} className="hover:text-gray-300 transition-colors cursor-pointer block mt-4">Pantalones</span>
                    </div>
                  </div>
                </li>

                <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                  <span className="hover:text-white transition-colors block relative">Obsequios<div className={menuUnderlineClass}></div></span>
                  <div className={puenteInvisibleMenuPrincipal}>
                    <div className={`${cristalOpacoSubmenuClass} min-w-[180px] text-center max-h-64 overflow-y-auto`}>
                      {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((price, idx) => (
                        <span key={price} onClick={() => irACategoria(`Obsequios $${price}`)} className={`hover:text-gray-300 transition-colors cursor-pointer block ${idx !== 0 ? 'mt-4' : ''}`}>
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
              <button onClick={() => setShowLoginModal(true)} className="text-white hover:text-gray-400 transition-colors p-0 bg-transparent border-none outline-none cursor-pointer">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="35" width="35"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            </div>
          )}
        </header>

        <main className="flex-grow flex flex-col items-center">
          
          {(!user || activeView === 'home') && (
            <div className="w-full animate-fade-in flex flex-col items-center pb-20">
               
               <section className="w-full text-center py-20 md:py-32 px-4">
                 <h2 className="text-5xl md:text-8xl font-bold tracking-[0.2em] uppercase text-white mb-8 opacity-90">Elegancia Atemporal</h2>
                 <p className="text-gray-400 tracking-[0.2em] uppercase text-xs max-w-2xl mx-auto leading-loose">
                   Bienvenido al Atelier de Antares. Un espacio dedicado a la sofisticación, el diseño atemporal y la exclusividad en cada detalle.
                 </p>
               </section>

               <section className="w-full max-w-5xl mx-auto py-20 px-6 text-center">
                 <h3 className="text-lg tracking-[0.3em] uppercase text-gray-500 mb-10">Sobre Nosotros</h3>
                 <p className="text-white text-lg md:text-2xl leading-relaxed max-w-3xl mx-auto font-light">
                   "Fundada con la visión de redefinir el lujo contemporáneo, Antares fusiona la artesanía tradicional con una estética vanguardista. Cada una de nuestras piezas cuenta una historia de meticulosa atención al detalle y pasión inquebrantable por la perfección."
                 </p>
               </section>

               <section className="w-full max-w-6xl mx-auto py-24 px-6">
                 <h3 className="text-lg tracking-[0.3em] uppercase text-gray-500 mb-16 text-center">Nuestros Servicios</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                   <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Sastrería a Medida')} className="p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer">
                     <h4 className="text-sm tracking-[0.2em] uppercase text-white mb-6">Sastrería a Medida</h4>
                     <p className="text-gray-400 text-xs tracking-[0.1em] leading-loose">Creación de prendas exclusivas adaptadas a su silueta y estilo personal, utilizando únicamente los tejidos más nobles.</p>
                   </div>
                   <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Joyería Exclusiva')} className="p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer">
                     <h4 className="text-sm tracking-[0.2em] uppercase text-white mb-6">Joyería Personalizada</h4>
                     <p className="text-gray-400 text-xs tracking-[0.1em] leading-loose">Diseño y forja de piezas únicas y exclusivas, seleccionando gemas excepcionales para capturar momentos eternos.</p>
                   </div>
                   <div onClick={() => !user ? setShowLoginModal(true) : setActiveView('perfil')} className="p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer">
                     <h4 className="text-sm tracking-[0.2em] uppercase text-white mb-6">Asesoría de Imagen</h4>
                     <p className="text-gray-400 text-xs tracking-[0.1em] leading-loose">Curaduría de estilo y armario por nuestros expertos, elevando su presencia y confianza en cada ocasión especial.</p>
                   </div>
                 </div>
               </section>

               <section className="w-full max-w-6xl mx-auto py-16 px-6">
                 <h3 className="text-lg tracking-[0.3em] uppercase text-gray-500 mb-16 text-center">Locaciones Editoriales</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="relative h-96 bg-zinc-900 overflow-hidden group cursor-pointer">
                     <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-all duration-700 z-10"></div>
                     <div className="absolute bottom-10 left-10 z-20">
                       <h4 className="text-2xl tracking-[0.2em] uppercase text-white mb-3">El Gran Salón</h4>
                       <p className="text-gray-400 text-xs tracking-[0.2em] uppercase">Estudio Principal Antares</p>
                     </div>
                   </div>
                   <div className="relative h-96 bg-zinc-900 overflow-hidden group cursor-pointer">
                     <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-all duration-700 z-10"></div>
                     <div className="absolute bottom-10 left-10 z-20">
                       <h4 className="text-2xl tracking-[0.2em] uppercase text-white mb-3">Jardín de Invierno</h4>
                       <p className="text-gray-400 text-xs tracking-[0.2em] uppercase">Espacio de Luz Natural</p>
                     </div>
                   </div>
                 </div>
               </section>
            </div>
          )}

          {/* VISTA CATEGORÍA */}
          {user && activeView === 'categoria' && (
            <section className="container mx-auto px-4 py-16 flex-grow animate-fade-in w-full max-w-6xl">
               <h2 className="text-2xl tracking-[0.3em] uppercase text-white mb-12 text-center border-b border-white/10 pb-6">{activeCategory}</h2>
               
               {userRole === 'admin' && !showInlineForm && (
                 <div onClick={() => setShowInlineForm(true)} className="mb-12 border border-dashed border-white/20 py-8 text-center hover:bg-zinc-900/40 transition-colors cursor-pointer">
                   <span className="text-amber-500 tracking-[0.2em] text-xs uppercase">+ Añadir nueva pieza a {activeCategory}</span>
                 </div>
               )}

               {userRole === 'admin' && showInlineForm && (
                 <form onSubmit={handlePublicarLocal} className="mb-16 bg-zinc-900/30 p-8 border border-white/5 relative">
                   <button type="button" onClick={() => setShowInlineForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer bg-transparent border-none text-xl">×</button>
                   <h3 className="text-sm tracking-[0.2em] uppercase text-white mb-6">Detalles de la Nueva Pieza</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     <input type="text" value={nuevaPieza.titulo} onChange={e => setNuevaPieza({...nuevaPieza, titulo: e.target.value})} placeholder="TÍTULO DE LA OBRA" className="bg-transparent border-b border-white/20 text-white text-xs tracking-[0.1em] py-2 outline-none" required/>
                     <input type="number" value={nuevaPieza.precio} onChange={e => setNuevaPieza({...nuevaPieza, precio: e.target.value})} placeholder="PRECIO (USD)" className="bg-transparent border-b border-white/20 text-white text-xs tracking-[0.1em] py-2 outline-none" required/>
                   </div>
                   <textarea value={nuevaPieza.descripcion} onChange={e => setNuevaPieza({...nuevaPieza, descripcion: e.target.value})} placeholder="DESCRIPCIÓN EDITORIAL..." rows="2" className="w-full bg-transparent border-b border-white/20 text-white text-xs tracking-[0.1em] py-2 outline-none mb-6 resize-none"></textarea>
                   
                   <div className="flex items-center justify-between">
                     <input type="file" onChange={e => setNuevaPieza({...nuevaPieza, imagen: e.target.files[0]})} className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" />
                     <button type="submit" className="text-black text-[10px] font-bold tracking-[0.3em] uppercase px-8 py-3 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none rounded-sm border-none">
                       Publicar
                     </button>
                   </div>
                 </form>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {productos.filter(p => p.categoria === activeCategory).map(producto => (
                   <div key={producto.id} className="group relative cursor-pointer">
                     <div className="overflow-hidden aspect-[3/4] bg-zinc-900 mb-4 relative">
                       <img src={producto.imagen_url} alt={producto.titulo} className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                       {userRole === 'admin' && (
                         <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); handleBorrarLocal(producto.id); }} className="bg-black/80 backdrop-blur-md p-2 text-white hover:text-red-500 border border-white/10 cursor-pointer text-[10px]">BORRAR</button>
                         </div>
                       )}
                     </div>
                     <h4 className="text-sm tracking-[0.2em] uppercase text-white mb-1">{producto.titulo}</h4>
                     <p className="text-xs tracking-[0.1em] text-gray-500">${producto.precio} USD</p>
                   </div>
                 ))}
                 
                 {/* 👇 MENSAJE SI EL CATÁLOGO ESTÁ VACÍO 👇 */}
                 {productos.filter(p => p.categoria === activeCategory).length === 0 && (
                    <p className="text-gray-500 tracking-[0.2em] uppercase text-xs col-span-full text-center py-10">No hay piezas en esta colección aún.</p>
                 )}
               </div>
            </section>
          )}

          {/* VISTA MI PERFIL */}
          {user && activeView === 'perfil' && (
            <section className="w-full max-w-3xl mx-auto px-4 py-16 flex-grow animate-fade-in">
              <h2 className="text-2xl tracking-[0.3em] uppercase text-white mb-10 text-center pb-4">Mi Perfil</h2>
              
              <div className="bg-black/80 backdrop-blur-md p-10 rounded-sm shadow-2xl border-none">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Nombres</label>
                    <p className="text-white text-lg">{user.user_metadata?.first_name || 'Tonny'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Correo Electrónico</label>
                    <p className="text-white text-lg">{user.email}</p>
                  </div>
                </div>

                <div className="mb-4 pt-8 border-t border-white/10 mt-8">
                  <label className="block text-sm tracking-[0.3em] uppercase text-white mb-6 text-center">Catálogo a la Carta</label>
                  <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase text-center mb-8">Seleccione las colecciones que desea incluir en su PDF interactivo.</p>
                  
                  {/* EL ACORDEÓN ELEGANTE */}
                  <div className="flex flex-col gap-4 mb-10 w-full max-w-md mx-auto">
                    {Object.entries(estructuraCatalogo).map(([menuPrincipal, submenus]) => (
                      <div key={menuPrincipal} className="border-b border-white/10 pb-4">
                        <button 
                          onClick={() => setMenuPdfExpandido(menuPdfExpandido === menuPrincipal ? null : menuPrincipal)}
                          className="w-full flex justify-between items-center text-white text-[10px] tracking-[0.3em] uppercase bg-transparent border-none outline-none cursor-pointer hover:text-gray-300 transition-colors"
                        >
                          {menuPrincipal}
                          <span className="text-gray-500 text-lg font-light">{menuPdfExpandido === menuPrincipal ? '-' : '+'}</span>
                        </button>
                        
                        {menuPdfExpandido === menuPrincipal && (
                          <div className="pt-6 flex flex-col gap-4 pl-2 animate-fade-in">
                            {submenus.map(cat => (
                              <label key={cat} className="flex items-center gap-4 cursor-pointer group w-full">
                                <div className={`w-3.5 h-3.5 border transition-colors flex items-center justify-center flex-shrink-0 ${categoriasDescarga.includes(cat) ? 'bg-white border-white' : 'border-gray-500 group-hover:border-white'}`}>
                                  {categoriasDescarga.includes(cat) && <div className="w-2 h-2 bg-black"></div>}
                                </div>
                                <input type="checkbox" className="hidden" onChange={() => handleCheckbox(cat)} checked={categoriasDescarga.includes(cat)} />
                                <span className="text-gray-400 group-hover:text-white text-[10px] tracking-[0.2em] uppercase transition-colors">{cat}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <button 
                      onClick={() => {
                        if(categoriasDescarga.length === 0) return alert("Selecciona al menos una categoría.");
                        window.print(); 
                      }} 
                      className="text-black text-[10px] font-bold tracking-[0.3em] uppercase px-8 py-3 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none rounded-sm border-none flex items-center justify-center gap-2"
                    >
                      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="16" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Generar Catálogo PDF
                    </button>
                  </div>
                </div>

              </div>
            </section>
          )}

        </main>

        <footer className="bg-black py-12 text-center text-gray-600 text-[9px] tracking-[0.5em] uppercase border-none mt-auto px-4 screen-only">
          &copy; {new Date().getFullYear()} ANTARES. Elegancia Atemporal.
        </footer>
      </div>

      {showLoginModal && <Auth onClose={() => setShowLoginModal(false)} />}

      {/* =========================================================
          VISTA FANTASMA PDF (CERO BORDES)
          ========================================================= */}
      <div className="hidden print-only bg-black text-white w-full min-h-screen font-serif pb-20">
        
        <header className="w-full flex flex-col items-center bg-cover bg-center mt-0 relative pt-10 pb-6 mb-16 border-b border-white/10" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
          <img src={LOGO_URL} alt="ANTARES" className={`h-24 w-auto object-contain z-10`} />
        </header>

        {categoriasDescarga.map(cat => {
          const piezasDeCategoria = productos.filter(p => p.categoria === cat);
          if (piezasDeCategoria.length === 0) return null;

          return (
            <div key={cat} className="mb-24 page-break-after px-10">
              <h2 className="text-4xl tracking-[0.2em] uppercase text-white mb-16 text-center">{cat}</h2>
              
              <div className="grid grid-cols-2 gap-12">
                {piezasDeCategoria.map(p => (
                  <div key={p.id} className="flex flex-col items-center text-center">
                    <img src={p.imagen_url} className="w-full aspect-[3/4] object-cover grayscale mb-6" alt={p.titulo} />
                    <h3 className="text-sm tracking-[0.2em] uppercase text-white mb-2">{p.titulo}</h3>
                    <p className="text-[10px] tracking-[0.1em] text-gray-400 mb-4">${p.precio} USD</p>
                    <p className="text-[10px] leading-relaxed text-gray-500 px-4">{p.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  );
}