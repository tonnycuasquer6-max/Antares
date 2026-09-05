import { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import type { EnvioConfig } from '../../types';

export default function Cart() {
  const { user } = useAuth();
  const { carrito, setCarrito, updateCantidad, sectoresQuito } = useShop();

  const [checkoutPaso, setCheckoutPaso] = useState(1);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('pichincha');
  const [envioConfig, setEnvioConfig] = useState<EnvioConfig>({ tipo: 'local', sectorPrecio: 0, sectorNombre: 'Quito Centro', linkMaps: '' });
  const [comprobantePago, setComprobantePago] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [openFormSelect, setOpenFormSelect] = useState<string | null>(null);

  const subtotalCarrito = carrito.reduce((sum, item) => sum + ((item.precio || 0) * (item.cantidad || 1)), 0);

  const handleContinuarCheckout = () => {
    if (envioConfig.tipo === 'domicilio') setCheckoutPaso(2);
    else enviarPedidoWhatsApp(); 
  };

  const enviarPedidoWhatsApp = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsUploading(true);

    let urlComprobante = '';
    if (comprobantePago) {
      const fileExt = comprobantePago.name.split('.').pop();
      const fileName = `pago_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('catalogo').upload(`comprobantes/${fileName}`, comprobantePago);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('catalogo').getPublicUrl(`comprobantes/${fileName}`);
        urlComprobante = publicUrl;
      }
    }

    const total = subtotalCarrito + (envioConfig.tipo === 'domicilio' ? envioConfig.sectorPrecio : 0);
    const nombreCliente = `${user?.user_metadata?.first_name || ''} ${user?.user_metadata?.last_name || ''}`;
    const telfCliente = user?.user_metadata?.telefono || '';
    
    await supabase.from('pedidos').insert([{
      cliente_nombre: nombreCliente,
      cliente_telefono: telfCliente,
      productos: JSON.stringify(carrito),
      total_envio: envioConfig.tipo === 'domicilio' ? envioConfig.sectorPrecio : 0,
      estado: 'En progreso',
      comprobante_url: urlComprobante,
      link_maps: envioConfig.linkMaps
    }]);

    let mensaje = `*FACTURA VIRTUAL - ANTARES*%0A------------------------%0A*Cliente:* ${nombreCliente}%0A*Tel:* ${telfCliente}%0A*Productos:*%0A`;
    
    carrito.forEach(item => {
      const tallaStr = item.tallaSeleccionada ? ` (Talla: ${item.tallaSeleccionada})` : '';
      mensaje += `- ${item.cantidad || 1}x ${item.titulo}${tallaStr} : $${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)}%0A`;
    });

    if (envioConfig.tipo === 'domicilio') {
      mensaje += `------------------------%0A*Subtotal:* $${subtotalCarrito.toFixed(2)}%0A*Envío:* $${envioConfig.sectorPrecio.toFixed(2)} (${envioConfig.sectorNombre})%0A*TOTAL DEL PEDIDO:* $${total.toFixed(2)}%0A------------------------%0A*TOTAL A PAGAR AHORA:* $${envioConfig.sectorPrecio.toFixed(2)} (Solo Envío)%0A*Ubicación:* ${envioConfig.linkMaps || 'No proporcionado'}%0A`;
      if (urlComprobante) mensaje += `*Comprobante:* ${urlComprobante}%0A`;
    } else {
      mensaje += `------------------------%0A*TOTAL:* $${total.toFixed(2)}%0A*Envío:* Recoger en Local%0A------------------------%0A`;
    }

    setIsUploading(false);
    setCarrito([]);
    setCheckoutPaso(1);
    
    window.open(`https://wa.me/593980111570?text=${mensaje}`, '_blank');
    window.location.href = '/'; 
  };

  return (
    <section className="container mx-auto px-2 md:px-4 py-8 md:py-16 flex-grow animate-fade-in w-full max-w-4xl relative z-10">
      <h2 className="text-[14px] tracking-[0.4em] uppercase text-white mb-12 text-center border-b border-white/10 pb-4 md:pb-6 drop-shadow-md">Su Selección</h2>
      
      {carrito.length === 0 ? (
        <p className="text-gray-500 tracking-[0.2em] uppercase text-[12px] text-center py-10 bg-black/40 backdrop-blur-md rounded-sm border border-white/5">
          Su bolso está vacío en este momento.
        </p>
      ) : (
        <div className="liquid-glass p-4 md:p-10 shadow-2xl relative rounded-[2rem]">
          
          {checkoutPaso === 1 && (
            <>
              <h3 className="text-[8px] tracking-[0.4em] uppercase text-gray-400 mb-6 md:mb-10 text-center drop-shadow-md">Detalle de su Pedido</h3>
              
              {carrito.map(item => (
                <div key={item.id + (item.tallaSeleccionada || '')} className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 py-4 md:py-6 border-b border-white/10 relative hover:bg-white/5 transition-colors duration-300 px-2 sm:px-4 rounded-sm">
                  <button 
                    onClick={() => setCarrito(carrito.filter(p => !(p.id === item.id && p.tallaSeleccionada === item.tallaSeleccionada)))} 
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl cursor-pointer bg-transparent border-none outline-none transition-colors"
                  >
                    ×
                  </button>
                  <img src={item.imagen_url} alt={item.titulo} className="w-24 h-24 object-contain bg-black/40 shadow-inner rounded-sm" />
                  <div className="flex-grow text-center sm:text-left w-full sm:w-auto">
                    <h4 className="text-[10px] tracking-[0.2em] uppercase text-white mb-1 line-clamp-2 break-words">{item.titulo}</h4>
                    <p className="text-[8px] tracking-[0.1em] text-gray-400 uppercase line-clamp-1 mb-2">
                      {item.categoria} {item.subcategoria === 'Anillos' && item.tallaSeleccionada ? ` | Talla: ${item.tallaSeleccionada}` : ''}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                      <button onClick={() => updateCantidad(item.id, item.tallaSeleccionada, -1)} className="text-white border border-white/20 w-6 h-6 flex items-center justify-center hover:bg-white/20 cursor-pointer bg-transparent outline-none transition-colors rounded-sm">-</button>
                      <span className="text-[10px] text-white w-4 text-center font-serif">{item.cantidad || 1}</span>
                      <button onClick={() => updateCantidad(item.id, item.tallaSeleccionada, 1)} disabled={(item.cantidad || 1) >= (item.stockMaximo || 1)} className={`text-white border border-white/20 w-6 h-6 flex items-center justify-center bg-transparent outline-none rounded-sm transition-colors ${(item.cantidad || 1) >= (item.stockMaximo || 1) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20 cursor-pointer'}`}>+</button>
                    </div>
                  </div>
                  <span className="text-[12px] tracking-[0.1em] text-white whitespace-nowrap font-bold">${((item.precio || 0) * (item.cantidad || 1)).toFixed(2)} USD</span>
                </div>
              ))}
              
              <div className="mt-8 border-t border-white/10 pt-6">
                <label className="text-[8px] tracking-[0.4em] uppercase text-gray-500 mb-4 block text-center sm:text-right drop-shadow-md">MÉTODO DE ENTREGA</label>
                <div className="flex flex-col sm:flex-row justify-end gap-4 mb-8">
                  <button onClick={() => setEnvioConfig({...envioConfig, tipo: 'local', sectorPrecio: 0})} className={`px-6 py-3 text-[8px] tracking-[0.2em] uppercase border transition-all duration-300 outline-none cursor-pointer rounded-sm ${envioConfig.tipo === 'local' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black/40 text-white border-white/20 hover:border-white/50'}`}>Recoger en el Local</button>
                  <button onClick={() => setEnvioConfig({...envioConfig, tipo: 'domicilio', sectorPrecio: sectoresQuito[0].precio, sectorNombre: sectoresQuito[0].nombre})} className={`px-6 py-3 text-[8px] tracking-[0.2em] uppercase border transition-all duration-300 outline-none cursor-pointer rounded-sm ${envioConfig.tipo === 'domicilio' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black/40 text-white border-white/20 hover:border-white/50'}`}>Envío a Domicilio</button>
                </div>

                {envioConfig.tipo === 'domicilio' && (
                  <div className="flex flex-col items-end gap-4 mb-8 animate-fade-in w-full relative z-[150]">
                    <div className="relative w-full sm:w-80" onMouseLeave={() => setOpenFormSelect(null)}>
                      <div onClick={() => setOpenFormSelect(openFormSelect === 'envio' ? null : 'envio')} onMouseEnter={() => setOpenFormSelect('envio')} className="w-full bg-transparent border-b border-white/20 text-white text-[10px] tracking-[0.1em] py-3 cursor-pointer text-right hover:border-white/50 transition-colors uppercase">
                        {envioConfig.sectorNombre} - ${envioConfig.sectorPrecio.toFixed(2)} USD
                      </div>
                      {openFormSelect === 'envio' && (
                        <div className="absolute top-full right-0 w-full pt-1 z-[300]">
                          <div className="bg-black/80 backdrop-blur-3xl flex flex-col gap-4 py-4 border border-white/10 rounded-sm shadow-2xl">
                            {sectoresQuito.map(sector => (
                              <span 
                                key={sector.nombre} 
                                onClick={() => { setEnvioConfig({...envioConfig, sectorNombre: sector.nombre, sectorPrecio: sector.precio}); setOpenFormSelect(null); }} 
                                className="cursor-pointer transition-colors w-full text-right px-6 py-1 text-gray-400 hover:text-white hover:bg-white/5 text-[10px] tracking-[0.1em] uppercase"
                              >
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
                      className="w-full sm:w-80 bg-transparent border-b border-white/20 text-white text-[8px] tracking-[0.1em] py-3 outline-none text-right hover:border-white/50 transition-colors placeholder-gray-600"
                      required
                    />
                    <p className="text-[7px] text-gray-500 tracking-[0.1em] text-right mt-2 max-w-sm uppercase">Nota: Al usar envío a domicilio, deberá cancelar el valor del envío previo al despacho para garantizar la logística.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col items-end gap-3 text-[10px] tracking-[0.1em] uppercase">
                <p className="text-gray-400 w-full sm:w-auto flex justify-between sm:justify-end">Subtotal: <span className="text-white ml-0 sm:ml-6 font-bold">$ {subtotalCarrito.toFixed(2)} USD</span></p>
                <p className="text-gray-400 w-full sm:w-auto flex justify-between sm:justify-end">Envío: <span className="text-white ml-0 sm:ml-6 font-bold">{envioConfig.tipo === 'local' ? 'GRATIS' : `$ ${envioConfig.sectorPrecio.toFixed(2)} USD`}</span></p>
                <div className="w-full sm:w-64 h-px bg-white/20 my-2 md:my-4"></div>
                <p className="text-[12px] text-white font-light w-full sm:w-auto flex justify-between sm:justify-end">Total: <span className="font-bold ml-0 sm:ml-6 text-[14px] drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">$ {(subtotalCarrito + (envioConfig.tipo === 'domicilio' ? envioConfig.sectorPrecio : 0)).toFixed(2)} USD</span></p>
              </div>
              
              <div className="flex justify-center mt-10 md:mt-16">
                <button 
                  onClick={handleContinuarCheckout} 
                  className="text-black text-[10px] font-bold tracking-[0.3em] uppercase px-8 md:px-10 py-4 md:py-5 bg-white hover:bg-gray-300 transition-all duration-300 cursor-pointer outline-none border-none shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] w-full sm:w-auto rounded-sm"
                >
                  {envioConfig.tipo === 'domicilio' ? 'Continuar al Pago' : 'Finalizar Pedido vía WhatsApp'}
                </button>
              </div>
            </>
          )}

          {checkoutPaso === 2 && (
            <div className="flex flex-col items-center animate-fade-in w-full">
              <button onClick={() => setCheckoutPaso(1)} className="self-start text-[8px] tracking-[0.2em] uppercase text-gray-500 hover:text-white bg-transparent border-none cursor-pointer mb-6 transition-colors flex items-center gap-2">
                <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" height="12" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"></path></svg>
                Volver al carrito
              </button>
              
              <h3 className="text-[12px] tracking-[0.4em] uppercase text-white mb-8 text-center font-light drop-shadow-md">Confirmación de Pago</h3>
              
              <p className="text-[8px] tracking-[0.1em] text-gray-400 text-center max-w-lg mb-8 leading-loose uppercase">
                Para habilitar la logística de entrega a domicilio, requerimos el comprobante de transferencia SOLO por el valor del envío: <strong className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">${envioConfig.sectorPrecio.toFixed(2)} USD</strong>.
              </p>

              <div className="w-full max-w-md border border-white/10 p-6 mb-8 text-center bg-black/40 backdrop-blur-md rounded-sm shadow-inner">
                <p className="text-[8px] tracking-[0.3em] text-white/80 uppercase mb-6">Cuentas Autorizadas</p>
                
                <div className="flex justify-center gap-4 mb-8 border-b border-white/10 pb-4">
                  {['pichincha', 'guayaquil', 'deuna'].map((metodo) => (
                    <button
                      key={metodo}
                      onClick={() => setMetodoPagoSeleccionado(metodo)}
                      className={`text-[8px] tracking-[0.2em] uppercase px-3 py-2 transition-all duration-300 border-b-2 outline-none cursor-pointer bg-transparent ${metodoPagoSeleccionado === metodo ? 'text-white border-white font-bold drop-shadow-md' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                    >
                      {metodo === 'deuna' ? 'DeUna' : (metodo === 'pichincha' ? 'Pichincha' : 'Guayaquil')}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] tracking-[0.1em] text-gray-300 font-light min-h-[120px] flex items-center justify-center">
                  {metodoPagoSeleccionado === 'pichincha' && (
                    <div className="animate-fade-in flex flex-col gap-2">
                      <strong className="text-white block mb-2 uppercase tracking-[0.2em]">Banco Pichincha</strong>
                      <p className="text-gray-400 uppercase text-[8px]">Cuenta de ahorro transaccional</p>
                      <p className="text-[12px] tracking-widest text-white">2206343568</p>
                      <p className="uppercase text-[8px] text-gray-400 mt-2">Tonny Kevin Cuasquer Guerrero</p>
                    </div>
                  )}
                  {metodoPagoSeleccionado === 'guayaquil' && (
                    <div className="animate-fade-in flex flex-col gap-2">
                      <strong className="text-white block mb-2 uppercase tracking-[0.2em]">Banco Guayaquil</strong>
                      <p className="text-gray-400 uppercase text-[8px]">Ahorro #</p>
                      <p className="text-[12px] tracking-widest text-white">0043005125</p>
                      <p className="uppercase text-[8px] text-gray-400 mt-2">Tonny Kevin Cuasquer Guerrero</p>
                    </div>
                  )}
                  {metodoPagoSeleccionado === 'deuna' && (
                    <div className="animate-fade-in flex flex-col items-center">
                      <strong className="text-white block mb-4 uppercase tracking-[0.2em]">Escanea con DeUna</strong>
                      <div className="p-2 bg-white rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        <img 
                          src="https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/qrPichincha_page-0001.jpg" 
                          alt="QR DeUna" 
                          className="w-40 h-auto object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full max-w-md flex flex-col items-center gap-6">
                 <label className="text-[8px] tracking-[0.3em] uppercase text-gray-400">Adjuntar Captura de Transferencia</label>
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={e => setComprobantePago(e.target.files?.[0] || null)} 
                   className="text-[10px] text-gray-500 file:mr-4 file:py-3 file:px-6 file:border file:border-white/20 hover:file:border-white/50 file:tracking-[0.2em] file:uppercase file:bg-black/40 file:text-white transition-all cursor-pointer w-full text-center file:rounded-sm" 
                 />
              </div>

              <button 
                onClick={enviarPedidoWhatsApp} 
                disabled={isUploading || !comprobantePago || !envioConfig.linkMaps}
                className={`mt-12 text-[10px] font-bold tracking-[0.3em] uppercase px-10 py-5 transition-all duration-300 cursor-pointer outline-none border shadow-xl w-full sm:w-auto rounded-sm ${isUploading || !comprobantePago || !envioConfig.linkMaps ? 'bg-black/20 text-gray-500 border-white/10 cursor-not-allowed' : 'bg-transparent text-white border-white hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'}`}
              >
                {isUploading ? 'Procesando Transacción...' : 'Enviar Pedido vía WhatsApp'}
              </button>
            </div>
          )}

        </div>
      )}
    </section>
  );
}