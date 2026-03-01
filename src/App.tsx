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
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nuevaPieza, setNuevaPieza] = useState({ titulo: '', descripcion: '', precio: '', imagen: null, imagen_url: '' });
  
  const [productos, setProductos] = useState<any[]>([]);
  
  const [categoriasDescarga, setCategoriasDescarga] = useState<string[]>([]);
  const [menuPdfExpandido, setMenuPdfExpandido] = useState<string | null>(null);

  const fetchProductos = async () => {
    const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (data) setProductos(data);
  };

  useEffect(() => {
    fetchProductos();
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
    setEditandoId(null);
  };

  const handleCheckbox = (categoria) => {
    setCategoriasDescarga(prev => 
      prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]
    );
  };

  const prepararEdicion = (producto) => {
    setNuevaPieza({
      titulo: producto.titulo,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      imagen: null, 
      imagen_url: producto.imagen_url
    });
    setEditandoId(producto.id);
    setShowInlineForm(true);
  };

  const cerrarFormulario = () => {
    setShowInlineForm(false);
    setEditandoId(null);
    setNuevaPieza({ titulo: '', descripcion: '', precio: '', imagen: null, imagen_url: '' });
  };

  const toggleVendido = async (id, estadoActual) => {
    const { data, error } = await supabase
      .from('productos')
      .update({ vendido: !estadoActual })
      .eq('id', id)
      .select();

    if (error) {
      alert("Error al actualizar. ¿Aseguraste de crear la columna 'vendido' en tu tabla de Supabase como te indiqué?");
      console.error(error);
    } else if (data) {
      setProductos(productos.map(p => p.id === id ? { ...p, vendido: !estadoActual } : p));
    }
  };

  const handlePublicarLocal = async (e) => {
    e.preventDefault();
    if (!nuevaPieza.titulo || !nuevaPieza.precio) return alert('Ponle un título y precio a la pieza.');
    
    let imageUrl = nuevaPieza.imagen_url || 'https://images.unsplash.com/photo-1610486241074-b778f69d2d0b?q=80&w=1000';

    if (nuevaPieza.imagen) {
      const fileExt = nuevaPieza.imagen.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('catalogo') 
        .upload(fileName, nuevaPieza.imagen);

      if (uploadError) {
        alert('Error subiendo la imagen a Supabase.');
        console.error(uploadError);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('catalogo').getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const payload = {
      titulo: nuevaPieza.titulo,
      descripcion: nuevaPieza.descripcion,
      precio: Number(nuevaPieza.precio),
      categoria: activeCategory,
      imagen_url: imageUrl
    };

    if (editandoId) {
      // Actualizar producto existente
      const { data, error } = await supabase.from('productos').update(payload).eq('id', editandoId).select();
      if (error) {
        alert('Error al actualizar en la base de datos.');
        console.error(error);
      } else if (data) {
        setProductos(productos.map(p => p.id === editandoId ? data[0] : p));
        cerrarFormulario();
      }
    } else {
      // Insertar producto nuevo
      const { data, error } = await supabase.from('productos').insert([payload]).select();
      if (error) {
        alert('Error al guardar en la base de datos.');
        console.error(error);
      } else if (data) {
        setProductos([data[0], ...productos]);
        cerrarFormulario();
      }
    }
  };

  const handleBorrarLocal = async (id) => {
    if(window.confirm('¿Seguro que deseas retirar esta pieza del catálogo?')) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (!error) {
        setProductos(productos.filter(p => p.id !== id));
      } else {
        alert('Error al borrar de Supabase.');
        console.error(error);
      }
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

  const estructuraCatalogo = {
    'Atelier': ['Joyería Exclusiva', 'Prêt-à-Porter'],
    'Joyería': ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
    'Esenciales': ['Básicos de Joyería', 'Básicos de Vestuario'],
    'Prêt-à-Porter': ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones']
  };

  const isAllSelected = (menuPrincipal) => {
    return estructuraCatalogo[menuPrincipal].every(sub => categoriasDescarga.includes(sub));
  };

  const toggleAll = (menuPrincipal) => {
    const subs = estructuraCatalogo[menuPrincipal];
    if (isAllSelected(menuPrincipal)) {
      setCategoriasDescarga(prev => prev.filter(c => !subs.includes(c)));
    } else {
      const newSelections = [...categoriasDescarga];
      subs.forEach(sub => {
        if (!newSelections.includes(sub)) newSelections.push(sub);
      });
      setCategoriasDescarga(newSelections);
    }
  };

  const puenteInvisibleMenuUsuario = "absolute top-full right-0 pt-4 hidden group-hover:block z-50";
  const puenteInvisibleMenuPrincipal = "absolute top-full left-1/2 -translate-x-1/2 pt-4 hidden group-hover:block z-50";
  const cristalOpacoSubmenuClass = "flex flex-col bg-black/95 backdrop-blur-md py-6 px-8 shadow-2xl rounded-sm"; 
  const menuUnderlineClass = "absolute bottom-0 left-1/2 w-0 h-px bg-white group-hover:w-full group-hover:left-0 transition-all duration-300";

  return (
    <div className="bg-black text-white min-h-screen font-serif flex flex-col relative print:bg-black print:text-white">
      
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
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

          {user && activeView === 'categoria' && (
            <section className="container mx-auto px-4 py-16 flex-grow animate-fade-in w-full max-w-6xl">
               <h2 className="text-2xl tracking-[0.3em] uppercase text-white mb-12 text-center border-b border-white/10 pb-6">{activeCategory}</h2>
               
               {userRole === 'admin' && !showInlineForm && (
                 <div onClick={() => { setEditandoId(null); setShowInlineForm(true); }} className="mb-12 border border-dashed border-white/20 py-8 text-center hover:bg-zinc-900/40 transition-colors cursor-pointer">
                   <span className="text-amber-500 tracking-[0.2em] text-xs uppercase">+ Añadir nueva pieza a {activeCategory}</span>
                 </div>
               )}

               {userRole === 'admin' && showInlineForm && (
                 <form onSubmit={handlePublicarLocal} className="mb-16 bg-zinc-900/30 p-8 border border-white/5 relative">
                   <button type="button" onClick={cerrarFormulario} className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer bg-transparent border-none text-xl">×</button>
                   <h3 className="text-sm tracking-[0.2em] uppercase text-white mb-6">{editandoId ? 'EDITAR PIEZA' : 'DETALLES DE LA NUEVA PIEZA'}</h3>
                   
                   {editandoId && nuevaPieza.imagen_url && (
                     <div className="mb-6 flex justify-center">
                       <img src={nuevaPieza.imagen_url} alt="Vista previa" className="h-32 w-auto object-cover border border-white/20" />
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     <input type="text" value={nuevaPieza.titulo} onChange={e => setNuevaPieza({...nuevaPieza, titulo: e.target.value})} placeholder="TÍTULO DE LA OBRA" className="bg-transparent border-b border-white/20 text-white text-xs tracking-[0.1em] py-2 outline-none" required/>
                     <input type="number" value={nuevaPieza.precio} onChange={e => setNuevaPieza({...nuevaPieza, precio: e.target.value})} placeholder="PRECIO (USD)" className="bg-transparent border-b border-white/20 text-white text-xs tracking-[0.1em] py-2 outline-none" required/>
                   </div>
                   <textarea value={nuevaPieza.descripcion} onChange={e => setNuevaPieza({...nuevaPieza, descripcion: e.target.value})} placeholder="DESCRIPCIÓN EDITORIAL..." rows="2" className="w-full bg-transparent border-b border-white/20 text-white text-xs tracking-[0.1em] py-2 outline-none mb-6 resize-none"></textarea>
                   <div className="flex items-center justify-between">
                     <input type="file" onChange={e => setNuevaPieza({...nuevaPieza, imagen: e.target.files[0]})} className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" />
                     <button type="submit" className="text-black text-[10px] font-bold tracking-[0.3em] uppercase px-8 py-3 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none rounded-sm border-none">
                       {editandoId ? 'Guardar Cambios' : 'Publicar'}
                     </button>
                   </div>
                 </form>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {productos.filter(p => p.categoria === activeCategory).map(producto => (
                   <div key={producto.id} className="group relative">
                     <div className="overflow-hidden aspect-[3/4] bg-zinc-900 mb-4 relative cursor-pointer">
                       <img src={producto.imagen_url} alt={producto.titulo} className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                       
                       {/* OVERLAY DE VENTA (ELEGANTE) */}
                       {producto.vendido && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                           <span className="text-white tracking-[0.4em] text-[10px] md:text-xs font-bold uppercase border border-white/50 px-6 py-3 bg-black/40">Adquirido</span>
                         </div>
                       )}

                       {/* BOTONES ADMINISTRADOR (LÁPIZ Y BASURA) */}
                       {userRole === 'admin' && (
                         <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                           <button onClick={(e) => { e.stopPropagation(); prepararEdicion(producto); }} className="bg-black/80 backdrop-blur-md p-2 text-white hover:text-amber-500 border border-white/10 cursor-pointer text-[10px]" title="Editar">
                             <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); handleBorrarLocal(producto.id); }} className="bg-black/80 backdrop-blur-md p-2 text-white hover:text-red-500 border border-white/10 cursor-pointer text-[10px]" title="Borrar">
                             <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                           </button>
                         </div>
                       )}
                     </div>
                     
                     <h4 className="text-sm tracking-[0.2em] uppercase text-white mb-1">{producto.titulo}</h4>
                     <p className="text-xs tracking-[0.1em] text-gray-400 mb-2">${producto.precio} USD</p>
                     
                     {/* DESCRIPCION CON ACORTAMIENTO (...) SI ES MUY LARGA */}
                     <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed mb-4">{producto.descripcion}</p>

                     {/* BOTON MARCAR COMO VENDIDA */}
                     {userRole === 'admin' && (
                       <button
                         onClick={(e) => { e.stopPropagation(); toggleVendido(producto.id, producto.vendido); }}
                         className={`w-full py-2.5 mt-2 text-[9px] font-bold tracking-[0.3em] uppercase transition-colors cursor-pointer border ${producto.vendido ? 'bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-white' : 'bg-white text-black border-white hover:bg-gray-300'}`}
                       >
                         {producto.vendido ? 'Desmarcar Venta' : 'Marcar como Vendida'}
                       </button>
                     )}
                   </div>
                 ))}
                 
                 {productos.filter(p => p.categoria === activeCategory).length === 0 && (
                    <p className="text-gray-500 tracking-[0.2em] uppercase text-xs col-span-full text-center py-10">No hay piezas en esta colección aún.</p>
                 )}
               </div>
            </section>
          )}

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
                  
                  <div className="flex flex-col gap-4 mb-10 w-full max-w-md mx-auto">
                    {Object.entries(estructuraCatalogo).map(([menuPrincipal, submenus]) => (
                      <div key={menuPrincipal} className="border-b border-white/10 pb-4">
                        <div className="w-full flex justify-between items-center bg-transparent border-none outline-none group cursor-pointer">
                          <button 
                            onClick={() => setMenuPdfExpandido(menuPdfExpandido === menuPrincipal ? null : menuPrincipal)}
                            className="text-gray-400 group-hover:text-white text-[10px] tracking-[0.3em] uppercase bg-transparent border-none outline-none cursor-pointer transition-colors text-left flex-grow"
                          >
                            {menuPrincipal}
                          </button>
                          
                          <div 
                            className={`w-3.5 h-3.5 border transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer ${isAllSelected(menuPrincipal) ? 'bg-white border-white' : 'border-gray-500'}`}
                            onClick={() => toggleAll(menuPrincipal)}
                          >
                            {isAllSelected(menuPrincipal) && <div className="w-2 h-2 bg-black"></div>}
                          </div>
                        </div>
                        
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
                      onClick={() => window.print()} 
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

      <div className="hidden print-only bg-black text-white w-full min-h-screen font-serif pb-20">
        
        <header className="w-full flex flex-col items-center bg-cover bg-center mt-0 relative pt-10 pb-6 mb-16 border-b border-white/10" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
          <img src={LOGO_URL} alt="ANTARES" className={`h-24 w-auto object-contain z-10`} />
        </header>

        {(categoriasDescarga.length > 0 ? categoriasDescarga : Object.values(estructuraCatalogo).flat()).map(cat => {
          const piezasDeCategoria = productos.filter(p => p.categoria === cat);
          const parentMenu = Object.entries(estructuraCatalogo).find(([_, subs]) => subs.includes(cat))?.[0];

          return (
            <div key={cat} className="mb-24 page-break-after px-10">
              
              <h3 className="text-xl tracking-[0.3em] uppercase text-gray-500 mb-2 text-center">{parentMenu}</h3>
              <h2 className="text-4xl tracking-[0.2em] uppercase text-white mb-16 text-center">{cat}</h2>
              
              {piezasDeCategoria.length > 0 ? (
                <div className="grid grid-cols-2 gap-12">
                  {piezasDeCategoria.map(p => (
                    <div key={p.id} className="flex flex-col items-center text-center relative">
                      <div className="relative w-full mb-6">
                        <img src={p.imagen_url} className="w-full aspect-[3/4] object-cover grayscale" alt={p.titulo} />
                        {/* ETIQUETA ADQUIRIDO EN EL PDF */}
                        {p.vendido && (
                          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                            <span className="text-white tracking-[0.4em] text-[10px] font-bold uppercase border border-white/50 px-4 py-2 bg-black/60">Adquirido</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm tracking-[0.2em] uppercase text-white mb-2">{p.titulo}</h3>
                      <p className="text-[10px] tracking-[0.1em] text-gray-400 mb-4">${p.precio} USD</p>
                      <p className="text-[10px] leading-relaxed text-gray-500 px-4 line-clamp-2">{p.descripcion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center tracking-[0.2em] text-[10px] uppercase">Colección en desarrollo</p>
              )}
            </div>
          )
        })}
      </div>

    </div>
  );
}