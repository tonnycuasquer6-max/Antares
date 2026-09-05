import { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { supabase } from '../../services/supabase';
import type { Product, NuevaPieza } from '../../types';

interface ProductGalleryProps {
  category: string;
  userRole: string;
}

export default function ProductGallery({ category, userRole }: ProductGalleryProps) {
  const { 
    productos, 
    favoritos, 
    subcategoriasJoyeria, 
    tallasDisponibles, 
    parseTallasseguro,
    setProductos 
  } = useShop();

  const [activeSubCategory, setActiveSubCategory] = useState<string>('Todo');
  const [filtroColor, setFiltroColor] = useState<string>('Todo');
  const [filtroTalla, setFiltroTalla] = useState<string>('Todo');
  const [ordenPrecio, setOrdenPrecio] = useState<string>('');
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);
  
  // Admin Form State
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | number | null>(null);
  const [openFormSelect, setOpenFormSelect] = useState<string | null>(null);
  const [nuevaPieza, setNuevaPieza] = useState<NuevaPieza>({ 
    titulo: '', descripcion: '', costo: '', precio: '', disponibilidad: '', subcategoria: '', tallas: {}, color: '', imagen: null, imagen_url: '' 
  });

  // Filtros
  const productosMostrar = useMemo(() => {
    if (category === 'deseos') {
      return productos.filter(p => favoritos.includes(p.id));
    }

    let filtrados = productos.filter(p => p.categoria === category && (activeSubCategory === 'Todo' || p.subcategoria === activeSubCategory));

    if (category === 'Acero Fino') {
      if (filtroColor !== 'Todo') {
        filtrados = filtrados.filter(p => p.color === filtroColor);
      }
      if (filtroTalla !== 'Todo') {
        filtrados = filtrados.filter(p => {
          if (p.subcategoria !== 'Anillos') return false;
          const tallasObj = parseTallasseguro(p.tallas);
          return parseInt(String(tallasObj[filtroTalla] || 0)) > 0;
        });
      }
      if (ordenPrecio === 'Asc') {
        filtrados = filtrados.sort((a, b) => a.precio - b.precio);
      } else if (ordenPrecio === 'Desc') {
        filtrados = filtrados.sort((a, b) => b.precio - a.precio);
      }
    }
    return filtrados;
  }, [productos, category, activeSubCategory, filtroColor, filtroTalla, ordenPrecio, favoritos, parseTallasseguro]);

  // Funciones Admin
  const prepararEdicion = (producto: Product) => {
    setNuevaPieza({
      titulo: producto.titulo, 
      descripcion: producto.descripcion || '', 
      costo: producto.costo || '', 
      precio: producto.precio, 
      disponibilidad: String(producto.disponibilidad || ''), 
      subcategoria: producto.subcategoria || '',
      tallas: parseTallasseguro(producto.tallas), 
      color: producto.color || '', 
      imagen: null, 
      imagen_url: producto.imagen_url
    });
    setEditandoId(producto.id);
    setShowInlineForm(true);
  };

  const cerrarFormulario = () => {
    setShowInlineForm(false);
    setEditandoId(null);
    setNuevaPieza({ titulo: '', descripcion: '', costo: '', precio: '', disponibilidad: '', subcategoria: '', tallas: {}, color: '', imagen: null, imagen_url: '' });
  };

  const handlePublicarLocal = async (e: React.FormEvent) => {
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
      costo: Number(nuevaPieza.costo) || 0, 
      precio: Number(nuevaPieza.precio), 
      categoria: category, 
      disponibilidad: nuevaPieza.disponibilidad || 'Bajo Pedido',
      subcategoria: nuevaPieza.subcategoria || 'General', 
      color: nuevaPieza.color || '',
      tallas: nuevaPieza.subcategoria === 'Anillos' ? JSON.stringify(nuevaPieza.tallas) : null,
      imagen_url: imageUrl 
    };

    if (editandoId) {
      const { data } = await supabase.from('productos').update(payload).eq('id', editandoId).select();
      if (data && data.length > 0) {
        setProductos(prev => prev.map(p => p.id === editandoId ? data[0] : p));
        cerrarFormulario();
      }
    } else {
      const { data } = await supabase.from('productos').insert([payload]).select();
      if (data && data.length > 0) {
        setProductos(prev => [data[0], ...prev]);
        cerrarFormulario();
      }
    }
  };

  return (
    <section className="container mx-auto py-8 md:py-16 flex-grow w-full max-w-7xl animate-fade-in relative z-10">
      <h2 className="text-[12px] md:text-[16px] tracking-[0.4em] uppercase text-white mb-8 md:mb-12 text-center border-b border-white/10 pb-4 md:pb-6 break-words drop-shadow-md">
        {category === 'deseos' ? 'Lista de Deseos' : category}
      </h2>

      {/* Filtros Subcategorías */}
      {['Acero Fino', 'Plata de Ley 925'].includes(category) && (
        <ul className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-12 mb-6 border-b border-white/10 pb-6">
          {subcategoriasJoyeria.map(sub => (
            <li 
              key={sub} 
              onClick={() => setActiveSubCategory(sub)} 
              className={`text-[8px] sm:text-[10px] tracking-[0.2em] uppercase cursor-pointer transition-colors duration-300 ${activeSubCategory === sub ? 'text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {sub}
            </li>
          ))}
        </ul>
      )}

      {/* Filtros Dropdown (Acero Fino) */}
      {category === 'Acero Fino' && (
        <div className="w-full max-w-3xl mx-auto mb-8 sm:mb-10 flex flex-col items-center relative z-[150]">
          <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold mb-4 sm:mb-6 uppercase">Ordenar Por</p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-16 w-full text-[8px] sm:text-[10px] md:text-[11px] tracking-[0.2em] uppercase">
            
            <div className="relative group cursor-pointer pb-2" onMouseLeave={() => setOpenFilter(null)}>
              <div onClick={() => setOpenFilter(openFilter === 'color' ? null : 'color')} className={`transition-colors ${filtroColor !== 'Todo' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white'}`}>
                Color: {filtroColor === 'Todo' ? 'Todos' : filtroColor}
              </div>
              {openFilter === 'color' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[200] min-w-[120px] sm:min-w-[140px]">
                  <div className="bg-black/60 backdrop-blur-3xl w-full flex flex-col items-center gap-3 sm:gap-4 py-3 sm:py-4 border border-white/10 rounded-sm">
                    {['Todo', 'Silver', 'Gold', 'Black'].map(opt => (
                      <span key={opt} onClick={() => { setFiltroColor(opt); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 hover:bg-white/5 ${filtroColor === opt ? 'text-white' : 'text-gray-500 hover:text-white'}`}>
                        {opt === 'Todo' ? 'Todos' : opt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {['Todo', 'Anillos'].includes(activeSubCategory) && (
              <div className="relative group cursor-pointer pb-2" onMouseLeave={() => setOpenFilter(null)}>
                <div onClick={() => setOpenFilter(openFilter === 'talla' ? null : 'talla')} className={`transition-colors ${filtroTalla !== 'Todo' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white'}`}>
                  Talla: {filtroTalla === 'Todo' ? 'Todas' : filtroTalla}
                </div>
                {openFilter === 'talla' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[200] min-w-[120px] sm:min-w-[140px]">
                    <div className="bg-black/60 backdrop-blur-3xl w-full flex flex-col items-center gap-3 sm:gap-4 py-3 sm:py-4 border border-white/10 rounded-sm max-h-64 overflow-y-auto">
                      <span onClick={() => { setFiltroTalla('Todo'); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 hover:bg-white/5 ${filtroTalla === 'Todo' ? 'text-white' : 'text-gray-500'}`}>Todas</span>
                      {tallasDisponibles.map(t => (
                        <span key={t} onClick={() => { setFiltroTalla(t); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 hover:bg-white/5 ${filtroTalla === t ? 'text-white' : 'text-gray-500'}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative group cursor-pointer pb-2" onMouseLeave={() => setOpenFilter(null)}>
              <div onClick={() => setOpenFilter(openFilter === 'precio' ? null : 'precio')} className={`transition-colors ${ordenPrecio !== '' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white'}`}>
                Precio: {ordenPrecio === '' ? 'Normal' : (ordenPrecio === 'Asc' ? 'Menor a Mayor' : 'Mayor a Menor')}
              </div>
              {openFilter === 'precio' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[200] min-w-[140px] sm:min-w-[160px]">
                  <div className="bg-black/60 backdrop-blur-3xl w-full flex flex-col items-center gap-3 sm:gap-4 py-3 sm:py-4 border border-white/10 rounded-sm">
                    <span onClick={() => { setOrdenPrecio(''); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 hover:bg-white/5 ${ordenPrecio === '' ? 'text-white' : 'text-gray-500'}`}>Normal</span>
                    <span onClick={() => { setOrdenPrecio('Asc'); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 hover:bg-white/5 ${ordenPrecio === 'Asc' ? 'text-white' : 'text-gray-500'}`}>Menor a Mayor</span>
                    <span onClick={() => { setOrdenPrecio('Desc'); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 hover:bg-white/5 ${ordenPrecio === 'Desc' ? 'text-white' : 'text-gray-500'}`}>Mayor a Menor</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Botón Admin: Añadir Pieza */}
      {userRole === 'admin' && !showInlineForm && category !== 'deseos' && (
        <div 
          onClick={() => { 
            setEditandoId(null); 
            setNuevaPieza({titulo: '', descripcion: '', costo: '', precio: '', disponibilidad: '', subcategoria: activeSubCategory !== 'Todo' ? activeSubCategory : '', tallas: {}, color: '', imagen: null, imagen_url: '' }); 
            setShowInlineForm(true); 
          }} 
          className="mb-6 sm:mb-8 md:mb-12 border border-dashed border-white/20 py-4 sm:py-6 md:py-8 text-center bg-black/20 hover:bg-white/5 transition-all duration-300 cursor-pointer w-full backdrop-blur-md rounded-sm"
        >
          <span className="text-white/70 tracking-[0.2em] text-[8px] sm:text-[10px] uppercase">+ Añadir nueva pieza a {category}</span>
        </div>
      )}

      {/* Formulario Admin Inline/Modal */}
      {userRole === 'admin' && showInlineForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <form onSubmit={handlePublicarLocal} className="liquid-glass liquid-form p-6 md:p-10 shadow-2xl relative w-full max-w-4xl rounded-[2rem] max-h-[90vh] overflow-y-auto m-auto">
            <button type="button" onClick={cerrarFormulario} className="absolute top-4 right-6 text-gray-500 hover:text-white text-3xl cursor-pointer bg-transparent border-none outline-none z-50 transition-colors">×</button>
            <h3 className="text-[10px] md:text-sm tracking-[0.3em] uppercase text-white mb-6 text-center drop-shadow-md">{editandoId ? 'EDITAR PIEZA' : 'DETALLES DE LA NUEVA PIEZA'}</h3>
            
            {(nuevaPieza.imagen || nuevaPieza.imagen_url) && (
              <div className="mb-6 flex justify-center bg-transparent p-0">
                <img src={nuevaPieza.imagen ? URL.createObjectURL(nuevaPieza.imagen) : nuevaPieza.imagen_url} alt="Vista previa" className="h-40 md:h-64 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6 text-center items-center justify-items-center w-full">
              <input type="text" value={nuevaPieza.titulo} onChange={e => setNuevaPieza({...nuevaPieza, titulo: e.target.value})} placeholder="TÍTULO DE LA OBRA" className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-500 text-center hover:border-white/50 focus:border-white transition-colors" required />
              
              <div className="w-full relative">
                <input type="number" value={nuevaPieza.costo} onChange={e => setNuevaPieza({...nuevaPieza, costo: e.target.value})} placeholder="COSTO FABRICACIÓN (USD)" className="w-full bg-transparent border-b border-white/20 text-white/70 text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-600 text-center hover:border-white/50 focus:border-white transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>

              <input type="number" value={nuevaPieza.precio} onChange={e => setNuevaPieza({...nuevaPieza, precio: e.target.value})} placeholder="PRECIO VENTA (USD)" className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-400 text-center hover:border-white/50 focus:border-white transition-colors font-serif" required />
              
              {nuevaPieza.subcategoria !== 'Anillos' && (
                <input type="text" value={nuevaPieza.disponibilidad} onChange={e => setNuevaPieza({...nuevaPieza, disponibilidad: e.target.value})} placeholder="DISPONIBILIDAD (EJ: 5 EN STOCK)" className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-400 text-center hover:border-white/50 focus:border-white transition-colors" />
              )}
              
              {['Acero Fino', 'Plata de Ley 925'].includes(category) && (
                <div className="relative w-full z-[160]" onMouseLeave={() => setOpenFormSelect(null)}>
                  <div onClick={() => setOpenFormSelect(openFormSelect === 'subcat' ? null : 'subcat')} className="w-full bg-transparent border-b border-white/20 text-gray-500 hover:text-white text-[10px] md:text-xs tracking-[0.2em] py-2 cursor-pointer text-center transition-colors uppercase">
                    {nuevaPieza.subcategoria || 'TIPO DE JOYA (OPCIONAL)'}
                  </div>
                  {openFormSelect === 'subcat' && (
                    <div className="absolute top-full left-0 w-full pt-1 z-[300]">
                      <div className="bg-black/90 backdrop-blur-3xl flex flex-col gap-4 py-4 border border-white/10 rounded-sm max-h-48 overflow-y-auto">
                        <div onClick={() => { setNuevaPieza({...nuevaPieza, subcategoria: '', tallas: {}}); setOpenFormSelect(null); }} className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 hover:text-white cursor-pointer text-center transition-colors uppercase py-2">NINGUNO</div>
                        {subcategoriasJoyeria.filter(s => s !== 'Todo').map(sub => (
                          <div key={sub} onClick={() => { setNuevaPieza({...nuevaPieza, subcategoria: sub, tallas: {}}); setOpenFormSelect(null); }} className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 hover:text-white cursor-pointer text-center transition-colors uppercase py-2">{sub}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {category === 'Acero Fino' && (
                <div className="relative w-full z-[150]" onMouseLeave={() => setOpenFormSelect(null)}>
                  <div onClick={() => setOpenFormSelect(openFormSelect === 'color' ? null : 'color')} className="w-full bg-transparent border-b border-white/20 text-gray-500 hover:text-white text-[10px] md:text-xs tracking-[0.2em] py-2 cursor-pointer text-center transition-colors uppercase">
                    {nuevaPieza.color || 'COLOR (OPCIONAL)'}
                  </div>
                  {openFormSelect === 'color' && (
                    <div className="absolute top-full left-0 w-full pt-1 z-[300]">
                      <div className="bg-black/90 backdrop-blur-3xl flex flex-col gap-4 py-4 border border-white/10 rounded-sm">
                        <div onClick={() => { setNuevaPieza({...nuevaPieza, color: ''}); setOpenFormSelect(null); }} className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 hover:text-white cursor-pointer text-center transition-colors uppercase py-2">NINGUNO</div>
                        {['Silver', 'Gold', 'Black'].map(c => (
                          <div key={c} onClick={() => { setNuevaPieza({...nuevaPieza, color: c}); setOpenFormSelect(null); }} className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 hover:text-white cursor-pointer text-center transition-colors uppercase py-2">{c}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {Number(nuevaPieza.costo) > 0 && (
              <div className="w-full flex flex-col items-center justify-center mb-8 pb-6 border-b border-white/5 mt-4">
                <p className="text-[8px] md:text-[10px] tracking-[0.2em] text-gray-500 mb-4 uppercase">Estrategia de Precios</p>
                <div className="flex gap-4 md:gap-8 flex-wrap justify-center text-[8px] md:text-[10px] tracking-[0.2em] text-gray-300 uppercase">
                  {[115, 100, 75, 50, 25].map(porcentaje => {
                    const sugerido = Number(nuevaPieza.costo) * (1 + porcentaje / 100);
                    return (
                      <button key={porcentaje} type="button" onClick={() => setNuevaPieza({...nuevaPieza, precio: sugerido.toFixed(2)})} className="bg-transparent text-gray-500 hover:text-white transition-colors cursor-pointer outline-none border border-gray-500 hover:border-white px-4 py-2 font-serif">{porcentaje}%: ${sugerido.toFixed(2)}</button>
                    );
                  })}
                </div>
              </div>
            )}

            {nuevaPieza.subcategoria === 'Anillos' && (
              <div className="w-full flex flex-col items-center mt-4 mb-8 pb-6 border-b border-white/5">
                <p className="text-[10px] md:text-xs tracking-[0.2em] text-gray-300 mb-6 uppercase drop-shadow-md">Inventario por talla:</p>
                <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
                  {tallasDisponibles.map(talla => (
                    <div key={talla} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => { const current = parseInt(nuevaPieza.tallas[talla]) || 0; setNuevaPieza({...nuevaPieza, tallas: { ...nuevaPieza.tallas, [talla]: current + 1 }}); }}>
                      <span className="text-white text-[12px] md:text-sm font-light font-serif">{talla}</span>
                      <input type="number" min="0" value={nuevaPieza.tallas[talla] || ''} onChange={(e) => setNuevaPieza({...nuevaPieza, tallas: { ...nuevaPieza.tallas, [talla]: e.target.value }})} onClick={(e) => e.stopPropagation()} placeholder="0" className="w-10 bg-transparent text-white text-center text-[10px] md:text-xs py-1 outline-none border-b border-white/20 placeholder-gray-500 transition-colors focus:border-white/50 m-0 font-serif" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea value={nuevaPieza.descripcion} onChange={e => setNuevaPieza({...nuevaPieza, descripcion: e.target.value})} placeholder="DESCRIPCIÓN EDITORIAL..." rows={3} className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-500 text-center hover:border-white/50 focus:border-white transition-colors mb-8 resize-none"></textarea>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-10 bg-transparent p-0 w-full">
              <input type="file" onChange={e => setNuevaPieza({...nuevaPieza, imagen: e.target.files?.[0] || null})} className="text-[10px] md:text-xs text-gray-500 file:mr-4 file:py-2 file:px-6 file:border file:border-gray-500 hover:file:border-white file:tracking-[0.2em] file:uppercase file:bg-transparent file:text-gray-500 hover:file:text-white transition-colors cursor-pointer w-full md:w-auto" />
              <button type="submit" className="bg-white text-black hover:bg-gray-300 transition-all duration-300 cursor-pointer outline-none border-none text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase px-12 py-4 w-full md:w-auto shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">{editandoId ? 'Guardar Cambios' : 'Publicar Pieza'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Rejilla de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full border-t border-l border-white/10 mt-8">
        {productosMostrar.map(producto => (
          <ProductCard 
            key={producto.id} 
            producto={producto} 
            userRole={userRole} 
            onClick={() => userRole === 'cliente' && setProductoSeleccionado(producto)}
            onEdit={prepararEdicion}
          />
        ))}
        {productosMostrar.length === 0 && (
          <div className="col-span-full text-center py-20 border-b border-r border-white/10">
            <p className="text-gray-500 tracking-[0.2em] uppercase text-[10px]">
              {category === 'deseos' ? 'No hay piezas en su lista de deseos aún.' : 'No hay piezas en esta categoría aún.'}
            </p>
          </div>
        )}
      </div>

      {productoSeleccionado && (
        <ProductModal 
          producto={productoSeleccionado} 
          userRole={userRole} 
          onClose={() => setProductoSeleccionado(null)} 
        />
      )}
    </section>
  );
}