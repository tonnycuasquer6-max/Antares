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
  const [userRole, setUserRole] = useState('cliente'); 
  
  const [activeView, setActiveView] = useState('home');
  const [activeCategory, setActiveCategory] = useState(''); 
  const [activeSubCategory, setActiveSubCategory] = useState('Todo');
  
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nuevaPieza, setNuevaPieza] = useState({ titulo: '', descripcion: '', precio: '', disponibilidad: '', subcategoria: '', imagen: null, imagen_url: '' });
  
  const [productos, setProductos] = useState<any[]>([]);
  
  const [categoriasDescarga, setCategoriasDescarga] = useState<string[]>([]);
  const [menuPdfExpandido, setMenuPdfExpandido] = useState<string | null>(null);

  // ESTADO PARA OCULTAR MENÚS
  const [hiddenItems, setHiddenItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('antares_hidden_menus');
    return saved ? JSON.parse(saved) : [];
  });

  const [carrito, setCarrito] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null);

  const fetchProductos = async () => {
    const { data, error } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (data) setProductos(data);
  };

  useEffect(() => {
    fetchProductos();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole('cliente');
      }
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
    setActiveSubCategory('Todo');
    setActiveView('categoria');
    setShowInlineForm(false);
    setEditandoId(null);
  };

  const handleCheckbox = (categoria) => {
    setCategoriasDescarga(prev => 
      prev.includes(categoria) ? prev.filter(c => c !== categoria) : [...prev, categoria]
    );
  };

  const toggleMenuVisibility = (itemName) => {
    const newHidden = hiddenItems.includes(itemName) 
      ? hiddenItems.filter(i => i !== itemName) 
      : [...hiddenItems, itemName];
    setHiddenItems(newHidden);
    localStorage.setItem('antares_hidden_menus', JSON.stringify(newHidden));
  };

  const agregarAlCarrito = (producto) => {
    if (carrito.some(item => item.id === producto.id)) {
      alert(`"${producto.titulo}" ya está en tu bolso.`);
      return;
    }
    setCarrito([...carrito, producto]);
    alert(`"${producto.titulo}" se añadió a tu bolso.`);
  };

  const toggleFavorito = (id) => {
    if (favoritos.includes(id)) {
      setFavoritos(favoritos.filter(favId => favId !== id));
    } else {
      setFavoritos([...favoritos, id]);
    }
  };

  const finalizarPedido = () => {
    alert('Esta función aún no está configurada, pronto podrás finalizar tu pedido de ANTARES.');
  };

  const prepararEdicion = (producto) => {
    setNuevaPieza({
      titulo: producto.titulo,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      disponibilidad: producto.disponibilidad || '',
      subcategoria: producto.subcategoria || '',
      imagen: null, 
      imagen_url: producto.imagen_url
    });
    setEditandoId(producto.id);
    setShowInlineForm(true);
  };

  const cerrarFormulario = () => {
    setShowInlineForm(false);
    setEditandoId(null);
    setNuevaPieza({ titulo: '', descripcion: '', precio: '', disponibilidad: '', subcategoria: '', imagen: null, imagen_url: '' });
  };

  const toggleVendido = async (id, estadoActual) => {
    const { data, error } = await supabase.from('productos').update({ vendido: !estadoActual }).eq('id', id).select();
    if (!error && data && data.length > 0) {
      setProductos(prev => prev.map(p => p.id === id ? data[0] : p));
    }
  };

  const handlePublicarLocal = async (e) => {
    e.preventDefault();
    if (!nuevaPieza.titulo || !nuevaPieza.precio) return alert('Ponle un título y precio.');
    
    let imageUrl = nuevaPieza.imagen_url || 'https://images.unsplash.com/photo-1610486241074-b778f69d2d0b?q=80&w=1000';

    if (nuevaPieza.imagen) {
      const fileExt = nuevaPieza.imagen.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('catalogo').upload(fileName, nuevaPieza.imagen);
      if (uploadError) return alert('Error subiendo la imagen.');
      const { data: { publicUrl } } = supabase.storage.from('catalogo').getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const payload = { 
      titulo: nuevaPieza.titulo, 
      descripcion: nuevaPieza.descripcion, 
      precio: Number(nuevaPieza.precio), 
      categoria: activeCategory, 
      disponibilidad: nuevaPieza.disponibilidad || 'Bajo Pedido',
      subcategoria: nuevaPieza.subcategoria || 'General',
      imagen_url: imageUrl 
    };

    if (editandoId) {
      const { data, error } = await supabase.from('productos').update(payload).eq('id', editandoId).select();
      if (data && data.length > 0) {
        setProductos(prev => prev.map(p => p.id === editandoId ? data[0] : p));
        cerrarFormulario();
      }
    } else {
      const { data, error } = await supabase.from('productos').insert([payload]).select();
      if (data && data.length > 0) {
        setProductos(prev => {
          if (prev.some(p => p.id === data[0].id)) return prev;
          return [data[0], ...prev];
        });
        cerrarFormulario();
      }
    }
  };

  const handleBorrarLocal = async (id) => {
    if(window.confirm('¿Seguro que deseas retirar esta pieza?')) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (!error) setProductos(prev => prev.filter(p => p.id !== id));
    }
  };

  if (!areSupabaseCredentialsSet) return null;

  const estructuraCatalogo = {
    'Atelier': ['Joyería Exclusiva', 'Prêt-à-Porter'],
    'Joyería': ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
    'Esenciales': ['Básicos de Joyería', 'Básicos de Vestuario'],
    'Prêt-à-Porter': ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones']
  };

  const subcategoriasJoyeria = ['Todo', 'Anillos', 'Pulseras', 'Collares', 'Aretes', 'Piercings'];

  const isAllSelected = (menuPrincipal) => estructuraCatalogo[menuPrincipal].every(sub => categoriasDescarga.includes(sub));

  const toggleAll = (menuPrincipal) => {
    const subs = estructuraCatalogo[menuPrincipal];
    if (isAllSelected(menuPrincipal)) {
      setCategoriasDescarga(prev => prev.filter(c => !subs.includes(c)));
    } else {
      const newSelections = [...categoriasDescarga];
      subs.forEach(sub => { if (!newSelections.includes(sub)) newSelections.push(sub); });
      setCategoriasDescarga(newSelections);
    }
  };

  const subtotalCarrito = carrito.reduce((sum, item) => sum + item.precio, 0);
  const totalCarrito = subtotalCarrito; 

  const puenteInvisibleMenuUsuario = "absolute top-full right-0 pt-4 hidden group-hover:block z-[100]";
  const puenteInvisibleMenuPrincipal = "absolute top-full left-1/2 -translate-x-1/2 pt-4 hidden group-hover:block z-[100]";
  
  const cristalOpacoSubmenuClass = "flex flex-col bg-black/60 backdrop-blur-2xl py-6 px-8 shadow-2xl rounded-sm"; 
  const menuUnderlineClass = "absolute bottom-0 left-1/2 w-0 h-px bg-white group-hover:w-full group-hover:left-0 transition-all duration-300";

  return (
    <div className="bg-black text-white min-h-screen font-serif flex flex-col relative print:bg-black print:text-white w-full overflow-x-hidden">
      
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media print { .screen-only { display: none !important; } .print-only { display: block !important; } }
      `}</style>

      <div className="screen-only flex flex-col flex-grow w-full">
        <header className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-[100] pt-3 px-4 md:px-0" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
          
          {user && activeView !== 'home' && (
            <button onClick={() => setActiveView('home')} className="absolute top-6 left-4 md:left-12 flex items-center gap-1.5 text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none z-50 text-[10px] md:text-xs tracking-[0.2em] uppercase">
              <span className="text-xs md:text-sm font-light relative -top-[1px]">&lt;</span> Volver
            </button>
          )}

          {user && (
            <div className="absolute top-6 right-4 md:right-12 flex items-center gap-4 md:gap-6 z-[100]">
              <button onClick={() => setActiveView('bag')} className="text-white hover:text-gray-400 transition-colors relative cursor-pointer bg-transparent border-none outline-none">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="20" width="20" className="md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                <span className="absolute -top-1 -right-2 bg-white text-black text-[8px] md:text-[9px] font-bold px-[4px] md:px-[5px] py-[1px] rounded-full">{carrito.length}</span>
              </button>

              <div className="group relative">
                <button className="text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none">
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="22" width="22" className="md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
                </button>
                <div className="absolute top-full right-0 pt-4 hidden group-hover:block z-[100]">
                  <div className={`${cristalOpacoSubmenuClass} min-w-[150px] md:min-w-[200px] text-right`}>
                    <button onClick={() => setActiveView('perfil')} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block">Mi Perfil</button>
                    <button onClick={() => setActiveView('pedidos')} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-5">Mis Pedidos</button>
                    <button onClick={() => setActiveView('deseos')} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-5 mb-5">Deseos ({favoritos.length})</button>
                    <hr className="border-white/10 my-4" />
                    <button onClick={handleLogout} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors text-right bg-transparent border-none p-0 cursor-pointer outline-none block">Cerrar Sesión</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <img src={LOGO_URL} alt="ANTARES" onClick={() => setActiveView('home')} className="h-16 md:h-32 w-auto mt-[10px] md:mt-[4px] z-[100] cursor-pointer" />

          {/* LÓGICA DE OCULTAR MENÚS APLICADA Y CORREGIDA AQUÍ */}
          {user && activeView === 'home' && (
            <nav className="w-full mt-4 mb-2 relative z-[100] px-2 md:px-6 pt-0 animate-fade-in">
              <ul className="flex flex-wrap justify-center gap-y-4 gap-x-6 md:gap-x-16 py-2 text-[10px] md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase border-none bg-transparent px-4 md:px-0">
                {Object.keys(estructuraCatalogo).map(menu => {
                  const isMenuHidden = hiddenItems.includes(menu);
                  // SI EL USUARIO NO ES ADMIN Y EL MENÚ ESTÁ OCULTO, DESAPARECE
                  if (userRole !== 'admin' && isMenuHidden) return null;

                  return (
                    <li key={menu} className="group relative cursor-pointer py-2 border-none bg-transparent">
                      <span className={`block relative transition-colors ${isMenuHidden ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                        {menu} {isMenuHidden && userRole === 'admin' && '(Oculto)'}
                        <div className={menuUnderlineClass}></div>
                      </span>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 hidden group-hover:block z-[100]">
                        <div className={`${cristalOpacoSubmenuClass} min-w-[180px] md:min-w-[220px] text-center`}>
                          {estructuraCatalogo[menu].map(sub => {
                            const isSubHidden = hiddenItems.includes(sub);
                            // SI EL USUARIO NO ES ADMIN Y EL SUBMENÚ ESTÁ OCULTO, DESAPARECE
                            if (userRole !== 'admin' && isSubHidden) return null;
                            
                            return (
                              <span key={sub} onClick={() => irACategoria(sub)} className={`cursor-pointer block mt-4 first:mt-0 text-[10px] md:text-xs transition-colors ${isSubHidden ? 'text-red-500' : 'text-gray-400 hover:text-gray-300'}`}>
                                {sub} {isSubHidden && userRole === 'admin' && '(Oculto)'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </li>
                  );
                })}
                
                {/* OBSEQUIOS OCULTAR */}
                {(!hiddenItems.includes('Obsequios') || userRole === 'admin') && (
                  <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                    <span className={`block relative transition-colors ${hiddenItems.includes('Obsequios') ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                      Obsequios {hiddenItems.includes('Obsequios') && userRole === 'admin' && '(Oculto)'}
                      <div className={menuUnderlineClass}></div>
                    </span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 hidden group-hover:block z-[100]">
                      <div className={`${cristalOpacoSubmenuClass} min-w-[150px] md:min-w-[180px] text-center max-h-64 overflow-y-auto`}>
                        {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(p => (
                          <span key={p} onClick={() => irACategoria(`Obsequios $${p}`)} className="text-gray-400 hover:text-gray-300 transition-colors cursor-pointer block mt-4 first:mt-0 text-[10px] md:text-xs">$ {p}.00 USD</span>
                        ))}
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </nav>
          )}

          {!user && (
            <div className="w-full flex justify-center mt-4 mb-4">
              <button onClick={() => setShowLoginModal(true)} className="text-white hover:text-gray-400 transition-colors p-0 bg-transparent border-none outline-none cursor-pointer z-50">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="30" width="30" className="md:w-[35px] md:h-[35px]"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            </div>
          )}
        </header>

        <main className="flex-grow flex flex-col items-center w-full px-4 md:px-0">
          
          {(!user || activeView === 'home') && (
            <div className="w-full animate-fade-in flex flex-col items-center pb-20">
               <section className="w-full text-center py-16 md:py-32 px-4">
                 <h2 className="text-4xl md:text-8xl font-bold tracking-[0.2em] uppercase text-white mb-6 md:mb-8 opacity-90 break-words">Elegancia Atemporal</h2>
                 <p className="text-gray-400 tracking-[0.2em] uppercase text-[10px] md:text-xs max-w-2xl mx-auto leading-loose px-4">
                   Bienvenido al Atelier de Antares. Un espacio dedicado a la sofisticación, el diseño atemporal y la exclusividad en cada detalle.
                 </p>
               </section>

               <section className="w-full max-w-5xl mx-auto py-12 md:py-20 px-4 md:px-6 text-center">
                 <h3 className="text-sm md:text-lg tracking-[0.3em] uppercase text-gray-500 mb-8 md:mb-10">Sobre Nosotros</h3>
                 <p className="text-white text-base md:text-2xl leading-relaxed max-w-3xl mx-auto font-light">
                   "Fundada con la visión de redefinir el lujo contemporáneo, Antares fusiona la artesanía tradicional con una estética vanguardista. Cada una de nuestras piezas cuenta una historia de meticulosa atención al detalle y pasión inquebrantable por la perfección."
                 </p>
               </section>

               <section className="w-full max-w-6xl mx-auto py-16 md:py-24 px-4 md:px-6">
                 <h3 className="text-sm md:text-lg tracking-[0.3em] uppercase text-gray-500 mb-10 md:mb-16 text-center">Nuestros Servicios</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 text-center">
                   <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Sastrería a Medida')} className="p-8 md:p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer">
                     <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Sastrería a Medida</h4>
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Creación de prendas exclusivas adaptadas a su silueta y estilo personal, utilizando únicamente los tejidos más nobles.</p>
                   </div>
                   <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Joyería Exclusiva')} className="p-8 md:p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer">
                     <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Joyería Personalizada</h4>
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Diseño y forja de piezas únicas y exclusivas, seleccionando gemas excepcionales para capturar momentos eternos.</p>
                   </div>
                   <div onClick={() => !user ? setShowLoginModal(true) : setActiveView('perfil')} className="p-8 md:p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer sm:col-span-2 md:col-span-1">
                     <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Asesoría de Imagen</h4>
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Curaduría de estilo y armario por nuestros expertos, elevando su presencia y confianza en cada ocasión especial.</p>
                   </div>
                 </div>
               </section>
            </div>
          )}

          {user && activeView === 'categoria' && (
            <section className="container mx-auto px-2 md:px-4 py-8 md:py-16 flex-grow animate-fade-in w-full max-w-6xl">
               <h2 className="text-xl md:text-2xl tracking-[0.3em] uppercase text-white mb-8 md:mb-12 text-center border-b border-white/10 pb-4 md:pb-6 break-words">{activeCategory}</h2>
               
               {['Acero Fino', 'Plata de Ley 925'].includes(activeCategory) && (
                 <ul className="flex flex-wrap justify-center gap-6 md:gap-12 mb-10 border-b border-white/10 pb-6">
                   {subcategoriasJoyeria.map(sub => (
                     <li 
                       key={sub}
                       onClick={() => setActiveSubCategory(sub)}
                       className={`text-[9px] md:text-[10px] tracking-[0.2em] uppercase cursor-pointer transition-colors ${activeSubCategory === sub ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                       {sub}
                     </li>
                   ))}
                 </ul>
               )}

               {userRole === 'admin' && !showInlineForm && (
                 <div onClick={() => { setEditandoId(null); setShowInlineForm(true); }} className="mb-8 md:mb-12 border border-dashed border-white/20 py-6 md:py-8 text-center hover:bg-zinc-900/40 transition-colors cursor-pointer mx-2 md:mx-0">
                   <span className="text-amber-500 tracking-[0.2em] text-[10px] md:text-xs uppercase">+ Añadir nueva pieza a {activeCategory}</span>
                 </div>
               )}

               {userRole === 'admin' && showInlineForm && (
                 <form onSubmit={handlePublicarLocal} className="mb-10 md:mb-16 bg-white/5 backdrop-blur-2xl p-6 md:p-10 shadow-2xl relative w-full rounded-sm">
                   <button type="button" onClick={cerrarFormulario} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer bg-transparent border-none text-2xl md:text-xl outline-none">×</button>
                   <h3 className="text-[10px] md:text-sm tracking-[0.2em] uppercase text-white mb-8 text-center">{editandoId ? 'EDITAR PIEZA' : 'DETALLES DE LA NUEVA PIEZA'}</h3>
                   
                   {editandoId && nuevaPieza.imagen_url && (
                     <div className="mb-8 flex justify-center">
                       <img src={nuevaPieza.imagen_url} alt="Vista previa" className="h-32 md:h-40 w-auto object-contain" />
                     </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                     <input type="text" value={nuevaPieza.titulo} onChange={e => setNuevaPieza({...nuevaPieza, titulo: e.target.value})} placeholder="TÍTULO DE LA OBRA" className="bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.1em] py-2 md:py-3 outline-none" required/>
                     <input type="number" value={nuevaPieza.precio} onChange={e => setNuevaPieza({...nuevaPieza, precio: e.target.value})} placeholder="PRECIO (USD)" className="bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.1em] py-2 md:py-3 outline-none" required/>
                     
                     <input type="text" value={nuevaPieza.disponibilidad} onChange={e => setNuevaPieza({...nuevaPieza, disponibilidad: e.target.value})} placeholder="DISPONIBILIDAD (EJ: 5 EN STOCK, O 'BAJO PEDIDO')" className="bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.1em] py-2 md:py-3 outline-none" />
                     
                     {['Acero Fino', 'Plata de Ley 925'].includes(activeCategory) && (
                       <select value={nuevaPieza.subcategoria} onChange={e => setNuevaPieza({...nuevaPieza, subcategoria: e.target.value})} className="bg-transparent border-b border-white/20 text-gray-400 text-[10px] md:text-xs tracking-[0.1em] py-2 md:py-3 outline-none">
                         <option value="" className="bg-black text-gray-500">TIPO DE JOYA (OPCIONAL)</option>
                         {subcategoriasJoyeria.filter(s => s !== 'Todo').map(sub => (
                           <option key={sub} value={sub} className="bg-black text-white">{sub}</option>
                         ))}
                       </select>
                     )}
                   </div>

                   <textarea value={nuevaPieza.descripcion} onChange={e => setNuevaPieza({...nuevaPieza, descripcion: e.target.value})} placeholder="DESCRIPCIÓN EDITORIAL..." rows="3" className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.1em] py-2 outline-none mb-8 md:mb-10 resize-none"></textarea>
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0">
                     <input type="file" onChange={e => setNuevaPieza({...nuevaPieza, imagen: e.target.files[0]})} className="text-[10px] md:text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] md:file:text-xs file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer w-full md:w-auto" />
                     <button type="submit" className="text-black text-[10px] font-bold tracking-[0.3em] uppercase px-8 py-4 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none border-none w-full md:w-auto">
                       {editandoId ? 'Guardar Cambios' : 'Publicar'}
                     </button>
                   </div>
                 </form>
               )}

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                 {productos.filter(p => p.categoria === activeCategory && (activeSubCategory === 'Todo' || p.subcategoria === activeSubCategory)).map(producto => (
                   <div key={producto.id} className="group relative bg-transparent rounded-sm flex flex-col p-0">
                     
                     <div 
                       className={`overflow-hidden aspect-[3/4] md:aspect-auto relative ${userRole === 'cliente' ? 'cursor-pointer' : ''}`}
                       onClick={() => { if(userRole === 'cliente') setProductoSeleccionado(producto); }}
                     >
                       <img src={producto.imagen_url} alt={producto.titulo} className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-all duration-700" />
                       
                       {producto.vendido && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                           <span className="text-white tracking-[0.4em] text-[10px] md:text-xs font-bold uppercase border border-white/50 px-4 md:px-6 py-2 md:py-3 bg-black/40">Agotado</span>
                         </div>
                       )}

                       {userRole === 'admin' && (
                         <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20">
                           <button onClick={(e) => { e.stopPropagation(); prepararEdicion(producto); }} className="bg-black/80 backdrop-blur-md p-2 text-white border border-white/10 rounded-full cursor-pointer hover:text-amber-500"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                           <button onClick={(e) => { e.stopPropagation(); handleBorrarLocal(producto.id); }} className="bg-black/80 backdrop-blur-md p-2 text-white border border-white/10 rounded-full cursor-pointer hover:text-red-500"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                         </div>
                       )}
                     </div>
                     
                     <div className="bg-black/40 backdrop-blur-xl rounded-b-sm p-4 md:p-6 flex flex-col flex-grow">
                       <h4 className="text-[10px] md:text-sm tracking-[0.2em] uppercase text-white mb-2 line-clamp-2 break-words uppercase">{producto.titulo}</h4>
                       <span className="text-[10px] md:text-sm tracking-[0.1em] text-white font-light whitespace-nowrap mb-1 block">${producto.precio} USD</span>
                       
                       <p className="text-[8px] md:text-[9px] tracking-[0.2em] text-gray-400 mb-4 uppercase">{producto.disponibilidad ? `Disponibilidad: ${producto.disponibilidad}` : 'Bajo Pedido'}</p>
                       
                       <p className="text-[9px] md:text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-6 break-words uppercase">{producto.descripcion}</p>

                       {userRole === 'cliente' && !producto.vendido && (
                         <div className="flex gap-2 mt-auto">
                            <button onClick={(e) => { e.stopPropagation(); agregarAlCarrito(producto); }} className="flex-grow py-3 text-[8px] md:text-[9px] font-bold tracking-[0.3em] uppercase bg-white text-black hover:bg-gray-300 transition-colors cursor-pointer border-none outline-none rounded-sm">Comprar</button>
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }} className="px-4 md:px-5 py-2 md:py-3 border border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer text-sm md:text-lg flex items-center justify-center bg-transparent outline-none rounded-sm">{favoritos.includes(producto.id) ? '♥' : '♡'}</button>
                         </div>
                       )}

                       {userRole === 'admin' && (
                         <button onClick={(e) => { e.stopPropagation(); toggleVendido(producto.id, producto.vendido); }} className={`w-full py-2.5 mt-auto text-[8px] md:text-[9px] font-bold tracking-[0.3em] uppercase transition-colors cursor-pointer border outline-none rounded-sm ${producto.vendido ? 'bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-white' : 'bg-white text-black border-white hover:bg-gray-300'}`}>{producto.vendido ? 'Desmarcar Venta' : 'Marcar como Vendida'}</button>
                       )}
                     </div>
                   </div>
                 ))}
                 
                 {productos.filter(p => p.categoria === activeCategory && (activeSubCategory === 'Todo' || p.subcategoria === activeSubCategory)).length === 0 && (
                    <p className="text-gray-500 tracking-[0.2em] uppercase text-[10px] md:text-xs col-span-full text-center py-10">No hay piezas en esta categoría aún.</p>
                 )}
               </div>
            </section>
          )}

          {productoSeleccionado && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 screen-only animate-fade-in"
              onClick={() => setProductoSeleccionado(null)}
            >
              <div 
                className="w-full max-w-4xl flex flex-col md:flex-row relative shadow-2xl overflow-hidden rounded-sm items-stretch bg-transparent"
                onClick={e => e.stopPropagation()} 
              >
                <button 
                  onClick={() => setProductoSeleccionado(null)} 
                  className="absolute top-4 right-4 text-white hover:text-gray-300 z-[210] text-3xl cursor-pointer bg-transparent border-none outline-none"
                >
                  ×
                </button>
                
                <div className="w-full md:w-1/2 p-0 m-0 bg-[#0a0a0a] flex">
                  <img 
                    src={productoSeleccionado.imagen_url} 
                    alt={productoSeleccionado.titulo} 
                    className="w-full h-full object-cover block m-0 p-0" 
                  />
                </div>
                
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white/10 backdrop-blur-3xl border-l border-white/5 m-0">
                  <h2 className="text-2xl md:text-4xl tracking-[0.2em] uppercase text-white mb-2 drop-shadow-md">
                    {productoSeleccionado.titulo}
                  </h2>
                  <p className="text-xl tracking-[0.1em] text-white font-light mb-8 drop-shadow-md">
                    ${productoSeleccionado.precio} USD
                  </p>
                  
                  <p className="text-[10px] tracking-[0.2em] text-gray-300 mb-8 uppercase drop-shadow-md">
                    {productoSeleccionado.disponibilidad ? `Disponibilidad: ${productoSeleccionado.disponibilidad}` : 'Bajo Pedido'}
                  </p>
                  
                  <div className="w-12 h-px bg-white/30 mb-8"></div>
                  
                  <p className="text-[10px] md:text-xs text-gray-200 leading-loose mb-12 uppercase tracking-[0.1em] drop-shadow-sm break-words">
                    {productoSeleccionado.descripcion}
                  </p>
                  
                  {!productoSeleccionado.vendido ? (
                    <div className="flex gap-4 mt-auto">
                      <button 
                        onClick={() => { agregarAlCarrito(productoSeleccionado); setProductoSeleccionado(null); }} 
                        className="flex-grow bg-white text-black text-[10px] font-bold tracking-[0.3em] uppercase py-4 hover:bg-gray-200 transition-colors cursor-pointer border-none outline-none"
                      >
                        Añadir al Bolso
                      </button>
                      <button 
                        onClick={() => toggleFavorito(productoSeleccionado.id)} 
                        className="border border-white/20 px-6 text-white hover:bg-white/10 transition-colors cursor-pointer text-xl bg-transparent outline-none flex items-center justify-center"
                      >
                        {favoritos.includes(productoSeleccionado.id) ? '♥' : '♡'}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-auto py-4 text-center border border-white/20 bg-black/20">
                       <span className="text-gray-300 tracking-[0.4em] text-[10px] font-bold uppercase">Pieza Agotada</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {userRole === 'cliente' && activeView === 'bag' && (
            <section className="container mx-auto px-2 md:px-4 py-8 md:py-16 flex-grow animate-fade-in w-full max-w-4xl">
              <h2 className="text-xl md:text-2xl tracking-[0.3em] uppercase text-white mb-12 text-center border-b border-white/10 pb-4 md:pb-6">Su Selección</h2>
              
              {carrito.length === 0 ? (
                <p className="text-gray-500 tracking-[0.2em] uppercase text-[10px] md:text-xs text-center py-10">Su bolso está vacío en este momento.</p>
              ) : (
                <div className="bg-white/5 backdrop-blur-xl p-4 md:p-10 shadow-2xl rounded-sm w-full overflow-x-hidden">
                  <h3 className="text-[8px] md:text-[10px] tracking-[0.4em] uppercase text-gray-400 mb-6 md:mb-10 text-center">Detalle de su Pedido</h3>
                  
                  {carrito.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 py-4 md:py-6 border-b border-white/5 relative">
                      <button onClick={() => setCarrito(carrito.filter(p => p.id !== item.id))} className="absolute top-2 right-0 text-gray-500 hover:text-red-500 text-xl cursor-pointer bg-transparent border-none outline-none sm:pl-4">×</button>
                      <img src={item.imagen_url} alt={item.titulo} className="w-24 h-24 object-contain border border-white/10" />
                      <div className="flex-grow text-center sm:text-left w-full sm:w-auto">
                        <h4 className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-white mb-1 line-clamp-2 break-words uppercase">{item.titulo}</h4>
                        <p className="text-[8px] md:text-[10px] tracking-[0.1em] text-gray-500 uppercase line-clamp-1">{item.categoria}</p>
                      </div>
                      <span className="text-xs md:text-sm tracking-[0.1em] text-white whitespace-nowrap">${item.precio} USD</span>
                    </div>
                  ))}
                  
                  <div className="mt-8 md:mt-12 flex flex-col items-end gap-2 md:gap-3 text-[10px] md:text-xs tracking-[0.1em] uppercase">
                    <p className="text-gray-400 w-full sm:w-auto flex justify-between sm:justify-end">Subtotal: <span className="text-white ml-0 sm:ml-6">$ {subtotalCarrito}.00 USD</span></p>
                    <p className="text-gray-400 w-full sm:w-auto flex justify-between sm:justify-end">Envío: <span className="text-white ml-0 sm:ml-6">Gratis</span></p>
                    <div className="w-full sm:w-64 h-px bg-white/10 my-2 md:my-4"></div>
                    <p className="text-xs md:text-sm text-white font-light w-full sm:w-auto flex justify-between sm:justify-end">Total: <span className="font-bold ml-0 sm:ml-6">$ {totalCarrito}.00 USD</span></p>
                  </div>
                  
                  <div className="flex justify-center mt-10 md:mt-16">
                    <button onClick={finalizarPedido} className="text-black text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase px-8 md:px-10 py-4 md:py-5 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none border-none rounded-sm w-full sm:w-auto">
                      Finalizar Pedido
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {userRole === 'cliente' && activeView === 'deseos' && (
            <section className="container mx-auto px-2 md:px-4 py-8 md:py-16 flex-grow animate-fade-in w-full max-w-6xl">
              <h2 className="text-xl md:text-2xl tracking-[0.3em] uppercase text-white mb-8 md:mb-12 text-center border-b border-white/10 pb-4 md:pb-6">Lista de Deseos</h2>
              
              {favoritos.length === 0 ? (
                <p className="text-gray-500 tracking-[0.2em] uppercase text-[10px] md:text-xs text-center py-10">No hay piezas en su lista de deseos aún.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                  {productos.filter(p => favoritos.includes(p.id)).map(producto => (
                    <div key={producto.id} className="group relative bg-transparent rounded-sm flex flex-col p-0">
                      <div className="overflow-hidden aspect-[3/4] md:aspect-auto relative cursor-pointer" onClick={() => setProductoSeleccionado(producto)}>
                        <img src={producto.imagen_url} alt={producto.titulo} className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-all duration-700" />
                        {producto.vendido && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <span className="text-white tracking-[0.4em] text-[10px] md:text-xs font-bold uppercase border border-white/50 px-4 md:px-6 py-2 md:py-3 bg-black/40">Agotado</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-black/40 backdrop-blur-xl rounded-b-sm p-4 md:p-6 flex flex-col flex-grow">
                        <h4 className="text-[10px] md:text-sm tracking-[0.2em] uppercase text-white mb-2 line-clamp-2 break-words uppercase">{producto.titulo}</h4>
                        <span className="text-[10px] md:text-sm tracking-[0.1em] text-white font-light whitespace-nowrap mb-3 md:mb-4 block">${producto.precio} USD</span>
                        <p className="text-[9px] md:text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-6 break-words uppercase">{producto.descripcion}</p>
                        <div className="flex gap-2 mt-auto">
                          {!producto.vendido && (
                            <button onClick={(e) => { e.stopPropagation(); agregarAlCarrito(producto); }} className="flex-grow py-2.5 md:py-3 text-[8px] md:text-[9px] font-bold tracking-[0.3em] uppercase bg-white text-black hover:bg-gray-300 transition-colors cursor-pointer border-none outline-none rounded-sm">
                              Comprar
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }} className="px-4 md:px-5 py-2 md:py-3 border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer text-sm md:text-lg flex items-center justify-center bg-transparent outline-none rounded-sm" title="Quitar de deseos">
                            ♥
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {userRole === 'cliente' && activeView === 'pedidos' && (
            <section className="container mx-auto px-2 md:px-4 py-8 md:py-16 flex-grow animate-fade-in w-full max-w-4xl">
              <h2 className="text-xl md:text-2xl tracking-[0.3em] uppercase text-white mb-8 md:mb-12 text-center border-b border-white/10 pb-4 md:pb-6">Mis Pedidos</h2>
              
              <div className="bg-white/5 backdrop-blur-xl p-6 md:p-10 shadow-2xl rounded-sm">
                <p className="text-gray-400 tracking-[0.2em] uppercase text-[10px] md:text-xs text-center py-6 md:py-10">Aún no hay un historial de pedidos en su cuenta.</p>
              </div>
            </section>
          )}

          {user && activeView === 'perfil' && (
            <section className="w-full max-w-3xl mx-auto px-2 md:px-4 py-8 md:py-16 flex-grow animate-fade-in">
              <h2 className="text-xl md:text-2xl tracking-[0.3em] uppercase text-white mb-8 md:mb-10 text-center pb-2 md:pb-4">Mi Perfil</h2>
              <div className="bg-white/5 backdrop-blur-xl p-6 md:p-10 rounded-sm shadow-2xl border-none relative">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                  <div>
                    <label className="block text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-1 md:mb-2">Nombres</label>
                    <p className="text-white text-base md:text-lg truncate uppercase">{user.user_metadata?.first_name || 'Tonny'}</p>
                  </div>
                  <div className="overflow-hidden">
                    <label className="block text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-1 md:mb-2">Email</label>
                    <p className="text-white text-sm md:text-lg truncate" title={user.email}>{user.email}</p>
                  </div>
                </div>

                {/* MENÚ DE ADMINISTRACIÓN DE VISIBILIDAD (SÓLO ADMIN) */}
                {userRole === 'admin' && (
                  <div className="mb-4 pt-6 md:pt-8 border-t border-white/10 mt-6 md:mt-8">
                    <label className="block text-xs md:text-sm tracking-[0.3em] uppercase text-white mb-4 md:mb-6 text-center text-amber-500">Configuración de Menús</label>
                    <p className="text-gray-400 text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-center mb-6 md:mb-8">Oculta o muestra secciones en la página principal.</p>
                    
                    <div className="flex flex-col gap-2 w-full max-w-md mx-auto mb-10">
                      {Object.keys(estructuraCatalogo).concat('Obsequios').map(menu => (
                        <div key={menu} className="bg-black/40 p-3 rounded-sm">
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] tracking-[0.2em] uppercase ${hiddenItems.includes(menu) ? 'text-red-500 line-through' : 'text-white'}`}>{menu}</span>
                            <button onClick={() => toggleMenuVisibility(menu)} className="text-[8px] uppercase tracking-[0.2em] bg-transparent border border-white/20 text-gray-300 hover:text-white px-3 py-1 cursor-pointer">
                              {hiddenItems.includes(menu) ? 'MOSTRAR' : 'OCULTAR'}
                            </button>
                          </div>
                          
                          {estructuraCatalogo[menu] && estructuraCatalogo[menu].map(sub => (
                            <div key={sub} className="flex justify-between items-center pl-6 mt-2 pt-2 border-t border-white/5">
                              <span className={`text-[9px] tracking-[0.1em] uppercase ${hiddenItems.includes(sub) ? 'text-red-400 line-through' : 'text-gray-400'}`}>{sub}</span>
                              <button onClick={() => toggleMenuVisibility(sub)} className="text-[7px] uppercase tracking-[0.2em] bg-transparent border border-white/10 text-gray-500 hover:text-white px-2 py-1 cursor-pointer">
                                {hiddenItems.includes(sub) ? 'MOSTRAR' : 'OCULTAR'}
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GENERACIÓN DE PDF (SÓLO ADMIN) */}
                {userRole === 'admin' && (
                  <div className="mb-4 pt-6 md:pt-8 border-t border-white/10 mt-6 md:mt-8">
                    <label className="block text-xs md:text-sm tracking-[0.3em] uppercase text-white mb-4 md:mb-6 text-center">Catálogo PDF</label>
                    <p className="text-gray-400 text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-center mb-6 md:mb-8">Seleccione las colecciones que desea incluir en su PDF interactivo.</p>
                    <div className="flex flex-col gap-3 md:gap-4 mb-8 md:mb-10 w-full max-w-md mx-auto">
                      {Object.entries(estructuraCatalogo).map(([menuPrincipal, submenus]) => (
                        <div key={menuPrincipal} className="border-b border-white/10 pb-3 md:pb-4">
                          <div className="w-full flex justify-between items-center bg-transparent border-none outline-none group cursor-pointer" onClick={() => setMenuPdfExpandido(menuPdfExpandido === menuPrincipal ? null : menuPrincipal)}>
                            <button className="text-gray-300 group-hover:text-white text-[9px] md:text-[10px] tracking-[0.3em] uppercase bg-transparent border-none outline-none cursor-pointer transition-colors text-left flex-grow">
                              {menuPrincipal}
                            </button>
                            <div className={`w-3.5 h-3.5 border transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer ${isAllSelected(menuPrincipal) ? 'bg-white border-white' : 'border-gray-500'}`} onClick={(e) => { e.stopPropagation(); toggleAll(menuPrincipal); }}>
                              {isAllSelected(menuPrincipal) && <div className="w-2 h-2 bg-black"></div>}
                            </div>
                          </div>
                          {menuPdfExpandido === menuPrincipal && (
                            <div className="pt-4 md:pt-6 flex flex-col gap-3 md:gap-4 pl-2 animate-fade-in">
                              {submenus.map(cat => (
                                <label key={cat} className="flex items-center gap-3 md:gap-4 cursor-pointer group w-full">
                                  <div className={`w-3.5 h-3.5 border transition-colors flex items-center justify-center flex-shrink-0 ${categoriasDescarga.includes(cat) ? 'bg-white border-white' : 'border-gray-500 group-hover:border-white'}`}>
                                    {categoriasDescarga.includes(cat) && <div className="w-2 h-2 bg-black"></div>}
                                  </div>
                                  <input type="checkbox" className="hidden" onChange={() => handleCheckbox(cat)} checked={categoriasDescarga.includes(cat)} />
                                  <span className="text-gray-400 group-hover:text-white text-[8px] md:text-[10px] tracking-[0.2em] uppercase transition-colors">{cat}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center">
                      <button onClick={() => window.print()} className="text-black text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase px-6 md:px-8 py-3 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none border-none rounded-sm flex items-center justify-center gap-2">
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="14" width="14" className="md:w-4 md:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Generar Catálogo PDF
                      </button>
                    </div>
                  </div>
                )}
                
                {/* MENSAJE PARA EL CLIENTE */}
                {userRole === 'cliente' && (
                  <div className="mb-4 pt-6 md:pt-8 border-t border-white/10 mt-6 md:mt-8">
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.2em] uppercase text-center py-4">Bienvenido a su perfil exclusivo de Antares.</p>
                  </div>
                )}

              </div>
            </section>
          )}

        </main>
        
        <footer className="bg-black py-8 md:py-12 text-center text-gray-600 text-[7px] md:text-[9px] tracking-[0.5em] uppercase border-none mt-auto px-4 screen-only w-full">
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
                    <div key={p.id} className="flex flex-col items-center text-center relative border border-white/5 p-4 rounded-sm">
                      <div className="relative w-full mb-6 flex items-center justify-center h-80 bg-zinc-900/10">
                        <img src={p.imagen_url} className="w-full h-full object-contain" alt={p.titulo} />
                        {p.vendido && (
                          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                            <span className="text-white tracking-[0.4em] text-[10px] font-bold uppercase border border-white/50 px-4 py-2 bg-black/60">Agotado</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-sm tracking-[0.2em] uppercase text-white mb-2 break-words uppercase">{p.titulo}</h3>
                      <p className="text-[10px] tracking-[0.1em] text-gray-400 mb-4">${p.precio} USD</p>
                      <p className="text-[10px] leading-relaxed text-gray-500 px-4 line-clamp-2 uppercase">{p.descripcion}</p>
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