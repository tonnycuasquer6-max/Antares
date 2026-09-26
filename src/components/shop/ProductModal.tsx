import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShop } from '../../context/ShopContext';
import type { Product } from '../../types';

interface ProductModalProps {
  producto: Product;
  userRole: string;
  onClose: () => void;
}

export default function ProductModal({ producto, userRole, onClose }: ProductModalProps) {
  const { 
    agregarAlCarrito, 
    parseTallasseguro, 
    tallasDisponibles 
  } = useShop();

  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<string[]>([]);
  const [cantidadesPorTalla, setCantidadesPorTalla] = useState<Record<string, number>>({});
  const [cantidad, setCantidad] = useState(0);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const tallasObj = parseTallasseguro(producto.tallas);
  const isRing = producto.subcategoria === 'Anillos';
  const stockDisponible = Number.parseInt(String(producto.disponibilidad), 10);
  const cantidadTotalTallas = Object.values(cantidadesPorTalla).reduce((total, value) => total + value, 0);
  const cantidadMaxima = Number.isFinite(stockDisponible) && stockDisponible >= 0 ? stockDisponible : 99;
  const modalCanBuy = isRing ? cantidadTotalTallas > 0 : cantidad > 0;
  const textoBoton = isRing && tallasSeleccionadas.length === 0
    ? 'SELECCIONE TALLA'
    : cantidad === 0
      ? (isRing && cantidadTotalTallas > 0 ? 'AÑADIR AL BOLSO' : 'SELECCIONE CANTIDAD')
      : 'AÑADIR AL BOLSO';

  const handleSelectTalla = (e: React.MouseEvent, talla: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (tallasSeleccionadas.includes(talla)) {
      setTallasSeleccionadas(prev => prev.filter(size => size !== talla));
      setCantidadesPorTalla(prev => ({ ...prev, [talla]: 0 }));
      return;
    }
    setTallasSeleccionadas(prev => [...prev, talla]);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    if (!modalCanBuy) return;
    if (isRing) {
      const tallasConCantidad = tallasSeleccionadas.filter(talla => (cantidadesPorTalla[talla] || 0) > 0);
      agregarAlCarrito(producto, tallasConCantidad, e, cantidadTotalTallas, cantidadesPorTalla);
      return;
    }
    agregarAlCarrito(producto, tallasSeleccionadas, e, cantidad);
  };

  return createPortal((
    <div 
      className="fixed inset-0 z-[100] w-screen h-screen flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="glass-panel w-full h-full sm:h-auto max-w-xs sm:max-w-md md:max-w-3xl lg:max-w-4xl flex flex-col md:flex-row relative overflow-y-auto sm:overflow-hidden rounded-none sm:rounded-sm items-stretch max-h-[100vh] sm:max-h-[90vh] md:max-h-[80vh]" 
        onClick={e => e.stopPropagation()}
      >
        
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 z-[250] text-2xl sm:text-3xl cursor-pointer bg-black/50 sm:bg-transparent rounded-full sm:rounded-none w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center border-none outline-none transition-transform hover:scale-110"
        >
          ×
        </button>

        <div className="w-full md:w-1/2 p-0 m-0 bg-black/40 flex flex-col justify-center min-h-[300px] md:min-h-0 relative">
          <img 
            loading="lazy" 
            src={producto.imagen_url} 
            alt={producto.titulo} 
            className="w-full h-full object-cover sm:object-contain block m-0 p-0 opacity-90" 
          />
          {producto.vendido && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <span className="text-white tracking-[0.4em] text-[12px] md:text-sm font-bold uppercase border border-white/50 px-8 py-4 bg-black/80 shadow-2xl">Agotado</span>
            </div>
          )}
        </div>

        <div className="glass-panel w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center items-center text-center border-t md:border-t-0 md:border-l border-white/10 m-0 relative">
          
          <div className="w-full mb-6 sm:mb-8">
            <div className="flex justify-between items-center w-full gap-4">
              <h2 className="text-left text-[12px] sm:text-[14px] md:text-[20px] font-bold tracking-[0.2em] uppercase text-white drop-shadow-md min-w-0">
                {producto.titulo || "\u00A0"}
              </h2>
              <p className="text-right text-[12px] sm:text-[14px] tracking-[0.1em] text-white font-light drop-shadow-md shrink-0">
                ${producto.precio}
              </p>
            </div>
            {!isRing && Number.isFinite(stockDisponible) && stockDisponible >= 0 && (
              <p className="text-left text-[10px] sm:text-xs tracking-[0.1em] text-gray-400 mt-2">
                Stock: {stockDisponible}
              </p>
            )}
          </div>
          
          {showDescription ? (
            <div className="flex flex-col items-center w-full">
              <div className="w-12 h-px bg-white/20 mb-6 sm:mb-8 mx-auto"></div>
              <p className="text-[10px] text-gray-300 leading-loose mb-8 sm:mb-12 uppercase tracking-[0.1em] drop-shadow-sm break-words w-full">
                {producto.descripcion || "\u00A0"}
              </p>
              <button
                type="button"
                onClick={() => setShowDescription(false)}
                className="w-full border border-white/20 text-white hover:border-white/50 hover:bg-white/10 py-3 sm:py-4 text-[8px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-colors"
              >
                Volver a la compra
              </button>
            </div>
          ) : (
            <>
              {!isRing && (
                <div className="flex items-center gap-4 mb-6 sm:mb-8" aria-label="Seleccionar cantidad">
                  <button
                    type="button"
                    onClick={() => setCantidad(prev => Math.max(0, prev - 1))}
                    disabled={cantidad === 0}
                    aria-label="Reducir cantidad"
                    className="px-1 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-300 transition-colors"
                  >
                    -
                  </button>
                  <span className="min-w-6 text-center text-sm text-white" aria-live="polite">{cantidad}</span>
                  <button
                    type="button"
                    onClick={() => setCantidad(prev => Math.min(cantidadMaxima, prev + 1))}
                    disabled={cantidad >= cantidadMaxima}
                    aria-label="Aumentar cantidad"
                    className="px-1 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-300 transition-colors"
                  >
                    +
                  </button>
                </div>
              )}

              {isRing && (
                <div className="flex flex-col items-center w-full mb-8 sm:mb-10 mt-2">
                  <p className="text-[8px] sm:text-[10px] tracking-[0.2em] text-gray-500 mb-4 sm:mb-6 uppercase">Seleccione su talla</p>
                  <div className="grid grid-cols-4 justify-items-center gap-2 sm:gap-4 w-full">
                    {tallasDisponibles.map(talla => {
                      const stock = parseInt(String(tallasObj[talla] || 0));
                      const isAvailable = stock > 0;
                      const isSelected = tallasSeleccionadas.includes(talla);

                      return (
                        <div key={talla} className="flex flex-col items-center gap-1 sm:gap-2">
                          <button
                            type="button"
                            onClick={(e) => { if (isAvailable) handleSelectTalla(e, talla); }}
                            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[10px] sm:text-[13px] tracking-[0.1em] transition-all duration-300 border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold scale-110 shadow-[0_0_15px_rgba(255,255,255,0.6)] cursor-pointer' : 'bg-black/50 text-white border-white/30 hover:border-white cursor-pointer') : 'border-gray-800 text-gray-500 bg-black/20 opacity-50 cursor-not-allowed'}`}
                          >
                            <span>{talla}</span>
                          </button>
                          <span className={`text-[10px] sm:text-[12px] tracking-[0.1em] uppercase leading-none mt-1 ${isAvailable ? 'text-gray-500' : 'text-gray-600 opacity-50'}`}>
                            {stock}
                          </span>
                          <div className="flex items-center justify-center gap-1 mt-1" aria-label={`Cantidad para talla ${talla}`}>
                            <button
                              type="button"
                              onClick={() => setCantidadesPorTalla(prev => ({ ...prev, [talla]: Math.max(0, (prev[talla] || 0) - 1) }))}
                              disabled={!isSelected || (cantidadesPorTalla[talla] || 0) === 0}
                              aria-label={`Reducir cantidad talla ${talla}`}
                              className="px-1 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-300 transition-colors"
                            >
                              -
                            </button>
                            <span className="min-w-4 text-center text-[10px] text-white" aria-live="polite">{cantidadesPorTalla[talla] || 0}</span>
                            <button
                              type="button"
                              onClick={() => setCantidadesPorTalla(prev => ({ ...prev, [talla]: Math.min(stock, (prev[talla] || 0) + 1) }))}
                              disabled={!isSelected || (cantidadesPorTalla[talla] || 0) >= stock}
                              aria-label={`Aumentar cantidad talla ${talla}`}
                              className="px-1 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-300 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={`grid gap-4 w-full ${userRole === 'cliente' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {userRole === 'cliente' && !producto.vendido && (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!modalCanBuy}
                    className={`h-12 w-full text-[8px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-all duration-300 border-none outline-none ${modalCanBuy ? 'bg-white text-black hover:bg-gray-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer' : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10'}`}
                  >
                    {textoBoton}
                  </button>
                )}

                {userRole === 'cliente' && producto.vendido && (
                  <div className="h-12 flex items-center justify-center border border-white/10 bg-black/40 w-full">
                    <span className="text-gray-400 tracking-[0.3em] sm:tracking-[0.4em] text-[7px] sm:text-[8px] font-bold uppercase">Pieza Agotada</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowDescription(true)}
                  className="h-12 w-full border border-white/20 text-gray-300 hover:text-white hover:border-white/50 hover:bg-white/10 text-[8px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-colors"
                >
                  Descripción
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  ), document.body);
}