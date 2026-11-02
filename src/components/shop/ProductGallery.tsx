import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useShop } from '../../context/ShopContext';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { supabase } from '../../services/supabase';
import { uploadToCloudinary } from '../../services/cloudinary';
import type { Product, NuevaPieza } from '../../types';
import { Filter } from 'lucide-react';

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
  const [showFilters, setShowFilters] = useState(false);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);
  
  // Admin Form State
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [editandoId, setEditandoId] = useState<string | number | null>(null);
  const [openFormSelect, setOpenFormSelect] = useState<string | null>(null);
  const originalPieza = useRef<NuevaPieza | null>(null);
  const [nuevaPieza, setNuevaPieza] = useState<NuevaPieza>({ 
    titulo: '', descripcion: '', costo: '', precio: '', porcentaje_inversionista: 0, disponibilidad: '', subcategoria: '', tallas: {}, color: '', imagen: null, imagen_url: '' 
  });

  const isJewelryCategory = ['Joyería Exclusiva', 'Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'].includes(category);

  // Filtros
  const productosMostrar = useMemo(() => {
    if (category === 'deseos') {
      return productos.filter(p => favoritos.includes(p.id));
    }

    let filtrados = productos.filter(p => p.publicado !== false && p.categoria === category && (activeSubCategory === 'Todo' || p.subcategoria === activeSubCategory));

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
    const pieza: NuevaPieza = {
      titulo: producto.titulo, 
      descripcion: producto.descripcion || '', 
      costo: producto.costo || '', 
      precio: producto.precio, 
      porcentaje_inversionista: producto.porcentaje_inversionista ?? 0,
      disponibilidad: String(producto.disponibilidad || ''), 
      subcategoria: producto.subcategoria || '',
      tallas: parseTallasseguro(producto.tallas), 
      color: producto.color || '', 
      imagen: null, 
      imagen_url: producto.imagen_url
    };
    originalPieza.current = { ...pieza, tallas: { ...pieza.tallas } };
    setNuevaPieza(pieza);
    setShowCloseConfirmation(false);
    setEditandoId(producto.id);
    setShowInlineForm(true);
  };

  const cerrarFormulario = useCallback(() => {
    setShowInlineForm(false);
    setShowCloseConfirmation(false);
    setEditandoId(null);
    originalPieza.current = null;
    setNuevaPieza({ titulo: '', descripcion: '', costo: '', precio: '', porcentaje_inversionista: 0, disponibilidad: '', subcategoria: '', tallas: {}, color: '', imagen: null, imagen_url: '' });
  }, []);

  const solicitarCierre = useCallback(() => {
    const original = originalPieza.current;
    const changedFields: (keyof NuevaPieza)[] = [
      'titulo', 'categoria', 'descripcion', 'costo', 'precio', 'porcentaje_inversionista',
      'disponibilidad', 'subcategoria', 'color', 'imagen', 'imagen_url'
    ];
    const hasChanges = original !== null && (
      changedFields.some(key => String(original[key] ?? '') !== String(nuevaPieza[key] ?? ''))
      || JSON.stringify(original.tallas) !== JSON.stringify(nuevaPieza.tallas)
    );

    if (hasChanges) {
      setShowCloseConfirmation(true);
      return;
    }
    cerrarFormulario();
  }, [cerrarFormulario, nuevaPieza]);

  useEffect(() => {
    if (!showInlineForm) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCloseConfirmation) setShowCloseConfirmation(false);
        else solicitarCierre();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showInlineForm, showCloseConfirmation, solicitarCierre]);

  const handlePublicarLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaPieza.titulo || !nuevaPieza.precio) return alert('Ponle un título y precio.');
    const porcentajeInversionista = Number(nuevaPieza.porcentaje_inversionista ?? 0);
    if (!Number.isFinite(porcentajeInversionista) || porcentajeInversionista < 0 || porcentajeInversionista > 100) {
      return alert('El porcentaje del inversionista debe estar entre 0 y 100.');
    }
    
    let imageUrl = nuevaPieza.imagen_url || 'https://images.unsplash.com/photo-1610486241074-b778f69d2d0b?q=80&w=1000';

    if (nuevaPieza.imagen) {
      try {
        imageUrl = await uploadToCloudinary(nuevaPieza.imagen, 'antares/productos');
      } catch (error) {
        return alert(`Error subiendo la imagen: ${error instanceof Error ? error.message : 'error desconocido'}`);
      }
    }

    const payload = { 
      titulo: nuevaPieza.titulo, 
      descripcion: nuevaPieza.descripcion, 
      costo: Number(nuevaPieza.costo) || 0, 
      precio: Number(nuevaPieza.precio), 
      porcentaje_inversionista: porcentajeInversionista,
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
    <section
      className={`container mx-auto py-4 md:py-8 flex-grow w-full max-w-7xl animate-fade-in relative z-10 ${isJewelryCategory ? 'jewelry-gallery' : ''}`}
    >
      {category !== 'Acero Fino' && (
        <h2 className="text-base md:text-xl tracking-[0.24em] md:tracking-[0.4em] uppercase text-white mb-4 md:mb-6 text-center pb-2 md:pb-3 break-words drop-shadow-md">
          {category === 'deseos' ? 'Lista de Deseos' : category}
        </h2>
      )}

      {/* Filtros Subcategorías */}
      {['Acero Fino', 'Plata de Ley 925'].includes(category) && (
        <div className="relative z-20 flex w-full flex-col items-center gap-2">
          <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <ul className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:w-auto sm:flex-nowrap sm:gap-4">
              {subcategoriasJoyeria.map(sub => (
                <li 
                  key={sub} 
                  onClick={() => setActiveSubCategory(sub)} 
                  className={`px-1 py-1 text-xs sm:text-sm tracking-[0.12em] sm:tracking-[0.16em] uppercase cursor-pointer transition-colors duration-300 ${activeSubCategory === sub ? 'text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {sub}
                </li>
              ))}
            </ul>

            {/* Filtros (Acero Fino) */}
            {category === 'Acero Fino' && (
              <button
                type="button"
                onClick={() => {
                  setShowFilters(current => !current);
                  setOpenFilter(null);
                }}
                aria-expanded={showFilters}
                aria-controls="product-filters"
                className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-[0.24em] text-gray-500 font-bold uppercase transition-colors hover:text-white text-shadow"
              >
                <Filter size={16} strokeWidth={1.8} aria-hidden="true" />
                <span className="sr-only">Mostrar filtros</span>
              </button>
            )}
          </div>

          {category === 'Acero Fino' && (
            <div
              id="product-filters"
              className={`relative z-20 w-full max-w-full self-center transition-all duration-300 ease-out ${showFilters ? 'pointer-events-auto mt-3 mb-5 max-h-[40rem] opacity-100' : 'pointer-events-none max-h-0 overflow-hidden opacity-0'}`}
            >
              <div className="w-full px-2">
              <div className="flex w-full flex-wrap items-start justify-center gap-5 text-[10px] sm:gap-7 sm:text-xs tracking-[0.12em] uppercase">
                <div className="relative flex shrink-0 flex-col items-center gap-2">
                  <button
                    type="button"
                    aria-expanded={openFilter === 'color'}
                    onClick={() => setOpenFilter(openFilter === 'color' ? null : 'color')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${filtroColor !== 'Todo' ? 'text-white' : 'text-gray-500'}`}
                  >
                    Color{filtroColor !== 'Todo' ? `: ${filtroColor}` : ''}
                  </button>
                  {openFilter === 'color' && (
                    <div className="glass-panel flex min-w-[140px] flex-col items-center gap-2 rounded-2xl px-5 py-2.5 text-center">
                      {['Todo', 'Silver', 'Gold', 'Black'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={filtroColor === opt}
                          onClick={() => { setFiltroColor(opt); setOpenFilter(null); }}
                          className={`w-full py-1 transition-colors hover:text-white ${filtroColor === opt ? 'text-white' : 'text-gray-400'}`}
                        >
                          {opt === 'Todo' ? 'Todos' : opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {['Todo', 'Anillos'].includes(activeSubCategory) && (
                  <div className="relative flex shrink-0 flex-col items-center gap-2">
                    <button
                      type="button"
                      aria-expanded={openFilter === 'talla'}
                      onClick={() => setOpenFilter(openFilter === 'talla' ? null : 'talla')}
                      className={`whitespace-nowrap transition-colors hover:text-white ${filtroTalla !== 'Todo' ? 'text-white' : 'text-gray-500'}`}
                    >
                      Talla{filtroTalla !== 'Todo' ? `: ${filtroTalla}` : ''}
                    </button>
                    {openFilter === 'talla' && (
                      <div className="glass-panel flex max-h-64 min-w-[140px] flex-col items-center gap-2 overflow-y-auto rounded-2xl px-5 py-2.5 text-center">
                        {['Todo', ...tallasDisponibles].map(talla => (
                          <button
                            key={talla}
                            type="button"
                            aria-pressed={filtroTalla === talla}
                            onClick={() => { setFiltroTalla(talla); setOpenFilter(null); }}
                            className={`w-full py-1 transition-colors hover:text-white ${filtroTalla === talla ? 'text-white' : 'text-gray-400'}`}
                          >
                            {talla === 'Todo' ? 'Todas' : talla}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="relative flex shrink-0 flex-col items-center gap-2">
                  <button
                    type="button"
                    aria-expanded={openFilter === 'precio'}
                    onClick={() => setOpenFilter(openFilter === 'precio' ? null : 'precio')}
                    className={`whitespace-nowrap transition-colors hover:text-white ${ordenPrecio !== '' ? 'text-white' : 'text-gray-500'}`}
                  >
                    Precio{ordenPrecio !== '' ? `: ${ordenPrecio === 'Asc' ? 'Menor a mayor' : 'Mayor a menor'}` : ''}
                  </button>
                  {openFilter === 'precio' && (
                    <div className="glass-panel flex min-w-[180px] flex-col items-center gap-2 rounded-2xl px-5 py-2.5 text-center">
                      {[
                        { value: '', label: 'Normal' },
                        { value: 'Asc', label: 'Menor a mayor' },
                        { value: 'Desc', label: 'Mayor a menor' },
                      ].map(option => (
                        <button
                          key={option.value || 'normal'}
                          type="button"
                          aria-pressed={ordenPrecio === option.value}
                          onClick={() => { setOrdenPrecio(option.value); setOpenFilter(null); }}
                          className={`w-full py-1 transition-colors hover:text-white ${ordenPrecio === option.value ? 'text-white' : 'text-gray-400'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>
              <div className="hidden">
              <div className="flex flex-nowrap justify-start gap-3 overflow-x-auto text-xs sm:justify-center sm:gap-5 md:gap-8 sm:text-sm tracking-[0.16em] uppercase">
            
            <div className="relative group cursor-pointer pb-1" onMouseLeave={() => setOpenFilter(null)}>
              <div onClick={() => setOpenFilter(openFilter === 'color' ? null : 'color')} className={`transition-colors ${filtroColor !== 'Todo' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white'}`}>
                Color: {filtroColor === 'Todo' ? 'Todos' : filtroColor}
              </div>
              {openFilter === 'color' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-[200] min-w-[120px] sm:min-w-[140px]">
                    <div className="glass-panel text-shadow w-full flex flex-col items-center gap-1.5 sm:gap-2 py-2 sm:py-3 rounded-sm">
                    {['Todo', 'Silver', 'Gold', 'Black'].map(opt => (
                      <span key={opt} onClick={() => { setFiltroColor(opt); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-1.5 hover:bg-white/5 ${filtroColor === opt ? 'text-white' : 'text-gray-500 hover:text-white'}`}>
                        {opt === 'Todo' ? 'Todos' : opt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {['Todo', 'Anillos'].includes(activeSubCategory) && (
              <div className="relative group cursor-pointer pb-1" onMouseLeave={() => setOpenFilter(null)}>
                <div onClick={() => setOpenFilter(openFilter === 'talla' ? null : 'talla')} className={`transition-colors ${filtroTalla !== 'Todo' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white'}`}>
                  Talla: {filtroTalla === 'Todo' ? 'Todas' : filtroTalla}
                </div>
                {openFilter === 'talla' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-[200] min-w-[120px] sm:min-w-[140px]">
                    <div className="glass-panel text-shadow w-full flex flex-col items-center gap-1.5 sm:gap-2 py-2 sm:py-3 rounded-sm max-h-64 overflow-y-auto">
                      <span onClick={() => { setFiltroTalla('Todo'); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-1.5 hover:bg-white/5 ${filtroTalla === 'Todo' ? 'text-white' : 'text-gray-500'}`}>Todas</span>
                      {tallasDisponibles.map(t => (
                        <span key={t} onClick={() => { setFiltroTalla(t); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-1.5 hover:bg-white/5 ${filtroTalla === t ? 'text-white' : 'text-gray-500'}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative group cursor-pointer pb-1" onMouseLeave={() => setOpenFilter(null)}>
              <div onClick={() => setOpenFilter(openFilter === 'precio' ? null : 'precio')} className={`transition-colors ${ordenPrecio !== '' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white'}`}>
                Precio: {ordenPrecio === '' ? 'Normal' : (ordenPrecio === 'Asc' ? 'Menor a Mayor' : 'Mayor a Menor')}
              </div>
              {openFilter === 'precio' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 z-[200] min-w-[140px] sm:min-w-[160px]">
                  <div className="glass-panel text-shadow w-full flex flex-col items-center gap-1.5 sm:gap-2 py-2 sm:py-3 rounded-sm">
                    <span onClick={() => { setOrdenPrecio(''); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-1.5 hover:bg-white/5 ${ordenPrecio === '' ? 'text-white' : 'text-gray-500'}`}>Normal</span>
                    <span onClick={() => { setOrdenPrecio('Asc'); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-1.5 hover:bg-white/5 ${ordenPrecio === 'Asc' ? 'text-white' : 'text-gray-500'}`}>Menor a Mayor</span>
                    <span onClick={() => { setOrdenPrecio('Desc'); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-1.5 hover:bg-white/5 ${ordenPrecio === 'Desc' ? 'text-white' : 'text-gray-500'}`}>Mayor a Menor</span>
                  </div>
                </div>
              )}
            </div>

            </div>
            </div>
            </div>
          )}
        </div>
      )}

      {/* Formulario Admin Inline/Modal */}
      {userRole === 'admin' && showInlineForm && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
          onClick={event => { if (event.target === event.currentTarget) solicitarCierre(); }}
        >
          <form
            onSubmit={handlePublicarLocal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-form-title"
            className="glass-panel liquid-form p-6 md:p-10 relative w-full max-w-4xl rounded-[2rem] max-h-[90vh] overflow-y-auto m-auto"
          >
            <button type="button" onClick={solicitarCierre} aria-label="Cerrar edición" className="absolute top-4 right-6 text-gray-500 hover:text-white text-3xl cursor-pointer bg-transparent border-none outline-none z-50 transition-colors">×</button>
            <h3 id="admin-product-form-title" className="text-[10px] md:text-sm tracking-[0.3em] uppercase text-white mb-6 text-center drop-shadow-md">{editandoId ? 'EDITAR PIEZA' : 'DETALLES DE LA NUEVA PIEZA'}</h3>
            
            {(nuevaPieza.imagen || nuevaPieza.imagen_url) && (
              <div className="mb-6 flex justify-center bg-transparent p-0">
                <img src={nuevaPieza.imagen ? URL.createObjectURL(nuevaPieza.imagen) : nuevaPieza.imagen_url} alt="Vista previa" className="h-40 md:h-64 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6 text-center items-center justify-items-center w-full">
              <input type="text" value={nuevaPieza.titulo} onChange={e => setNuevaPieza(current => ({ ...current, titulo: e.target.value }))} placeholder="TÍTULO DE LA OBRA" className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-500 text-center hover:border-white/50 focus:border-white transition-colors" required />
              
              <div className="w-full relative">
                <input type="number" value={nuevaPieza.costo} onChange={e => setNuevaPieza({...nuevaPieza, costo: e.target.value})} placeholder="COSTO FABRICACIÓN (USD)" className="w-full bg-transparent border-b border-white/20 text-white/70 text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-600 text-center hover:border-white/50 focus:border-white transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>

              <input type="number" value={nuevaPieza.precio} onChange={e => setNuevaPieza({...nuevaPieza, precio: e.target.value})} placeholder="PRECIO VENTA (USD)" className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-400 text-center hover:border-white/50 focus:border-white transition-colors font-serif" required />

              <label className="w-full text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-gray-400">
                Porcentaje del Inversionista (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={nuevaPieza.porcentaje_inversionista ?? 0}
                  onChange={e => setNuevaPieza(current => ({ ...current, porcentaje_inversionista: e.target.value }))}
                  className="mt-2 w-full bg-transparent border-b border-white/20 text-white text-center py-2 outline-none hover:border-white/50 focus:border-white transition-colors"
                  required
                />
              </label>
              
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
                      <div className="glass-panel flex flex-col gap-4 py-4 rounded-sm max-h-48 overflow-y-auto">
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
                      <div className="glass-panel flex flex-col gap-4 py-4 rounded-sm">
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
          {showCloseConfirmation && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="discard-product-changes-title"
                aria-describedby="discard-product-changes-description"
                className="glass-panel w-full max-w-md rounded-2xl p-6 md:p-8 text-center"
              >
                <h4 id="discard-product-changes-title" className="text-xs md:text-sm tracking-[0.2em] uppercase text-white">
                  ¿Seguro deseas cerrar sin guardar los cambios?
                </h4>
                <p id="discard-product-changes-description" className="mt-3 text-[10px] tracking-[0.12em] text-gray-400">
                  Los cambios realizados se perderán.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={cerrarFormulario}
                    className="bg-white px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-black transition-colors hover:bg-gray-300"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setShowCloseConfirmation(false)}
                    className="border border-white/30 bg-transparent px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase text-white transition-colors hover:bg-white/10"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Rejilla de Productos */}
      <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 md:gap-5 mt-8">
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
          <div className="col-span-full text-center py-20">
            <p className="text-gray-400 tracking-[0.14em] uppercase text-[11px]">
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