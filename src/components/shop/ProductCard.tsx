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

  const tallasObj = parseTallasseguro(producto.tallas);
  const isRing = producto.subcategoria === 'Anillos';
  const canBuy = !isRing || tallasSeleccionadas.length > 0;

  const handleSelectTalla = (e: React.MouseEvent, talla: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTallasSeleccionadas(prev => 
      prev.includes(talla) ? prev.filter(t => t !== talla) : [...prev, talla]
    );
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
    <div className="group relative bg-black/20 backdrop-blur-md flex flex-col p-4 sm:p-6 border-b border-r border-white/10 hover:bg-black/40 transition-colors duration-500">
      
      {/* Esquina inferior decorativa */}
      <div className="absolute -bottom-[10px] -right-[10px] w-5 h-5 bg-black z-20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z"/></svg>
      </div>

      {/* Imagen */}
      <div className={`overflow-hidden aspect-square relative w-full mb-6 ${userRole === 'cliente' ? 'cursor-pointer' : ''}`} onClick={onClick}>
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
        <h4 className="text-[10px] md:text-[12px] font-bold tracking-[0.2em] uppercase text-white mb-2 line-clamp-2 break-words w-full group-hover:text-gray-300 transition-colors">{producto.titulo}</h4>
        <span className="text-[10px] md:text-sm tracking-[0.1em] text-white font-light whitespace-nowrap mb-1 block">${producto.precio} USD</span>
        
        {!isRing && (
          <p className="text-[8px] tracking-[0.2em] text-gray-500 mb-4 uppercase">{producto.disponibilidad ? producto.disponibilidad : 'Bajo Pedido'}</p>
        )}

        {isRing && (
          <div className="flex flex-col items-center w-full mb-6 mt-4 z-30">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 w-full">
              {tallasDisponibles.map(talla => {
                const stock = parseInt(String(tallasObj[talla] || 0));
                const isAvailable = stock > 0;
                const isSelected = tallasSeleccionadas.includes(talla);
                
                return (
                  <div key={talla} className="flex flex-col items-center gap-1 sm:gap-1.5">
                    <button 
                      type="button"
                      onClick={(e) => { if (isAvailable) handleSelectTalla(e, talla); }}
                      className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center text-[10px] sm:text-[13px] tracking-[0.1em] transition-all duration-300 border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-pointer' : 'bg-black/50 text-white border-white/30 hover:border-white cursor-pointer') : 'border-red-500/20 text-red-500/50 bg-black/20 cursor-not-allowed'}`}
                    >
                      <span>{talla}</span>
                    </button>
                    <span className={`text-[9px] sm:text-[11px] tracking-[0.1em] uppercase leading-none mt-1 ${isAvailable ? 'text-gray-500' : 'text-red-500/40'}`}>
                      {stock}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mb-4 sm:mb-6 break-words uppercase w-full">{producto.descripcion}</p>

        {/* Acciones Cliente */}
        {userRole === 'cliente' && !producto.vendido && (
          <div className="flex flex-col sm:flex-row gap-2 mt-auto w-full z-30 justify-center">
             <button 
               onClick={(e) => { if(canBuy) agregarAlCarrito(producto, tallasSeleccionadas, e); }} 
               className={`w-full sm:flex-grow py-2 sm:py-3 text-[7px] sm:text-[8px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-all duration-300 cursor-pointer border-none outline-none rounded-sm ${canBuy ? 'bg-white text-black hover:bg-gray-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10'}`}
             >
               {canBuy ? 'COMPRAR' : 'ELIJA TALLA'}
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