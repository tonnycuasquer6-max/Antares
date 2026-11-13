import { getMockupUrl, tallasDisponibles, coloresPredeterminados, subcategoriasJoyeria, parseTallasseguro } from '../utils/constants';
import { optimizeCloudinaryUrl } from '../utils/imageOptimization';

export default function CategoryView({ store }: { store: any }) {
  const {
    activeCategory, activeSubCategory, setActiveSubCategory,
    customVista, setCustomView, setSizeOffset, setYOffset,
    customRenderedImage, customPrenda, setCustomPrenda, customColor, setCustomColor,
    procesarInsigniaLogotipo, isRemovingBg, customLogo, customPlacement, setCustomPlacement,
    getCalculatedPrice, handleCustomAddToCart,
    filtroColor, setFiltroColor, filtroTalla, setFiltroTalla, ordenPrecio, setOrdenPrecio,
    openFilter, setOpenFilter, userRole, showInlineForm, setEditandoId, setNuevaPieza,
    setShowInlineForm, editandoId, cerrarFormulario, nuevaPieza, handlePublicarLocal,
    openFormSelect, setOpenFormSelect, productosMostrar, setProductoSeleccionado,
    tallasSeleccionadas, handleSelectTalla, agregarAlCarrito, favoritos, toggleFavorito,
    handleToggleVendidoAdmin, handleBorrarLocal, prepararEdicion
  } = store;

  const renderProductoCard = (producto: any) => {
    const tallasObj = parseTallasseguro(producto.tallas);
    const isRing = producto.subcategoria === 'Anillos';
    const selectedSizes = tallasSeleccionadas[producto.id] || [];
    const canBuy = !isRing || selectedSizes.length > 0;

    return (
      <div key={producto.id} className="product-card group relative bg-black flex flex-col p-4 sm:p-6 border-b border-r border-white/20">
        <div className="absolute -bottom-[10px] -right-[10px] w-5 h-5 bg-black z-20 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z"/></svg>
        </div>
        <div className={`product-image-container overflow-hidden aspect-square relative w-full mb-6 ${userRole === 'cliente' ? 'cursor-pointer' : ''}`} onClick={() => { if(userRole === 'cliente') setProductoSeleccionado(producto); }}>
          <img loading="lazy" decoding="async" src={optimizeCloudinaryUrl(producto.imagen_url, 600)} alt={producto.titulo} className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-all duration-700 will-change-opacity" />
          {producto.vendido && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <span className="text-white tracking-[0.4em] text-[10px] md:text-xs font-bold uppercase border border-white/50 px-4 py-2 bg-black/60">Agotado</span>
            </div>
          )}
          {userRole === 'admin' && (
            <div className="absolute top-2 right-2 md:top-4 md:right-4 flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20">
              <button onClick={(e) => { e.stopPropagation(); prepararEdicion(producto); }} className="bg-black/80 backdrop-blur-md p-2 text-white border border-white/10 rounded-full cursor-pointer hover:text-white/80"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
              <button onClick={(e) => { e.stopPropagation(); handleBorrarLocal(producto.id); }} className="bg-black/80 backdrop-blur-md p-2 text-white border border-white/10 rounded-full cursor-pointer hover:text-red-500"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col flex-grow items-center text-center w-full z-10 relative">
          <h4 className="text-[10px] md:text-[12px] font-bold tracking-[0.2em] uppercase text-white mb-2 line-clamp-2 break-words w-full">{producto.titulo}</h4>
          <span className="text-[10px] md:text-sm tracking-[0.1em] text-white font-light whitespace-nowrap mb-1 block">${producto.precio} USD</span>
          
          {!isRing && (
            <p className="text-[8px] tracking-[0.2em] text-gray-400 mb-4 uppercase">{producto.disponibilidad ? producto.disponibilidad : 'Bajo Pedido'}</p>
          )}

          {isRing && (
            <div className="flex flex-col items-center w-full mb-6 mt-4 z-30">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 w-full">
                {tallasDisponibles.map(talla => {
                  const stock = parseInt(tallasObj[talla] || 0);
                  const isAvailable = stock > 0;
                  const isSelected = selectedSizes.includes(talla);
                  
                  return (
                    <div key={talla} className="flex flex-col items-center gap-1 sm:gap-1.5">
                      <button 
                        type="button"
                        onClick={(e) => { 
                          if (isAvailable) handleSelectTalla(e, producto.id, talla); 
                        }}
                        className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center text-[10px] sm:text-[13px] tracking-[0.1em] transition-all duration-300 border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold scale-110 cursor-pointer' : 'bg-transparent text-white border-white/30 hover:border-white cursor-pointer') : 'border-red-500/20 text-red-500 cursor-not-allowed'}`}
                      >
                        <span>{talla}</span>
                      </button>
                      <span className={`text-[10px] sm:text-[12px] tracking-[0.1em] uppercase leading-none mt-1 ${isAvailable ? 'text-gray-400' : 'text-red-500/70'}`}>
                        {stock}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <p className="text-[10px] text-white line-clamp-2 leading-relaxed mb-4 sm:mb-6 break-words uppercase w-full drop-shadow-md">{producto.descripcion}</p>

          {userRole === 'cliente' && !producto.vendido && (
            <div className="flex flex-col sm:flex-row gap-2 mt-auto w-full z-30 justify-center">
               <button 
                 onClick={(e) => { e.stopPropagation(); if(canBuy) agregarAlCarrito(producto, e); }} 
                 className={`w-full sm:flex-grow py-2 sm:py-3 text-[7px] sm:text-[8px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-colors cursor-pointer border-none outline-none rounded-sm ${canBuy ? 'bg-white text-black hover:bg-gray-300' : 'bg-white/20 text-gray-400 cursor-not-allowed'}`}
               >
                 {canBuy ? 'COMPRAR' : 'ELIJA TALLA'}
               </button>
               <button onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }} className="w-full sm:w-auto px-4 md:px-5 py-2 md:py-3 border border-white/20 text-white hover:bg-white/10 transition-colors cursor-pointer text-xs sm:text-sm flex items-center justify-center bg-transparent outline-none rounded-sm">{favoritos.includes(producto.id) ? '♥' : '♡'}</button>
            </div>
          )}

          {userRole === 'admin' && (
            <button onClick={(e) => handleToggleVendidoAdmin(e, producto)} className={`w-full py-2 sm:py-2.5 mt-auto text-[8px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase transition-colors cursor-pointer border outline-none rounded-sm z-30 ${producto.vendido ? 'bg-transparent text-gray-500 border-gray-800 hover:text-white hover:border-white' : 'bg-white text-black border-white hover:bg-gray-300'}`}>{producto.vendido ? 'Desmarcar Venta' : 'Marcar como Vendida'}</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* PRÊT-À-PORTER */}
      {activeCategory === 'Prêt-à-Porter' && (
        <section className="container mx-auto py-8 md:py-16 flex-grow animate-fade-in w-full max-w-7xl">
          <h2 className="text-[10px] md:text-[14px] tracking-[0.3em] uppercase text-white mb-8 sm:mb-12 text-center border-b border-white/10 pb-4 sm:pb-6 break-words">Prêt-à-Porter Personalizado</h2>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-start w-full">
             <div className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-none lg:w-1/2 flex flex-col gap-4">
                 <div className="flex justify-center gap-2 sm:gap-4 mb-2">
                   <button type="button" onClick={() => { setCustomView('frente'); setSizeOffset(0); setYOffset(0); }} className={`px-4 sm:px-6 py-2 text-[8px] sm:text-[10px] tracking-[0.2em] uppercase transition-colors outline-none cursor-pointer border flex-1 sm:flex-none ${customVista === 'frente' ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-gray-500 hover:text-white'}`}>Frente</button>
                   <button type="button" onClick={() => { setCustomView('espalda'); setSizeOffset(0); setYOffset(0); }} className={`px-4 sm:px-6 py-2 text-[8px] sm:text-[10px] tracking-[0.2em] uppercase transition-colors outline-none cursor-pointer border flex-1 sm:flex-none ${customVista === 'espalda' ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-gray-500 hover:text-white'}`}>Espalda</button>
                 </div>
                 <div className="w-full relative bg-transparent backdrop-blur-[30px] aspect-[3/4] flex items-center justify-center overflow-hidden group shadow-2xl border-none mx-auto">
                   <img loading="lazy" decoding="async" src={optimizeCloudinaryUrl(customRenderedImage || getMockupUrl(customPrenda, customVista), 800)} alt="Renderizado Prêt-à-Porter" className="w-full h-full object-contain z-10 transition-opacity duration-300" />
                   {!customRenderedImage && <p className="absolute text-[8px] sm:text-[10px] text-gray-600 uppercase tracking-[0.2em] z-50 text-center px-4">Cargando Lienzo...</p>}
                 </div>
             </div>
             <div className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-none lg:w-1/2 flex flex-col gap-8 lg:gap-10">
               <div className="flex flex-col gap-3 sm:gap-4">
                 <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left">1. Seleccione la Prenda</p>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 w-full">
                   {['Camiseta', 'Buso', 'Hoodie', 'Capucha'].map(prenda => (
                     <button key={prenda} type="button" onClick={() => setCustomPrenda(prenda)} className={`py-3 px-2 text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPrenda === prenda ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/20 hover:text-white hover:border-white/50'}`}>
                       {prenda}
                     </button>
                   ))}
                 </div>
               </div>
               <div className="flex flex-col gap-3 sm:gap-4">
                 <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left">2. Tono de Prenda</p>
                 <div className="flex gap-3 sm:gap-4 flex-wrap items-center justify-center lg:justify-start">
                   {coloresPredeterminados.map(color => (
                     <div key={color.name} onClick={() => setCustomColor(color.hex)} className={`w-8 h-8 sm:w-10 sm:h-10 cursor-pointer rounded-full border-2 transition-transform ${customColor === color.hex ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: color.hex, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} title={color.name} />
                   ))}
                   <label className={`relative w-8 h-8 sm:w-10 sm:h-10 cursor-pointer rounded-full border-2 transition-transform flex items-center justify-center overflow-hidden ${!coloresPredeterminados.map(c=>c.hex).includes(customColor) ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`} style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} title="Elegir otro color">
                     <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="absolute opacity-0 w-full h-full cursor-pointer" />
                   </label>
                 </div>
               </div>
               <div className="flex flex-col gap-3 sm:gap-4">
                 <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left">3. Insignia Personal</p>
                 <div className="flex flex-col gap-2 w-full">
                   <input type="file" accept="image/*" onChange={procesarInsigniaLogotipo} className="text-[8px] sm:text-[10px] text-gray-500 file:mr-2 sm:file:mr-4 file:py-2 sm:file:py-3 file:px-4 sm:file:px-6 file:border file:border-gray-500 hover:file:border-white file:tracking-[0.1em] sm:file:tracking-[0.2em] file:uppercase file:bg-transparent file:text-gray-500 hover:file:text-white transition-colors cursor-pointer w-full" />
                   {isRemovingBg && <p className="text-[7px] sm:text-[8px] text-blue-400 tracking-[0.1em] uppercase animate-pulse mt-1 sm:mt-2 text-center lg:text-left">Procesando transparencia y renderizando...</p>}
                 </div>
               </div>
               {customLogo && (
                 <div className="flex flex-col gap-4 animate-fade-in w-full">
                   <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left">4. Ubicación ({customVista})</p>
                   <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full">
                     {customVista === 'frente' ? (
                       <>
                         <button type="button" onClick={() => { setCustomPlacement('pecho-izq'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPlacement === 'pecho-izq' ? 'bg-white/10 text-white border-white/30' : 'bg-transparent text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Pecho Izquierdo</button>
                         <button type="button" onClick={() => { setCustomPlacement('pecho-der'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPlacement === 'pecho-der' ? 'bg-white/10 text-white border-white/30' : 'bg-transparent text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Pecho Derecho</button>
                         <button type="button" onClick={() => { setCustomPlacement('pecho-sup-centro'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border col-span-2 w-full ${customPlacement === 'pecho-sup-centro' ? 'bg-white/10 text-white border-white/30' : 'bg-transparent text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Pecho Sup. Centro</button>
                         <button type="button" onClick={() => { setCustomPlacement('centro-pecho'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border col-span-2 w-full ${customPlacement === 'centro-pecho' ? 'bg-white/10 text-white border-white/30' : 'bg-transparent text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Centro Pecho</button>
                       </>
                     ) : (
                       <>
                         <button type="button" onClick={() => { setCustomPlacement('espalda-sup'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPlacement === 'espalda-sup' ? 'bg-white/10 text-white border-white/30' : 'bg-transparent text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Espalda Superior</button>
                         <button type="button" onClick={() => { setCustomPlacement('espalda-centro'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPlacement === 'espalda-centro' ? 'bg-white/10 text-white border-white/30' : 'bg-transparent text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Centro Espalda</button>
                       </>
                     )}
                   </div>
                   <div className="flex flex-col gap-3 sm:gap-4 mt-2 w-full">
                     <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left">5. Ajuste Fino</p>
                     <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8 w-full">
                       <div className="flex flex-col items-center gap-2">
                         <span className="text-[7px] sm:text-[8px] text-gray-400 tracking-[0.1em] uppercase">Tamaño</span>
                         <div className="flex gap-2">
                           <button type="button" onClick={() => setSizeOffset((size: number) => size - 5)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-transparent border border-white/20 text-white hover:bg-white/10 cursor-pointer text-base sm:text-lg font-bold outline-none">-</button>
                           <button type="button" onClick={() => setSizeOffset((size: number) => size + 5)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-transparent border border-white/20 text-white hover:bg-white/10 cursor-pointer text-base sm:text-lg font-bold outline-none">+</button>
                         </div>
                       </div>
                       <div className="flex flex-col items-center gap-2">
                         <span className="text-[7px] sm:text-[8px] text-gray-400 tracking-[0.1em] uppercase">Posición Vertical</span>
                         <div className="flex gap-2">
                           <button type="button" onClick={() => setYOffset((offset: number) => offset - 5)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-transparent border border-white/20 text-white hover:bg-white/10 cursor-pointer text-xs sm:text-sm font-bold outline-none">▲</button>
                           <button type="button" onClick={() => setYOffset((offset: number) => offset + 5)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-transparent border border-white/20 text-white hover:bg-white/10 cursor-pointer text-xs sm:text-sm font-bold outline-none">▼</button>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
               <div className="mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-white/10 flex flex-col gap-4 sm:gap-6 w-full">
                 <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-2 sm:gap-0 w-full">
                    <span className="text-[12px] sm:text-[14px] text-white tracking-[0.2em] font-light">VALOR A MEDIDA</span>
                    <span className="text-[16px] sm:text-[18px] text-white font-bold tracking-[0.1em]">${getCalculatedPrice()} USD</span>
                 </div>
                 <button onClick={handleCustomAddToCart} className="w-full bg-white text-black text-[8px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase py-4 sm:py-5 hover:bg-gray-200 transition-colors cursor-pointer outline-none border-none shadow-xl">
                   Añadir Diseño al Bolso
                 </button>
               </div>
             </div>
          </div>
        </section>
      )}

      {/* OTRAS CATEGORIAS NORMALES (INCLUIDO SARTORIAL) */}
      {activeCategory !== 'Prêt-à-Porter' && (
        <section className="container mx-auto py-8 md:py-16 flex-grow animate-fade-in w-full max-w-7xl">
           <h2 className="text-[10px] md:text-[14px] tracking-[0.3em] uppercase text-white mb-8 md:mb-12 text-center border-b border-white/10 pb-4 md:pb-6 break-words">{activeCategory}</h2>
           {['Acero Fino', 'Plata de Ley 925'].includes(activeCategory) && (
             <ul className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-12 mb-6 border-b border-white/10 pb-6">
               {subcategoriasJoyeria.map(sub => (
                 <li key={sub} onClick={() => setActiveSubCategory(sub)} className={`text-[8px] sm:text-[10px] tracking-[0.2em] uppercase cursor-pointer transition-colors ${activeSubCategory === sub ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
                   {sub}
                 </li>
               ))}
             </ul>
           )}

           {activeCategory === 'Acero Fino' && (
             <div className="w-full max-w-3xl mx-auto mb-8 sm:mb-10 flex flex-col items-center relative z-[150]">
                <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold mb-4 sm:mb-6 uppercase">Ordenar Por</p>
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-16 w-full text-[8px] sm:text-[10px] md:text-[11px] tracking-[0.2em] uppercase">
                   <div className="relative group cursor-pointer pb-2" onMouseLeave={() => setOpenFilter(null)}>
                      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenFilter(openFilter === 'color' ? null : 'color'); }} className={`transition-colors ${filtroColor !== 'Todo' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white'}`}>
                        Color: {filtroColor === 'Todo' ? 'Todos' : filtroColor}
                      </div>
                      {openFilter === 'color' && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[200] min-w-[120px] sm:min-w-[140px]">
                           <div className="bg-transparent backdrop-blur-[30px] w-full flex flex-col items-center gap-3 sm:gap-4 py-3 sm:py-4 shadow-none border-none">
                             {['Todo', 'Silver', 'Gold', 'Black'].map(opt => (
                               <span key={opt} onClick={(e) => { e.stopPropagation(); setFiltroColor(opt); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 ${filtroColor === opt ? 'text-white' : 'text-gray-500 hover:text-white'}`}>
                                 {opt === 'Todo' ? 'Todos' : opt}
                               </span>
                             ))}
                           </div>
                        </div>
                      )}
                   </div>
                   
                   {['Todo', 'Anillos'].includes(activeSubCategory) && (
                     <div className="relative group cursor-pointer pb-2" onMouseLeave={() => setOpenFilter(null)}>
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenFilter(openFilter === 'talla' ? null : 'talla'); }} className={`transition-colors ${filtroTalla !== 'Todo' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white'}`}>
                          Talla: {filtroTalla === 'Todo' ? 'Todas' : filtroTalla}
                        </div>
                        {openFilter === 'talla' && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[200] min-w-[120px] sm:min-w-[140px]">
                             <div className="bg-transparent backdrop-blur-[30px] w-full flex flex-col items-center gap-3 sm:gap-4 py-3 sm:py-4 shadow-none border-none max-h-64 overflow-y-auto">
                               <span onClick={(e) => { e.stopPropagation(); setFiltroTalla('Todo'); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 ${filtroTalla === 'Todo' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>Todas</span>
                               {tallasDisponibles.map(t => (
                                 <span key={t} onClick={(e) => { e.stopPropagation(); setFiltroTalla(t); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 ${filtroTalla === t ? 'text-white' : 'text-gray-500 hover:text-white'}`}>
                                   {t}
                                 </span>
                               ))}
                             </div>
                          </div>
                        )}
                     </div>
                   )}

                   <div className="relative group cursor-pointer pb-2" onMouseLeave={() => setOpenFilter(null)}>
                      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenFilter(openFilter === 'precio' ? null : 'precio'); }} className={`transition-colors ${ordenPrecio !== '' ? 'text-white border-b border-white' : 'text-gray-500 hover:text-white'}`}>
                        Precio: {ordenPrecio === '' ? 'Normal' : (ordenPrecio === 'Asc' ? 'Menor a Mayor' : 'Mayor a Menor')}
                      </div>
                      {openFilter === 'precio' && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[200] min-w-[140px] sm:min-w-[160px]">
                           <div className="bg-transparent backdrop-blur-[30px] w-full flex flex-col items-center gap-3 sm:gap-4 py-3 sm:py-4 shadow-none border-none">
                             <span onClick={(e) => { e.stopPropagation(); setOrdenPrecio(''); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 ${ordenPrecio === '' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>Normal</span>
                             <span onClick={(e) => { e.stopPropagation(); setOrdenPrecio('Asc'); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 ${ordenPrecio === 'Asc' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>Menor a Mayor</span>
                             <span onClick={(e) => { e.stopPropagation(); setOrdenPrecio('Desc'); setOpenFilter(null); }} className={`cursor-pointer transition-colors w-full text-center py-2 ${ordenPrecio === 'Desc' ? 'text-white' : 'text-gray-500 hover:text-white'}`}>Mayor a Menor</span>
                           </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
           )}

           {/* MANTENEMOS EL FORMULARIO INLINE POR SI NECESITAS EDITAR UNA PIEZA EXISTENTE */}
           {userRole === 'admin' && !showInlineForm && (
             <div onClick={() => { setEditandoId(null); setNuevaPieza({titulo: '', descripcion: '', costo: '', precio: '', disponibilidad: '', subcategoria: activeSubCategory !== 'Todo' ? activeSubCategory : '', tallas: {}, color: '', imagen: null, imagen_url: '' }); setShowInlineForm(true); }} className="mb-6 sm:mb-8 md:mb-12 border border-dashed border-white/20 py-4 sm:py-6 md:py-8 text-center hover:bg-white/5 transition-colors cursor-pointer w-full">
               <span className="text-white tracking-[0.2em] text-[8px] sm:text-[10px] uppercase">+ Añadir/Editar pieza rápida en {activeCategory}</span>
             </div>
           )}

           {userRole === 'admin' && showInlineForm && (
             <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-md animate-fade-in sm:p-4">
               <form onSubmit={handlePublicarLocal} className="bg-white/10 backdrop-blur-3xl p-6 md:p-10 shadow-2xl relative w-full max-w-4xl rounded-sm border border-white/10 max-h-[90vh] overflow-y-auto m-auto">
                 <button type="button" onClick={cerrarFormulario} className="absolute top-4 right-6 text-gray-500 hover:text-white text-3xl cursor-pointer bg-transparent border-none outline-none z-50">×</button>
                 <h3 className="text-[10px] md:text-sm tracking-[0.3em] uppercase text-white mb-6 text-center drop-shadow-md">{editandoId ? 'EDITAR PIEZA' : 'DETALLES DE LA PIEZA RÁPIDA'}</h3>
                 
                 {(nuevaPieza.imagen || nuevaPieza.imagen_url) && (
                   <div className="mb-6 flex justify-center bg-transparent p-0">
                     <img loading="lazy" decoding="async" src={optimizeCloudinaryUrl(nuevaPieza.imagen ? URL.createObjectURL(nuevaPieza.imagen) : nuevaPieza.imagen_url, 600)} alt="Vista previa" className="h-40 md:h-64 w-auto object-contain drop-shadow-2xl" />
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6 text-center items-center justify-items-center w-full">
                   <input type="text" value={nuevaPieza.titulo} onChange={e => setNuevaPieza({...nuevaPieza, titulo: e.target.value})} placeholder="TÍTULO DE LA OBRA" className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-500 text-center hover:border-white/50 transition-colors" required />
                   
                   <div className="w-full relative">
                     <input type="number" value={nuevaPieza.costo} onChange={e => setNuevaPieza({...nuevaPieza, costo: e.target.value})} placeholder="COSTO FABRICACIÓN (USD)" className="w-full bg-transparent border-b border-white/20 text-white/70 text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-600 text-center hover:border-white/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                   </div>

                   <input type="number" value={nuevaPieza.precio} onChange={e => setNuevaPieza({...nuevaPieza, precio: e.target.value})} placeholder="PRECIO VENTA (USD)" className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-400 text-center hover:border-white/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-champagne" required />
                   
                   {nuevaPieza.subcategoria !== 'Anillos' && (
                     <input type="text" value={nuevaPieza.disponibilidad} onChange={e => setNuevaPieza({...nuevaPieza, disponibilidad: e.target.value})} placeholder="DISPONIBILIDAD (EJ: 5 EN STOCK)" className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-400 text-center hover:border-white/50 transition-colors" />
                   )}
                   
                   {['Acero Fino', 'Plata de Ley 925'].includes(activeCategory) && (
                     <div className="relative w-full z-[160]" onMouseLeave={() => setOpenFormSelect(null)}>
                       <div 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenFormSelect(openFormSelect === 'subcat' ? null : 'subcat'); }} 
                         className="w-full bg-transparent border-b border-white/20 text-gray-500 hover:text-white text-[10px] md:text-xs tracking-[0.2em] py-2 cursor-pointer text-center transition-colors uppercase"
                       >
                         {nuevaPieza.subcategoria || 'TIPO DE JOYA (OPCIONAL)'}
                       </div>
                       {openFormSelect === 'subcat' && (
                         <div className="absolute top-full left-0 w-full pt-1 z-[300]">
                           <div className="bg-black/90 backdrop-blur-[30px] flex flex-col gap-4 py-4 shadow-2xl border border-white/10 rounded-sm max-h-48 overflow-y-auto">
                             <div onClick={(e) => { e.stopPropagation(); setNuevaPieza({...nuevaPieza, subcategoria: '', tallas: {}}); setOpenFormSelect(null); }} className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 hover:text-white cursor-pointer text-center transition-colors uppercase py-2">NINGUNO</div>
                             {subcategoriasJoyeria.filter(s => s !== 'Todo').map(sub => (
                               <div key={sub} onClick={(e) => { e.stopPropagation(); setNuevaPieza({...nuevaPieza, subcategoria: sub, tallas: {}}); setOpenFormSelect(null); }} className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 hover:text-white cursor-pointer text-center transition-colors uppercase py-2">{sub}</div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   )}

                   {activeCategory === 'Acero Fino' && (
                     <div className="relative w-full z-[150]" onMouseLeave={() => setOpenFormSelect(null)}>
                       <div 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenFormSelect(openFormSelect === 'color' ? null : 'color'); }} 
                         className="w-full bg-transparent border-b border-white/20 text-gray-500 hover:text-white text-[10px] md:text-xs tracking-[0.2em] py-2 cursor-pointer text-center transition-colors uppercase"
                       >
                         {nuevaPieza.color || 'COLOR (OPCIONAL)'}
                       </div>
                       {openFormSelect === 'color' && (
                         <div className="absolute top-full left-0 w-full pt-1 z-[300]">
                           <div className="bg-black/90 backdrop-blur-[30px] flex flex-col gap-4 py-4 shadow-2xl border border-white/10 rounded-sm">
                             <div onClick={(e) => { e.stopPropagation(); setNuevaPieza({...nuevaPieza, color: ''}); setOpenFormSelect(null); }} className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 hover:text-white cursor-pointer text-center transition-colors uppercase py-2">NINGUNO</div>
                             {['Silver', 'Gold', 'Black'].map(c => (
                               <div key={c} onClick={(e) => { e.stopPropagation(); setNuevaPieza({...nuevaPieza, color: c}); setOpenFormSelect(null); }} className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 hover:text-white cursor-pointer text-center transition-colors uppercase py-2">{c}</div>
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
                           <button key={porcentaje} type="button" onClick={() => setNuevaPieza({...nuevaPieza, precio: sugerido.toFixed(2)})} className="bg-transparent text-gray-500 hover:text-white transition-colors cursor-pointer outline-none border border-gray-500 hover:border-white px-4 py-2 font-champagne">{porcentaje}%: ${sugerido.toFixed(2)}</button>
                         );
                       })}
                     </div>
                   </div>
                 )}

                 {nuevaPieza.subcategoria === 'Anillos' && (
                   <div className="w-full flex flex-col items-center mt-4 mb-8 pb-6">
                     <p className="text-[10px] md:text-xs tracking-[0.2em] text-gray-300 mb-6 uppercase drop-shadow-md">Inventario por talla:</p>
                     <div className="flex gap-4 md:gap-8 flex-wrap justify-center">
                       {tallasDisponibles.map(talla => (
                         <div key={talla} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => { const current = parseInt(nuevaPieza.tallas[talla]) || 0; setNuevaPieza({...nuevaPieza, tallas: { ...nuevaPieza.tallas, [talla]: current + 1 }}); }}>
                           <span className="text-white text-[12px] md:text-sm font-light font-champagne">{talla}</span>
                           <input type="number" min="0" value={nuevaPieza.tallas[talla] || ''} onChange={(e) => setNuevaPieza({...nuevaPieza, tallas: { ...nuevaPieza.tallas, [talla]: e.target.value }})} onClick={(e) => e.stopPropagation()} placeholder="0" className="w-10 bg-transparent text-white text-center text-[10px] md:text-xs py-1 outline-none border-b border-white/20 placeholder-gray-500 transition-colors focus:border-white/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none m-0 font-champagne" />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 <textarea value={nuevaPieza.descripcion} onChange={e => setNuevaPieza({...nuevaPieza, descripcion: e.target.value})} placeholder="DESCRIPCIÓN EDITORIAL..." rows={3} className="w-full bg-transparent border-b border-white/20 text-white text-[10px] md:text-xs tracking-[0.2em] py-2 outline-none placeholder-gray-500 text-center hover:border-white/50 transition-colors mb-8 resize-none"></textarea>
                 
                 <div className="flex flex-col md:flex-row items-center justify-center gap-10 bg-transparent p-0 w-full">
                   <input type="file" onChange={e => setNuevaPieza({...nuevaPieza, imagen: e.target.files?.[0] || null})} className="text-[10px] md:text-xs text-gray-500 file:mr-4 file:py-2 file:px-6 file:border file:border-gray-500 hover:file:border-white file:tracking-[0.2em] file:uppercase file:bg-transparent file:text-gray-500 hover:file:text-white transition-colors cursor-pointer w-full md:w-auto" />
                   <button type="submit" className="bg-white text-black hover:bg-gray-200 transition-colors cursor-pointer outline-none border-none text-[9px] md:text-[10px] font-bold tracking-[0.3em] uppercase px-12 py-4 w-full md:w-auto shadow-xl">{editandoId ? 'Guardar Cambios' : 'Publicar Pieza'}</button>
                 </div>
               </form>
             </div>
           )}

           {/* REJILLA DE PRODUCTOS CON NUEVAS CLASES CSS DE ZOOM Y SOMBRA BLANCA */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full border-t border-l border-white/20 mt-8">
             {productosMostrar.map((producto: any) => renderProductoCard(producto))}
             {productosMostrar.length === 0 && (
                <p className="text-gray-500 tracking-[0.2em] uppercase text-[10px] col-span-full text-center py-10 w-full border-b border-r border-white/20">No hay piezas en esta categoría aún.</p>
             )}
           </div>
        </section>
      )}
    </>
  );
}