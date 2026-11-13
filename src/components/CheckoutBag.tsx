import { sectoresQuito } from '../utils/constants';
import { optimizeCloudinaryUrl } from '../utils/imageOptimization';

export default function CheckoutBag({ store }: { store: any }) {
  const {
    carrito, setCarrito, checkoutPaso, setCheckoutPaso, updateCantidad, 
    envioConfig, setEnvioConfig, subtotalCarrito, handleContinuarCheckout,
    metodoPagoSeleccionado, setMetodoPagoSeleccionado, comprobantePago,
    setComprobantePago, enviarPedidoWhatsApp, isUploading, openFormSelect,
    setOpenFormSelect
  } = store;

  return (
    <section className="container mx-auto px-2 md:px-4 py-8 md:py-16 flex-grow animate-fade-in w-full max-w-4xl">
      <h2 className="text-[14px] tracking-[0.3em] uppercase text-white mb-12 text-center border-b border-white/10 pb-4 md:pb-6">Su Selección</h2>
      
      {carrito.length === 0 ? (
        <p className="text-gray-500 tracking-[0.2em] uppercase text-[12px] text-center py-10">Su bolso está vacío en este momento.</p>
      ) : (
        <div className="bg-white/5 backdrop-blur-3xl p-4 md:p-10 shadow-2xl relative border border-none">
          
          {checkoutPaso === 1 && (
            <>
              <h3 className="text-[8px] tracking-[0.4em] uppercase text-gray-400 mb-6 md:mb-10 text-center">Detalle de su Pedido</h3>
              {carrito.map((item: any) => (
                <div key={item.id + (item.tallaSeleccionada || '')} className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 py-4 md:py-6 border-b border-white/5 relative">
                  <button onClick={() => setCarrito(carrito.filter((p: any) => !(p.id === item.id && p.tallaSeleccionada === item.tallaSeleccionada)))} className="absolute top-2 right-0 text-gray-500 hover:text-red-500 text-xl cursor-pointer bg-transparent border-none outline-none sm:pl-4">×</button>
                  <img loading="lazy" decoding="async" src={optimizeCloudinaryUrl(item.imagen_url, 200)} alt={item.titulo} className="w-24 h-24 object-contain bg-black/20" />
                  <div className="flex-grow text-center sm:text-left w-full sm:w-auto">
                    <h4 className="text-[10px] tracking-[0.2em] uppercase text-white mb-1 line-clamp-2 break-words">{item.titulo}</h4>
                    <p className="text-[8px] tracking-[0.1em] text-gray-500 uppercase line-clamp-1 mb-2">
                      {item.categoria} {item.subcategoria === 'Anillos' && item.tallaSeleccionada ? ` | Talla: ${item.tallaSeleccionada}` : ''}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                      <button onClick={() => updateCantidad(item.id, item.tallaSeleccionada, -1)} className="text-white border border-white/20 w-6 h-6 flex items-center justify-center hover:bg-white/10 cursor-pointer bg-transparent outline-none">-</button>
                      <span className="text-[10px] text-white w-4 text-center">{item.cantidad || 1}</span>
                      <button onClick={() => updateCantidad(item.id, item.tallaSeleccionada, 1)} disabled={(item.cantidad || 1) >= (item.stockMaximo || 1)} className={`text-white border border-white/20 w-6 h-6 flex items-center justify-center bg-transparent outline-none ${(item.cantidad || 1) >= (item.stockMaximo || 1) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer'}`}>+</button>
                    </div>
                  </div>
                  <span className="text-[10px] tracking-[0.1em] text-white whitespace-nowrap">${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)} USD</span>
                </div>
              ))}
              
              <div className="mt-8 border-t border-white/10 pt-6">
                <label className="text-[8px] tracking-[0.3em] uppercase text-gray-500 mb-4 block text-center sm:text-right">MÉTODO DE ENTREGA</label>
                <div className="flex flex-col sm:flex-row justify-end gap-4 mb-8">
                  <button onClick={() => setEnvioConfig({...envioConfig, tipo: 'local', sectorPrecio: 0})} className={`px-6 py-3 text-[8px] tracking-[0.2em] uppercase border transition-colors outline-none cursor-pointer ${envioConfig.tipo === 'local' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-white/50'}`}>Recoger en el Local</button>
                  <button onClick={() => setEnvioConfig({...envioConfig, tipo: 'domicilio', sectorPrecio: sectoresQuito[0].precio, sectorNombre: sectoresQuito[0].nombre})} className={`px-6 py-3 text-[8px] tracking-[0.2em] uppercase border transition-colors outline-none cursor-pointer ${envioConfig.tipo === 'domicilio' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-white/50'}`}>Envío a Domicilio</button>
                </div>

                {envioConfig.tipo === 'domicilio' && (
                  <div className="flex flex-col items-end gap-4 mb-8 animate-fade-in w-full relative z-[150]">
                    <div className="relative w-full sm:w-80" onMouseLeave={() => setOpenFormSelect(null)}>
                      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenFormSelect(openFormSelect === 'envio' ? null : 'envio'); }} onMouseEnter={() => setOpenFormSelect('envio')} className="w-full bg-transparent border-b border-white/20 text-white text-[10px] tracking-[0.1em] py-3 cursor-pointer text-right hover:border-white/50 transition-colors uppercase">
                        {envioConfig.sectorNombre} - ${envioConfig.sectorPrecio.toFixed(2)} USD
                      </div>
                      {openFormSelect === 'envio' && (
                        <div className="absolute top-full right-0 w-full pt-1 z-[300]">
                          <div className="bg-transparent backdrop-blur-[30px] flex flex-col gap-4 py-4 shadow-none border-none">
                            {sectoresQuito.map(sector => (
                              <span key={sector.nombre} onClick={(e) => { e.stopPropagation(); setEnvioConfig({...envioConfig, sectorNombre: sector.nombre, sectorPrecio: sector.precio}); setOpenFormSelect(null); }} onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setEnvioConfig({...envioConfig, sectorNombre: sector.nombre, sectorPrecio: sector.precio}); setOpenFormSelect(null); }} className="cursor-pointer transition-colors w-full text-right px-4 text-gray-500 hover:text-white text-[10px] tracking-[0.1em] uppercase">
                                {sector.nombre} - ${sector.precio.toFixed(2)} USD
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <input 
                      type="url" 
                      placeholder="PEGUE EL LINK DE GOOGLE MAPS DE SU UBICACIÓN*"
                      value={envioConfig.linkMaps}
                      onChange={(e) => setEnvioConfig({...envioConfig, linkMaps: e.target.value})}
                      className="w-full sm:w-80 bg-transparent border-b border-white/20 text-white text-[8px] tracking-[0.1em] py-3 outline-none text-right hover:border-white/50 transition-colors"
                      required
                    />
                    <p className="text-[8px] text-gray-500 tracking-[0.1em] text-right mt-2 max-w-sm">Nota: Al usar envío a domicilio, deberá cancelar el valor del envío previo al despacho para garantizar la logística.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col items-end gap-3 text-[10px] tracking-[0.1em] uppercase">
                <p className="text-gray-400 w-full sm:w-auto flex justify-between sm:justify-end">Subtotal: <span className="text-white ml-0 sm:ml-6">$ {subtotalCarrito.toFixed(2)} USD</span></p>
                <p className="text-gray-400 w-full sm:w-auto flex justify-between sm:justify-end">Envío: <span className="text-white ml-0 sm:ml-6">{envioConfig.tipo === 'local' ? 'GRATIS' : `$ ${envioConfig.sectorPrecio.toFixed(2)} USD`}</span></p>
                <div className="w-full sm:w-64 h-px bg-white/10 my-2 md:my-4"></div>
                <p className="text-[12px] text-white font-light w-full sm:w-auto flex justify-between sm:justify-end">Total: <span className="font-bold ml-0 sm:ml-6">$ {(subtotalCarrito + (envioConfig.tipo === 'domicilio' ? envioConfig.sectorPrecio : 0)).toFixed(2)} USD</span></p>
              </div>
              
              <div className="flex justify-center mt-10 md:mt-16">
                <button onClick={handleContinuarCheckout} className="text-black text-[10px] font-bold tracking-[0.3em] uppercase px-8 md:px-10 py-4 md:py-5 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none border-none shadow-xl w-full sm:w-auto">
                  {envioConfig.tipo === 'domicilio' ? 'Continuar al Pago' : 'Finalizar Pedido vía WhatsApp'}
                </button>
              </div>
            </>
          )}

          {checkoutPaso === 2 && (
            <div className="flex flex-col items-center animate-fade-in">
              <button onClick={() => setCheckoutPaso(1)} className="self-start text-[8px] tracking-[0.2em] uppercase text-gray-500 hover:text-white bg-transparent border-none cursor-pointer mb-6">Volver al carrito</button>
              <h3 className="text-[10px] tracking-[0.4em] uppercase text-white mb-8 text-center font-light">Confirmación de Pago</h3>
              <p className="text-[8px] tracking-[0.1em] text-gray-400 text-center max-w-lg mb-8 leading-loose">
                Para habilitar la logística de entrega a domicilio, requerimos el comprobante de transferencia SOLO por el valor del envío: <strong className="text-white">${envioConfig.sectorPrecio.toFixed(2)} USD</strong>.
              </p>

              <div className="w-full max-w-md border border-white/10 p-6 mb-8 text-center bg-white/5">
                <p className="text-[8px] tracking-[0.2em] text-white uppercase mb-6">Cuentas Autorizadas</p>
                
                <div className="flex justify-center gap-4 mb-8 border-b border-white/10 pb-4">
                  {['pichincha', 'guayaquil', 'deuna'].map((metodo) => (
                    <button
                      key={metodo}
                      onClick={() => setMetodoPagoSeleccionado(metodo)}
                      className={`text-[8px] tracking-[0.2em] uppercase px-3 py-2 transition-all duration-300 border-b-2 outline-none cursor-pointer bg-transparent ${metodoPagoSeleccionado === metodo ? 'text-white border-white' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                    >
                      {metodo === 'deuna' ? 'DeUna' : (metodo === 'pichincha' ? 'Pichincha' : 'Guayaquil')}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] tracking-[0.1em] text-gray-300 font-light min-h-[120px] flex items-center justify-center">
                  {metodoPagoSeleccionado === 'pichincha' && (
                    <div className="animate-fade-in">
                      <strong className="text-white block mb-2 uppercase tracking-widest">Banco Pichincha</strong>
                      <p className="mb-1">Cuenta de ahorro transaccional</p>
                      <p className="mb-1">Número: <span className="font-champagne">2206343568</span></p>
                      <p>Nombre: Tonny Kevin Cuasquer Guerrero</p>
                    </div>
                  )}
                  {metodoPagoSeleccionado === 'guayaquil' && (
                    <div className="animate-fade-in">
                      <strong className="text-white block mb-2 uppercase tracking-widest">Banco Guayaquil</strong>
                      <p className="mb-1">Ahorro # <span className="font-champagne">0043005125</span></p>
                      <p>Nombre: Tonny Kevin Cuasquer Guerrero</p>
                    </div>
                  )}
                  {metodoPagoSeleccionado === 'deuna' && (
                    <div className="animate-fade-in flex flex-col items-center">
                      <strong className="text-white block mb-4 uppercase tracking-widest">Escanea con DeUna</strong>
                      <img 
                        loading="lazy"
                        decoding="async"
                        src="https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/qrPichincha_page-0001.jpg" 
                        alt="QR DeUna" 
                        className="w-40 h-auto object-contain border border-white/10 p-2 bg-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full max-w-md flex flex-col items-center gap-6">
                 <label className="text-[8px] tracking-[0.2em] uppercase text-gray-400">Adjuntar Captura de Transferencia</label>
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={e => setComprobantePago(e.target?.files?.[0] || null)} 
                   className="text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-6 file:border file:border-gray-500 hover:file:border-white file:tracking-[0.2em] file:uppercase file:bg-transparent file:text-gray-500 hover:file:text-white transition-colors cursor-pointer w-full text-center" 
                 />
              </div>

              <button 
                onClick={enviarPedidoWhatsApp} 
                disabled={isUploading || !comprobantePago || !envioConfig.linkMaps}
                className={`mt-12 text-[10px] font-bold tracking-[0.3em] uppercase px-10 py-5 transition-colors cursor-pointer outline-none border border-gray-500 hover:border-white shadow-xl w-full sm:w-auto ${isUploading || !comprobantePago || !envioConfig.linkMaps ? 'bg-transparent text-gray-400 cursor-not-allowed' : 'bg-transparent text-gray-500 hover:text-white'}`}
              >
                {isUploading ? 'Procesando...' : 'Enviar Pedido vía WhatsApp'}
              </button>
            </div>
          )}

        </div>
      )}
    </section>
  );
}