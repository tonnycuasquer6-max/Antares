import { useState } from 'react';
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
    toggleFavorito, 
    favoritos, 
    parseTallasseguro, 
    tallasDisponibles 
  } = useShop();

  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<string[]>([]);

  const tallasObj = parseTallasseguro(producto.tallas);
  const isRing = producto.subcategoria === 'Anillos';
  const modalCanBuy = !isRing || tallasSeleccionadas.length > 0;

  const handleSelectTalla = (e: React.MouseEvent, talla: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTallasSeleccionadas(prev => 
      prev.includes(talla) ? prev.filter(t => t !== talla) : [...prev, talla]
    );
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    if (modalCanBuy) {
      agregarAlCarrito(producto, tallasSeleccionadas, e);
      // Opcional: Cerrar el modal después de añadir
      // onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-0 sm:p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="w-full h-full sm:h-auto max-w-xs sm:max-w-md md:max-w-3xl lg:max-w-4xl flex flex-col md:flex-row relative shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-y-auto sm:overflow-hidden rounded-none sm:rounded-sm items-stretch bg-black/40 border border-white/10 max-h-[100vh] sm:max-h-[90vh] md:max-h-[80vh]" 
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

        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center items-center text-center bg-black/60 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/10 m-0 relative">
          
          <h2 className="text-[12px] sm:text-[14px] md:text-[20px] font-bold tracking-[0.2em] uppercase text-white mb-2 drop-shadow-md w-full">
            {producto.titulo}
          </h2>
          
          <p className="text-[12px] sm:text-[14px] tracking-[0.1em] text-white font-light mb-6 sm:mb-8 drop-shadow-md">
            ${producto.precio} USD
          </p>
          
          {!isRing && (
            <p className="text-[10px] sm:text-[12px] tracking-[0.2em] text-gray-400 mb-6 sm:mb-8 uppercase drop-shadow-md">
              {producto.disponibilidad ? producto.disponibilidad : 'Bajo Pedido'}
            </p>
          )}

          {isRing ? (
            <div className="flex flex-col items-center w-full mb-8 sm:mb-10 mt-2">
              <p className="text-[8px] sm:text-[10px] tracking-[0.2em] text-gray-500 mb-4 sm:mb-6 uppercase">Seleccione su talla</p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 w-full">
                {tallasDisponibles.map(talla => {
                  const stock = parseInt(String(tallasObj[talla] || 0));
                  const isAvailable = stock > 0;
                  const isSelected = tallasSeleccionadas.includes(talla);
                  
                  return (
                    <div key={talla} className="flex flex-col items-center gap-1 sm:gap-2">
                      <button 
                        type="button"
                        onClick={(e) => { if(isAvailable) handleSelectTalla(e, talla); }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[10px] sm:text-[13px] tracking-[0.1em] transition-all duration-300 border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold scale-110 shadow-[0_0_15px_rgba(255,255,255,0.6)] cursor-pointer' : 'bg-black/50 text-white border-white/30 hover:border-white cursor-pointer') : 'border-red-500/20 text-red-500 bg-black/20 cursor-not-allowed'}`}
                      >
                        <span>{talla}</span>
                      </button>
                      <span className={`text-[10px] sm:text-[12px] tracking-[0.1em] uppercase leading-none mt-1 ${isAvailable ? 'text-gray-500' : 'text-red-500/50'}`}>
                        {stock}
                      </span>
                    </div>
                  );
                })}
              </div>

              {userRole === 'cliente' && !producto.vendido && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-8 sm:mt-12 w-full justify-center">
                  <button 
                    onClick={handleAddToCart} 
                    className={`w-full sm:flex-grow text-[8px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase py-3 sm:py-4 transition-all duration-300 cursor-pointer border-none outline-none ${modalCanBuy ? 'bg-white text-black hover:bg-gray-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/10'}`}
                  >
                    {modalCanBuy ? 'AÑADIR AL BOLSO' : 'ELIJA TALLA'}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }} 
                    className={`w-full sm:w-auto border py-3 sm:py-0 px-6 transition-colors cursor-pointer text-xs sm:text-sm bg-transparent outline-none flex items-center justify-center ${favoritos.includes(producto.id) ? 'border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-white/20 text-gray-400 hover:text-white hover:border-white/50'}`}
                  >
                    {favoritos.includes(producto.id) ? 'Quitar' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="w-12 h-px bg-white/20 mb-6 sm:mb-8 mx-auto"></div>
              <p className="text-[10px] text-gray-300 leading-loose mb-8 sm:mb-12 uppercase tracking-[0.1em] drop-shadow-sm break-words w-full">
                {producto.descripcion}
              </p>
              
              {userRole === 'cliente' && !producto.vendido ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-auto w-full justify-center">
                  <button 
                    onClick={handleAddToCart} 
                    className="w-full sm:flex-grow bg-white text-black text-[7px] sm:text-[8px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase py-3 sm:py-4 hover:bg-gray-300 transition-all duration-300 cursor-pointer border-none outline-none hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                  >
                    Añadir al Bolso
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }} 
                    className={`w-full sm:w-auto border py-3 sm:py-0 px-6 transition-colors cursor-pointer text-xs sm:text-sm bg-transparent outline-none flex items-center justify-center ${favoritos.includes(producto.id) ? 'border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-white/20 text-gray-400 hover:text-white hover:border-white/50'}`}
                  >
                    {favoritos.includes(producto.id) ? 'Quitar' : 'Guardar'}
                  </button>
                </div>
              ) : userRole === 'cliente' && (
                <div className="mt-auto py-3 sm:py-4 text-center border border-white/10 bg-black/40 w-full">
                  <span className="text-gray-400 tracking-[0.3em] sm:tracking-[0.4em] text-[7px] sm:text-[8px] font-bold uppercase">Pieza Agotada</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}