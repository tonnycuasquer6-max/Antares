import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { useShop } from '../../context/ShopContext';
import type { PedidoData } from '../../types';

interface AdminOrdersProps {
  userRole: string;
}

export default function AdminOrders({ userRole }: AdminOrdersProps) {
  const [listaPedidos, setListaPedidos] = useState<PedidoData[]>([]);
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);
  const { parseTallasseguro, fetchProductos } = useShop();

  const fetchPedidosAdmin = useCallback(async () => {
    const { data } = await supabase.from('pedidos').select('*').order('id', { ascending: false });
    if (data) setListaPedidos(data);
  }, []);

  useEffect(() => {
    fetchPedidosAdmin();
  }, [fetchPedidosAdmin]);

  const completarPedido = async (pedido: PedidoData) => {
    if(!window.confirm('¿Seguro que deseas marcar este pedido como completado? Se descontará el stock de las piezas.')) return;
    
    const { error: err1 } = await supabase.from('pedidos').update({ estado: 'Completado' }).eq('id', pedido.id);
    if (err1) return alert('Error actualizando pedido.');

    const items = typeof pedido.productos === 'string' ? JSON.parse(pedido.productos) : pedido.productos;
    for (let item of items) {
      const { data: prodData } = await supabase.from('productos').select('*').eq('id', item.id).single();
      if (prodData) {
        let isRing = prodData.subcategoria === 'Anillos';
        let updatePayload: any = { vendidos: (prodData.vendidos || 0) + item.cantidad };
        
        if (isRing) {
          let currentTallas = parseTallasseguro(prodData.tallas);
          if (currentTallas[item.tallaSeleccionada] !== undefined) {
            currentTallas[item.tallaSeleccionada] = Math.max(0, parseInt(String(currentTallas[item.tallaSeleccionada])) - item.cantidad);
          }
          updatePayload.tallas = JSON.stringify(currentTallas);
          let totalStock = Object.values(currentTallas).reduce((a: number, b: any) => a + Number(b), 0);
          if (totalStock === 0) updatePayload.vendido = true;
        } else {
          let currentDisp = parseInt(prodData.disponibilidad);
          if (!isNaN(currentDisp)) {
            let newDisp = Math.max(0, currentDisp - item.cantidad);
            updatePayload.disponibilidad = newDisp.toString();
            if (newDisp === 0) updatePayload.vendido = true;
          }
        }
        await supabase.from('productos').update(updatePayload).eq('id', item.id);
      }
    }
    fetchPedidosAdmin();
    fetchProductos();
  };

  const cancelarPedido = async (id: string | number) => {
    if(!window.confirm('¿Seguro que deseas cancelar este pedido?')) return;
    await supabase.from('pedidos').update({ estado: 'Cancelado' }).eq('id', id);
    fetchPedidosAdmin();
  };

  const groupedOrdersByMonth = useMemo(() => {
    return listaPedidos.reduce((acc: Record<string, PedidoData[]>, pedido) => {
      let dateObj = pedido.created_at ? new Date(pedido.created_at) : new Date();
      const month = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!acc[month]) acc[month] = [];
      acc[month].push(pedido);
      return acc;
    }, {});
  }, [listaPedidos]);

  return (
    <section className="container mx-auto py-8 md:py-16 flex-grow animate-fade-in w-full max-w-4xl relative z-10">
      <h2 className="text-[12px] md:text-[16px] tracking-[0.4em] uppercase text-white mb-8 md:mb-12 text-center border-b border-white/10 pb-4 md:pb-6 drop-shadow-md">
        {userRole === 'admin' ? 'Gestión de Pedidos' : 'Mis Pedidos'}
      </h2>
      
      {userRole === 'admin' ? (
        <div className="flex flex-col gap-6 w-full">
          {Object.entries(groupedOrdersByMonth).map(([month, monthPedidos]) => {
            const sortedMonthPedidos = [...monthPedidos].sort((a,b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
            const userGroups: Record<string, any[]> = {};
            
            sortedMonthPedidos.forEach(ped => {
              const clientKey = `${ped.cliente_nombre}|${ped.cliente_telefono}`;
              if(!userGroups[clientKey]) userGroups[clientKey] = [];
              userGroups[clientKey].push({...ped, orderNumber: (userGroups[clientKey].length + 1).toString().padStart(3, '0')});
            });

            return (
              <div key={month} className="mb-12 w-full">
                <h3 className="text-[10px] md:text-[14px] font-bold text-gray-500 tracking-[0.4em] uppercase mb-6 border-b border-white/10 pb-2">{month}</h3>
                <div className="flex flex-col gap-6">
                  {Object.entries(userGroups).map(([clientKey, clientPedidos]) => {
                      const [nombre, telefono] = clientKey.split('|');
                      const expandKey = `${month}-${clientKey}`;
                      const isExpanded = pedidoExpandido === expandKey;
                      
                      return (
                        <div key={clientKey} className="bg-black/40 backdrop-blur-3xl p-4 md:p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-sm border border-white/10 w-full transition-all duration-300">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => setPedidoExpandido(isExpanded ? null : expandKey)}>
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-black flex items-center justify-center font-bold text-lg sm:text-xl rounded-full uppercase shadow-[0_0_15px_rgba(255,255,255,0.4)]">{nombre.charAt(0)}</div>
                                  <div>
                                    <p className="text-white text-[10px] sm:text-[12px] tracking-[0.2em] uppercase font-bold drop-shadow-md">{nombre}</p>
                                    <p className="text-gray-400 text-[8px] sm:text-[10px] tracking-[0.1em] mt-1 flex items-center gap-2">
                                      <svg fill="currentColor" viewBox="0 0 16 16" height="10" width="10"><path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 0 1 2.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/></svg>
                                      {telefono}
                                    </p>
                                  </div>
                              </div>
                              <div className="text-right text-gray-400 text-[8px] sm:text-[10px] tracking-[0.3em] uppercase flex items-center gap-2">
                                  {clientPedidos.length} Pedido(s)
                                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" height="14" width="14" className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="mt-6 border-t border-white/10 pt-6 space-y-6 animate-fade-in">
                                  {[...clientPedidos].reverse().map((pedido: any) => (
                                    <div key={pedido.id} className="bg-black/60 p-4 sm:p-6 border border-white/5 rounded-sm shadow-inner">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b border-white/10 pb-3 gap-3 sm:gap-0">
                                          <span className="text-white font-bold text-[10px] sm:text-[12px] tracking-[0.3em]">PEDIDO #{pedido.orderNumber}</span>
                                          <span className={`text-[8px] sm:text-[10px] md:text-[11px] px-4 py-1.5 font-bold uppercase tracking-[0.2em] text-center w-fit rounded-sm ${pedido.estado === 'Completado' ? 'bg-white/10 text-white border border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.2)]' : pedido.estado === 'Cancelado' ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-black/80 text-gray-300 border border-gray-600'}`}>
                                            {pedido.estado}
                                          </span>
                                        </div>
                                        
                                        <div className="space-y-4 mb-6">
                                          {JSON.parse(pedido.productos).map((prod: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between text-[10px] sm:text-[12px] text-gray-300 border-b border-white/5 pb-3">
                                              <div className="flex items-center gap-4 text-left w-full">
                                                <img loading="lazy" src={prod.imagen_url} alt={prod.titulo} className="w-12 h-12 sm:w-16 sm:h-16 object-contain bg-black/40 rounded-sm shadow-inner p-1" />
                                                <div className="flex flex-col text-left flex-grow">
                                                  <span className="truncate pr-2 uppercase text-white tracking-[0.2em] font-bold drop-shadow-sm">{prod.cantidad}x {prod.titulo}</span>
                                                  {prod.tallaSeleccionada && <span className="text-gray-500 mt-1.5 uppercase tracking-[0.2em] text-[8px] sm:text-[10px]">Talla: {prod.tallaSeleccionada}</span>}
                                                </div>
                                              </div>
                                              <span className="font-serif text-[12px] sm:text-[14px] font-bold whitespace-nowrap text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">${(prod.precio * prod.cantidad).toFixed(2)}</span>
                                            </div>
                                          ))}
                                          <div className="pt-3 mt-3 flex justify-between items-center text-[10px] sm:text-[12px] font-bold text-white tracking-[0.3em] uppercase">
                                            <span className="text-gray-400">Logística de Envío:</span>
                                            <span className="font-serif text-[14px] drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]">${parseFloat(pedido.total_envio).toFixed(2)}</span>
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mb-6 border-b border-white/5 pb-4">
                                          {pedido.link_maps && (
                                            <a href={pedido.link_maps} target="_blank" rel="noreferrer" className="text-white hover:text-gray-300 text-[8px] sm:text-[10px] tracking-[0.2em] uppercase underline flex items-center gap-2 transition-colors">
                                              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" height="12" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                              Ver Ubicación de Entrega
                                            </a>
                                          )}
                                          {pedido.comprobante_url && (
                                            <a href={pedido.comprobante_url} target="_blank" rel="noreferrer" className="text-white hover:text-gray-300 text-[8px] sm:text-[10px] tracking-[0.2em] uppercase underline flex items-center gap-2 transition-colors">
                                              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" height="12" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                              Ver Comprobante de Pago Adjunto
                                            </a>
                                          )}
                                        </div>

                                        {pedido.estado === 'En progreso' && (
                                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
                                            <button 
                                              onClick={() => completarPedido(pedido)} 
                                              className="w-full sm:flex-grow py-3 md:py-4 bg-white text-black text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-gray-300 transition-all duration-300 cursor-pointer outline-none border-none shadow-[0_0_15px_rgba(255,255,255,0.3)] rounded-sm"
                                            >
                                              Completar & Descontar Stock
                                            </button>
                                            <button 
                                              onClick={() => cancelarPedido(pedido.id)} 
                                              className="w-full sm:w-auto py-3 md:py-4 px-8 bg-transparent text-gray-400 border border-gray-600 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 cursor-pointer outline-none rounded-sm"
                                            >
                                              Anular
                                            </button>
                                          </div>
                                        )}
                                    </div>
                                  ))}
                              </div>
                            )}
                        </div>
                      )
                  })}
                </div>
              </div>
            )
          })}
          {listaPedidos.length === 0 && (
            <p className="text-gray-500 tracking-[0.2em] uppercase text-[12px] text-center py-10 bg-black/40 backdrop-blur-md rounded-sm border border-white/5">
              No hay pedidos registrados.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-black/40 backdrop-blur-3xl p-8 md:p-16 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 rounded-sm w-full text-center">
          <p className="text-gray-400 tracking-[0.2em] uppercase text-[10px] md:text-[12px] py-6 md:py-10">
            Aún no hay un historial de pedidos en su cuenta.
          </p>
        </div>
      )}
    </section>
  );
}