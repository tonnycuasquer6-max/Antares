import { useState } from 'react';
import { useShop } from '../../context/useShop';
import { supabase } from '../../services/supabase';
import { optimizeCloudinaryUrl } from '../../utils/imageOptimization';
import type { Product } from '../../types';

const obtenerFechaLocal = () => {
  const ahora = new Date();
  return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

interface ProductCardProps {
  producto: Product;
  userRole: string;
  onClick: () => void;
  onEdit?: (producto: Product) => void;
}

export default function ProductCard({ producto, userRole, onClick, onEdit }: ProductCardProps) {
  const { 
    agregarAlCarrito, 
    toggleFavorito, 
    favoritos, 
    parseTallasseguro, 
    tallasDisponibles,
    setProductos,
    fetchProductos
  } = useShop();

  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<string[]>([]);
  const [cantidadesPorTalla, setCantidadesPorTalla] = useState<Record<string, number>>({});
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleDate, setSaleDate] = useState(obtenerFechaLocal);
  const [salePrice, setSalePrice] = useState('');
  const [retiroSocio, setRetiroSocio] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [isSavingSale, setIsSavingSale] = useState(false);

  const tallasObj = parseTallasseguro(producto.tallas);
  const isRing = producto.subcategoria?.toLowerCase().trim() === 'anillos';
  const isJewelry = ['joyería exclusiva', 'acero fino', 'plata de ley 925', 'gemas y piedras naturales'].includes(producto.categoria?.toLowerCase().trim() ?? '');
  const canFlipCard = userRole === 'admin';
  const stockDisponible = parseInt(String(producto.disponibilidad));
  const cantidadSeleccionada = cantidadesPorTalla.general || 0;
  const canBuy = isRing
    ? tallasSeleccionadas.some(talla => (cantidadesPorTalla[talla] || 0) > 0)
    : cantidadSeleccionada > 0 && (Number.isNaN(stockDisponible) || stockDisponible > 0);

  const handleSelectTalla = (e: React.MouseEvent, talla: string) => {
    e.preventDefault();
    e.stopPropagation();
    const cantidadActual = cantidadesPorTalla[talla] || 0;
    const stock = parseInt(String(tallasObj[talla] || 0));

    if (cantidadActual > 0) {
      setTallasSeleccionadas(prev => prev.filter(t => t !== talla));
      setCantidadesPorTalla(prev => ({ ...prev, [talla]: 0 }));
    } else if (stock > 0) {
      setTallasSeleccionadas(prev => prev.includes(talla) ? prev : [...prev, talla]);
      setCantidadesPorTalla(prev => ({ ...prev, [talla]: 1 }));
    }
  };

  const handleCantidad = (e: React.MouseEvent, key: string, delta: number, max: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCantidadesPorTalla(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min((prev[key] || 0) + delta, max))
    }));
  };

  const handleComprar = (e: React.MouseEvent) => {
    if (!canBuy) return;
    agregarAlCarrito(producto, tallasSeleccionadas, e, cantidadSeleccionada, cantidadesPorTalla);
    setTallasSeleccionadas([]);
    setCantidadesPorTalla({});
  };

  const handleBorrarLocal = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if(window.confirm('¿Seguro que deseas retirar esta pieza?')) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (!error) {
        setProductos(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const handleToggleVendidoAdmin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (producto.vendido) return;
    if (isRing && !tallasSeleccionadas.some(talla => (cantidadesPorTalla[talla] || 0) > 0)) {
      return alert('Para registrar la venta de un anillo, seleccione primero la talla.');
    }
    setSaleDate(obtenerFechaLocal());
    setSalePrice('');
    setRetiroSocio(false);
    setSaleError('');
    setShowSaleForm(true);
  };

  const handleSaveSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const parsedPrice = retiroSocio ? Number(producto.costo || 0) : Number(salePrice);
    if (!salePrice.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setSaleError('Ingresa un PVP válido.');
      return;
    }

    const unidades = isRing
      ? tallasSeleccionadas
        .map(talla => ({ talla, cantidad: cantidadesPorTalla[talla] || 0 }))
        .filter(unidad => unidad.cantidad > 0)
      : [{ talla: 'N/A', cantidad: Math.max(1, cantidadSeleccionada) }];
    if (unidades.length === 0) {
      setSaleError('Selecciona una talla con cantidad mayor que cero.');
      return;
    }

    setIsSavingSale(true);
    setSaleError('');
    try {
      const { error } = await supabase.rpc('registrar_venta_manual', {
        p_producto_id: producto.id,
        p_fecha_venta: saleDate,
        p_pvp: parsedPrice,
        p_unidades: unidades,
        p_retiro_socio: retiroSocio
      });

      if (error) {
        console.error('No se pudo registrar la venta manual:', error);
        setSaleError(`No se pudo registrar la venta: ${error.message}`);
        setIsSavingSale(false);
        return;
      }

      await fetchProductos();
      window.dispatchEvent(new CustomEvent('antares-manual-sale-recorded'));
      setTallasSeleccionadas([]);
      setCantidadesPorTalla({});
      setShowSaleForm(false);
    } catch (error) {
      console.error('Error inesperado al registrar la venta manual:', error);
      setSaleError('Ocurrió un error de conexión al registrar la venta. Intenta de nuevo.');
    } finally {
      setIsSavingSale(false);
    }
  };

  return (
    <div className={`group relative h-full w-full ${canFlipCard ? '[perspective:1200px]' : ''}`}>
      <div className={`relative h-full w-full ${canFlipCard ? 'transition-transform duration-500 [transform-style:preserve-3d] [-webkit-transform-style:preserve-3d]' : ''} ${canFlipCard && showSaleForm ? '[transform:rotateY(180deg)]' : ''}`}>
        <div
          aria-hidden={showSaleForm}
          className={`relative flex h-full w-full flex-col p-0 text-shadow transition-all duration-500 glass-panel [backface-visibility:hidden] [-webkit-backface-visibility:hidden] ${showSaleForm ? '' : isJewelry ? 'jewelry-product-card product-card-surface' : 'product-card-surface'} ${showSaleForm ? 'pointer-events-none' : ''}`}
        >

      {/* Imagen */}
      <div className="relative w-full aspect-square overflow-hidden bg-neutral-900" onClick={onClick}>
        <img loading="lazy" decoding="async" fetchPriority="low" src={optimizeCloudinaryUrl(producto.imagen_url, 600)} alt={producto.titulo} className={`w-full h-full object-contain bg-neutral-900/40 opacity-80 group-hover:opacity-100 transition-opacity duration-700 ${userRole === 'cliente' ? 'cursor-pointer' : ''}`} />
        
        {producto.vendido && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <span className="text-white tracking-[0.4em] text-[10px] md:text-xs font-bold uppercase border border-white/50 px-6 py-3 bg-black/60 shadow-[0_0_15px_rgba(0,0,0,0.8)]">Agotado</span>
          </div>
        )}

        {/* Botones Admin sobre la imagen */}
        {userRole === 'admin' && (
          <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20">
            <button onClick={(e) => { e.stopPropagation(); onEdit?.(producto); }} className="glass-panel p-2 text-white rounded-full cursor-pointer hover:text-white/80 hover:scale-110 transition-transform">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button onClick={(e) => handleBorrarLocal(e, producto.id)} className="glass-panel p-2 text-white rounded-full cursor-pointer hover:text-red-500 hover:scale-110 transition-transform">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="relative z-10 mt-2 flex w-full flex-1 flex-col px-3 pb-3 text-center sm:px-4 sm:pb-4">
        <div className="flex flex-row justify-between items-center w-full gap-3 mb-1.5">
          <h4 className="text-left text-xs md:text-sm font-bold tracking-[0.1em] uppercase text-white line-clamp-2 break-words min-w-0 group-hover:text-gray-300 transition-colors">{producto.titulo}</h4>
          <span className="text-right text-xs md:text-base tracking-[0.06em] text-white font-semibold whitespace-nowrap">${producto.precio}</span>
        </div>
        
        <div className="flex w-full flex-1 flex-col">
          <div className={`flex w-full flex-col ${isRing ? 'mt-auto gap-4 pt-3' : 'flex-1 gap-2'}`}>
            <div className={`flex w-full flex-col ${isRing ? '' : 'flex-1 items-center justify-center'}`}>
            {isDescriptionExpanded ? (
              <div className="w-full break-words text-center text-xs leading-snug text-gray-300 uppercase">
                {producto.descripcion}
              </div>
            ) : (
              <>
                {isRing && (
                    <div className="grid grid-cols-4 gap-2 w-full">
                      {tallasDisponibles.map(talla => {
                        const stock = parseInt(String(tallasObj[talla] || 0));
                        const isAvailable = stock > 0;
                        const isSelected = tallasSeleccionadas.includes(talla);
                        
                        return (
                          <div key={talla} className="flex min-w-0 flex-col items-center gap-1">
                            <button 
                              type="button"
                              disabled={!isAvailable}
                              onClick={(e) => handleSelectTalla(e, talla)}
                              className={`w-full aspect-square max-w-9 flex items-center justify-center text-[10px] sm:text-[11px] tracking-[0.04em] transition-all duration-300 border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-pointer' : 'bg-black/20 text-white border-white/25 font-semibold hover:border-white cursor-pointer') : 'border-white/15 text-gray-400 bg-white/5 cursor-not-allowed'}`}
                            >
                              <span>{talla}</span>
                            </button>
                            <div className="flex h-4 items-center justify-center gap-1 text-[9px] text-gray-400 sm:text-[10px]">
                              {isAvailable ? (
                                <>
                                <button type="button" aria-label={`Reducir cantidad de talla ${talla}`} disabled={!isSelected || !(cantidadesPorTalla[talla] || 0)} onClick={(e) => handleCantidad(e, talla, -1, stock)} className="px-1 disabled:opacity-30">-</button>
                                <span className="min-w-3 text-center">{cantidadesPorTalla[talla] || 0}</span>
                                <button type="button" aria-label={`Aumentar cantidad de talla ${talla}`} disabled={!isSelected || (cantidadesPorTalla[talla] || 0) >= stock} onClick={(e) => handleCantidad(e, talla, 1, stock)} className="px-1 disabled:opacity-30">+</button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                )}
                
                {!isRing && (
                  <div className="flex w-full items-center justify-center gap-3 text-center">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Cantidad</span>
                    <button type="button" aria-label="Reducir cantidad" disabled={cantidadSeleccionada === 0} onClick={(e) => handleCantidad(e, 'general', -1, stockDisponible)} className="p-2 text-white disabled:opacity-30">-</button>
                    <span className="min-w-4 text-center text-white">{cantidadSeleccionada}</span>
                    <button type="button" aria-label="Aumentar cantidad" disabled={Number.isNaN(stockDisponible) ? false : cantidadSeleccionada >= stockDisponible} onClick={(e) => handleCantidad(e, 'general', 1, Number.isNaN(stockDisponible) ? 99 : stockDisponible)} className="p-2 text-white disabled:opacity-30">+</button>
                  </div>
                )}
              </>
            )}
            </div>

            {/* Acciones Cliente */}
            {userRole === 'cliente' && (
              <div className="flex flex-row gap-2 w-full z-30 justify-center">
                <button
                  type="button"
                  aria-label={isDescriptionExpanded ? 'Cerrar descripción' : 'Ver descripción completa'}
                  aria-expanded={isDescriptionExpanded}
                  onClick={(e) => { e.stopPropagation(); setIsDescriptionExpanded(prev => !prev); }}
                  className="w-9 shrink-0 border border-white/20 text-white hover:border-white/50 transition-colors cursor-pointer text-base flex items-center justify-center bg-transparent outline-none rounded-sm"
                >
                  {isDescriptionExpanded ? '-' : '+'}
                </button>
                {!producto.vendido && (
                  <>
                    <button 
                      onClick={handleComprar}
                      disabled={!canBuy}
                      className={`min-w-0 flex-1 py-2 sm:py-3 text-[7px] sm:text-[8px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-all duration-300 cursor-pointer border-none outline-none rounded-sm ${canBuy ? 'bg-white text-black hover:bg-gray-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10'}`}
                    >
                      {canBuy ? 'COMPRAR' : isRing ? 'ELIJA TALLA Y CANTIDAD' : 'ELIJA CANTIDAD'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }} 
                      className={`shrink-0 px-2 sm:px-4 md:px-5 py-2 md:py-3 border transition-colors cursor-pointer text-xs sm:text-sm flex items-center justify-center bg-transparent outline-none rounded-sm ${favoritos.includes(producto.id) ? 'border-white text-white' : 'border-white/20 text-gray-400 hover:text-white hover:border-white/50'}`}
                    >
                      {favoritos.includes(producto.id) ? '♥' : '♡'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Acciones Admin */}
            {userRole === 'admin' && (
              <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] gap-2">
                <button
                  type="button"
                  aria-label={isDescriptionExpanded ? 'Cerrar descripción' : 'Ver descripción completa'}
                  aria-expanded={isDescriptionExpanded}
                  onClick={(e) => { e.stopPropagation(); setIsDescriptionExpanded(prev => !prev); }}
                  className="h-9 w-9 self-center border border-white/20 text-white hover:border-white/50 transition-colors cursor-pointer text-base flex items-center justify-center bg-transparent outline-none rounded-sm"
                >
                  {isDescriptionExpanded ? '-' : '+'}
                </button>
                <button 
                  onClick={handleToggleVendidoAdmin} 
                  disabled={producto.vendido}
                  className="h-9 w-full whitespace-nowrap bg-white text-black px-2 text-[10px] tracking-[0.1em] uppercase font-bold block"
                >
                  {producto.vendido ? 'Agotado' : 'Marcar como Vendida'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
        </div>
        {showSaleForm && (
          <div
            aria-hidden={!showSaleForm}
            className={`absolute inset-0 z-20 overflow-hidden text-shadow glass-panel [transform:rotateY(180deg)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] ${isJewelry ? 'bg-black/80' : 'bg-black/45'}`}
          >
          <form
            aria-labelledby={`sale-form-title-${producto.id}`}
            onSubmit={handleSaveSale}
            onClick={e => e.stopPropagation()}
            className="h-full max-h-full w-full min-w-0 overflow-y-auto overscroll-contain rounded-sm p-3 sm:p-4"
          >
            <h3 id={`sale-form-title-${producto.id}`} className="text-sm tracking-[0.2em] uppercase text-white">
              Registrar venta: {producto.titulo}
            </h3>
            {isRing && (
              <p className="mt-3 text-[10px] tracking-[0.12em] text-gray-400">
                Talla(s): {tallasSeleccionadas.join(', ')}
              </p>
            )}
            <label className="mt-6 flex flex-col gap-2 text-[10px] tracking-[0.15em] uppercase text-gray-400">
              Fecha de venta
              <input
                type="date"
                required
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
                className="border-b border-white/30 bg-transparent py-2 text-sm text-white outline-none"
              />
            </label>
            <label className="mt-5 flex flex-col gap-2 text-[10px] tracking-[0.15em] uppercase text-gray-400">
              Costo (no editable)
              <input
                type="text"
                readOnly
                value={Number(producto.costo || 0).toFixed(2)}
                className="border-b border-white/15 bg-transparent py-2 text-sm text-gray-400 outline-none"
              />
            </label>
            <label className="mt-5 flex flex-col gap-2 text-[10px] tracking-[0.15em] uppercase text-gray-400">
              PVP / precio de venta
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={salePrice}
                  onChange={e => setSalePrice(e.target.value)}
                  readOnly={retiroSocio}
                  className="min-w-0 flex-1 border-b border-white/30 bg-transparent py-2 text-sm text-white outline-none"
                  placeholder={retiroSocio ? undefined : 'Precio al que se vendió'}
                />
                <button
                  type="button"
                  disabled={retiroSocio}
                  onClick={() => setSalePrice(String(producto.precio))}
                  className="border border-white/30 px-4 text-[10px] font-bold tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-black disabled:opacity-40"
                >
                  PVP
                </button>
              </div>
            </label>
            <label className="mt-5 flex items-center gap-3 text-[10px] tracking-[0.12em] uppercase text-gray-300">
              <input
                type="checkbox"
                checked={retiroSocio}
                onChange={e => {
                  const checked = e.target.checked;
                  setRetiroSocio(checked);
                  setSalePrice(checked ? String(Number(producto.costo || 0)) : '');
                }}
                className="h-4 w-4 accent-white"
              />
              Retiro de socio (Venta al costo)
            </label>
            {saleError && <p role="alert" className="mt-4 text-xs text-red-400">{saleError}</p>}
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isSavingSale}
                onClick={() => setShowSaleForm(false)}
                className="flex min-h-12 w-full items-center justify-center border border-white/30 px-3 py-2 text-center text-[10px] tracking-[0.15em] uppercase text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingSale}
                className="flex min-h-12 w-full items-center justify-center bg-white px-3 py-2 text-center text-[10px] font-bold tracking-[0.15em] uppercase text-black disabled:opacity-50"
              >
                {isSavingSale ? 'Guardando...' : 'Guardar venta'}
              </button>
            </div>
          </form>
          </div>
        )}
      </div>
    </div>
  );
}