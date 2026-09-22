import { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { supabase } from '../../services/supabase';
import type { Product } from '../../types';

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
    setProductos
  } = useShop();

  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<string[]>([]);
  const [cantidadesPorTalla, setCantidadesPorTalla] = useState<Record<string, number>>({});

  const tallasObj = parseTallasseguro(producto.tallas);
  const isRing = producto.subcategoria === 'Anillos';
  const isJewelry = ['Joyería Exclusiva', 'Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'].includes(producto.categoria);
  const stockDisponible = parseInt(String(producto.disponibilidad));
  const cantidadSeleccionada = cantidadesPorTalla.general || 0;
  const canBuy = isRing
    ? tallasSeleccionadas.some(talla => (cantidadesPorTalla[talla] || 0) > 0)
    : cantidadSeleccionada > 0 && (Number.isNaN(stockDisponible) || stockDisponible > 0);

  const handleSelectTalla = (e: React.MouseEvent, talla: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTallasSeleccionadas(prev => 
      prev.includes(talla) ? prev.filter(t => t !== talla) : [...prev, talla]
    );
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

  const handleToggleVendidoAdmin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let nuevasTallas = null;
    let nuevoVendido = producto.vendido;
    let cantidadVendida = 1; 

    if (isRing) {
      if (tallasSeleccionadas.length === 0) {
        return alert('Para descontar stock de un anillo, seleccione primero la(s) talla(s).');
      }
      let errorStock = false;
      tallasSeleccionadas.forEach(talla => {
        if (!tallasObj[talla] || Number(tallasObj[talla]) < 1) errorStock = true;
        else (tallasObj as Record<string, number>)[talla] = Number(tallasObj[talla]) - 1;
      });

      if (errorStock) return alert('Una de las tallas seleccionadas no tiene stock disponible.');
      nuevasTallas = JSON.stringify(tallasObj);
      cantidadVendida = tallasSeleccionadas.length; 
      const totalStockRestante = Object.values(tallasObj).reduce((acc: number, val: any) => acc + Number(val), 0);
      if (totalStockRestante === 0) nuevoVendido = true;
      setTallasSeleccionadas([]);
    } else {
      let disp = parseInt(String(producto.disponibilidad));
      if (!isNaN(disp) && disp > 1 && !producto.vendido) {} else { nuevoVendido = !producto.vendido; }
    }

    const currentVendidos = producto.vendidos || 0;
    const { data, error } = await supabase.from('productos').update({ 
      tallas: nuevasTallas !== null ? nuevasTallas : producto.tallas,
      vendido: nuevoVendido,
      vendidos: currentVendidos + cantidadVendida
    }).eq('id', producto.id).select();

    if (!error && data && data.length > 0) {
      setProductos(prev => prev.map(p => p.id === producto.id ? data[0] : p));
    }
  };

  return (
    <div className={`group relative flex flex-col p-3 sm:p-4 transition-all duration-500 ${isJewelry ? 'jewelry-product-card' : 'bg-black/20 backdrop-blur-md hover:bg-black/40'}`}>

      {/* Imagen */}
      <div className={`overflow-hidden aspect-square relative w-full mb-3 sm:mb-4 ${userRole === 'cliente' ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <img loading="lazy" src={producto.imagen_url} alt={producto.titulo} className="w-full h-full object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 will-change-transform" />
        
        {producto.vendido && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <span className="text-white tracking-[0.4em] text-[10px] md:text-xs font-bold uppercase border border-white/50 px-6 py-3 bg-black/60 shadow-[0_0_15px_rgba(0,0,0,0.8)]">Agotado</span>
          </div>
        )}

        {/* Botones Admin sobre la imagen */}
        {userRole === 'admin' && (
          <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20">
            <button onClick={(e) => { e.stopPropagation(); onEdit?.(producto); }} className="bg-black/80 backdrop-blur-md p-2 text-white border border-white/10 rounded-full cursor-pointer hover:text-white/80 hover:scale-110 transition-transform">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button onClick={(e) => handleBorrarLocal(e, producto.id)} className="bg-black/80 backdrop-blur-md p-2 text-white border border-white/10 rounded-full cursor-pointer hover:text-red-500 hover:scale-110 transition-transform">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex flex-col flex-grow items-center text-center w-full z-10 relative">
        <h4 className="text-xs md:text-sm font-bold tracking-[0.1em] uppercase text-white mb-1.5 line-clamp-2 break-words w-full group-hover:text-gray-300 transition-colors">{producto.titulo}</h4>
        <span className="text-xs md:text-base tracking-[0.06em] text-white font-semibold whitespace-nowrap mb-1 block">${producto.precio} USD</span>
        
        {isRing && (
          <div className="flex flex-col items-center w-full mb-3 mt-1 z-30">
            <div className="grid grid-cols-8 gap-1 sm:gap-1.5 w-full">
              {tallasDisponibles.map(talla => {
                const stock = parseInt(String(tallasObj[talla] || 0));
                const isAvailable = stock > 0;
                const isSelected = tallasSeleccionadas.includes(talla);
                
                return (
                  <div key={talla} className="flex min-w-0 flex-col items-center gap-1">
                    <button 
                      type="button"
                      onClick={(e) => { if (isAvailable) handleSelectTalla(e, talla); }}
                      className={`w-full aspect-square max-w-9 flex items-center justify-center text-[10px] sm:text-[11px] tracking-[0.04em] transition-all duration-300 border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-pointer' : 'bg-black/20 text-white border-white/25 hover:border-white cursor-pointer') : 'border-red-500/20 text-red-500/50 bg-black/10 cursor-not-allowed'}`}
                    >
                      <span>{talla}</span>
                    </button>
                    {isAvailable ? (
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-400">
                        <button type="button" aria-label={`Reducir cantidad de talla ${talla}`} disabled={!isSelected || !(cantidadesPorTalla[talla] || 0)} onClick={(e) => handleCantidad(e, talla, -1, stock)} className="px-1 disabled:opacity-30">-</button>
                        <span className="min-w-3 text-center">{cantidadesPorTalla[talla] || 0}</span>
                        <button type="button" aria-label={`Aumentar cantidad de talla ${talla}`} disabled={!isSelected || (cantidadesPorTalla[talla] || 0) >= stock} onClick={(e) => handleCantidad(e, talla, 1, stock)} className="px-1 disabled:opacity-30">+</button>
                      </div>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] text-red-500/40 uppercase">Agotado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {!isRing && (
          <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
            <span className="text-[10px] uppercase tracking-[0.1em] text-gray-400">Cantidad</span>
            <button type="button" aria-label="Reducir cantidad" disabled={cantidadSeleccionada === 0} onClick={(e) => handleCantidad(e, 'general', -1, stockDisponible)} className="w-6 h-6 border border-white/30 text-white disabled:opacity-30">-</button>
            <span className="min-w-4 text-center text-white">{cantidadSeleccionada}</span>
            <button type="button" aria-label="Aumentar cantidad" disabled={Number.isNaN(stockDisponible) ? false : cantidadSeleccionada >= stockDisponible} onClick={(e) => handleCantidad(e, 'general', 1, Number.isNaN(stockDisponible) ? 99 : stockDisponible)} className="w-6 h-6 border border-white/30 text-white disabled:opacity-30">+</button>
          </div>
        )}

        <p className="text-xs text-gray-300 line-clamp-2 leading-snug mb-3 sm:mb-4 break-words uppercase w-full">{producto.descripcion}</p>

        {/* Acciones Cliente */}
        {userRole === 'cliente' && !producto.vendido && (
          <div className="flex flex-col sm:flex-row gap-2 mt-auto w-full z-30 justify-center">
             <button 
               onClick={handleComprar}
               disabled={!canBuy}
               className={`w-full sm:flex-grow py-2 sm:py-3 text-[7px] sm:text-[8px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-all duration-300 cursor-pointer border-none outline-none rounded-sm ${canBuy ? 'bg-white text-black hover:bg-gray-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10'}`}
             >
               {canBuy ? 'COMPRAR' : isRing ? 'ELIJA TALLA Y CANTIDAD' : 'ELIJA CANTIDAD'}
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }} 
               className={`w-full sm:w-auto px-4 md:px-5 py-2 md:py-3 border transition-colors cursor-pointer text-xs sm:text-sm flex items-center justify-center bg-transparent outline-none rounded-sm ${favoritos.includes(producto.id) ? 'border-white text-white' : 'border-white/20 text-gray-400 hover:text-white hover:border-white/50'}`}
             >
               {favoritos.includes(producto.id) ? '♥' : '♡'}
             </button>
          </div>
        )}

        {/* Acciones Admin */}
        {userRole === 'admin' && (
          <button 
            onClick={handleToggleVendidoAdmin} 
            className={`w-full py-2 sm:py-2.5 mt-auto text-[8px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-colors cursor-pointer border outline-none rounded-sm z-30 ${producto.vendido ? 'bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-white' : 'bg-white text-black border-white hover:bg-gray-300'}`}
          >
            {producto.vendido ? 'Desmarcar Venta' : 'Marcar como Vendida'}
          </button>
        )}
      </div>
    </div>
  );
}