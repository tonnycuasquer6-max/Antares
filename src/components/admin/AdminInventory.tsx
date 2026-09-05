import { useMemo, useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { supabase } from '../../services/supabase';
import BulkProductForm from './BulkProductForm';
import type { PedidoData } from '../../types';

export default function AdminInventory() {
  const { productos, parseTallasseguro, setProductos } = useShop();
  const [listaPedidos, setListaPedidos] = useState<PedidoData[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase.from('pedidos').select('*').order('id', { ascending: false });
      if (data) setListaPedidos(data);
    };
    fetchOrders();
  }, []);

  const stockProyeccion = useMemo(() => {
    return productos.reduce((acc: any[], p) => {
      if (p.subcategoria === 'Anillos') {
          const tallasObj = parseTallasseguro(p.tallas);
          const activeTallas = Object.entries(tallasObj).filter(([_, qty]) => parseInt(String(qty)) > 0);
          (activeTallas.length ? activeTallas : [['Todas', 0]]).forEach(([talla, cantidad]) => {
            acc.push({ ...p, talla_especifica: talla, stock_especifico: parseInt(String(cantidad)) });
          });
      } else {
          const disp = parseInt(String(p.disponibilidad));
          if (!isNaN(disp) && disp > 0) acc.push({ ...p, talla_especifica: 'N/A', stock_especifico: disp });
          else acc.push({ ...p, talla_especifica: 'N/A', stock_especifico: isNaN(disp) ? p.disponibilidad : 0 });
      }
      return acc;
    }, []);
  }, [productos, parseTallasseguro]);

  const ventasDesglosadas = useMemo(() => {
    const desglosadas: any[] = [];
    listaPedidos.filter(ped => ped.estado === 'Completado').forEach(ped => {
      const items = JSON.parse(ped.productos || '[]');
      items.forEach((item: any) => {
        const qty = parseInt(item.cantidad) || 1;
        for (let i = 0; i < qty; i++) {
          desglosadas.push({
            id: item.id,
            titulo: item.titulo,
            categoria: item.categoria,
            subcategoria: item.subcategoria,
            imagen_url: item.imagen_url,
            talla_especifica: item.tallaSeleccionada || 'N/A',
            costo: parseFloat(item.costo) || 0,
            precio: parseFloat(item.precio) || 0
          });
        }
      });
    });
    return desglosadas;
  }, [listaPedidos]);

  const publicarProducto = async (id: string | number) => {
    const { data, error } = await supabase.from('productos').update({ publicado: true }).eq('id', id).select().single();
    if (!error && data) setProductos(current => current.map(product => product.id === id ? data : product));
  };

  return (
    <section className="container mx-auto py-8 md:py-16 flex-grow animate-fade-in w-full max-w-6xl relative z-10">
      <h2 className="text-[12px] md:text-[16px] tracking-[0.4em] uppercase text-white mb-12 text-center border-b border-white/10 pb-4 md:pb-6 drop-shadow-md">
        Inventario y Contabilidad
      </h2>

      <BulkProductForm onSaved={products => setProductos(current => [...products, ...current])} />
      
      <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-4 md:p-8 w-full overflow-x-auto mb-16 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <h3 className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-gray-400 mb-6 drop-shadow-md">Stock Disponible (Proyección)</h3>
        <div className="min-w-[800px]">
          <div className="grid grid-cols-7 gap-4 text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-500 border-b border-white/10 pb-4 mb-4 font-bold text-center">
            <div className="col-span-2 text-left pl-4">Pieza</div>
            <div>Talla</div>
            <div>Stock</div>
            <div>Costo</div>
            <div>Precio</div>
            <div>Ganancia Potencial</div>
          </div>
          {stockProyeccion.map((item, idx) => {
            const costo = parseFloat(item.costo) || 0;
            const precio = parseFloat(item.precio) || 0;
            const stockNum = parseInt(item.stock_especifico);
            const ganancia = !isNaN(stockNum) ? (precio - costo) * stockNum : 0;
            return (
              <div key={`inv-${item.id}-${idx}`} className="grid grid-cols-7 gap-4 text-[10px] md:text-xs tracking-[0.1em] text-white border-b border-white/5 py-4 items-center text-center hover:bg-white/5 transition-colors duration-300 px-4 rounded-sm">
                <div className="col-span-2 flex items-center gap-4 text-left">
                  <button type="button" onClick={() => !item.publicado && publicarProducto(item.id)} className={`inventory-status-dot ${item.vendido ? 'is-sold-out' : item.publicado ? 'is-published' : 'is-draft'}`} title={item.vendido ? 'Agotado' : item.publicado ? 'Publicado' : 'Guardar y publicar'} aria-label={item.vendido ? 'Agotado' : item.publicado ? 'Publicado' : 'Publicar producto'} />
                  <img loading="lazy" src={item.imagen_url} alt={item.titulo} className="w-12 h-12 object-contain bg-black/60 rounded-sm shadow-inner p-1" />
                  <div className="flex flex-col truncate">
                    <span className="uppercase truncate font-bold text-white/90">{item.titulo}</span>
                    <span className="text-[8px] text-gray-500 uppercase mt-1 truncate tracking-[0.2em]">{item.categoria}</span>
                  </div>
                </div>
                <div className="text-white/80 font-bold">{item.talla_especifica}</div>
                <div className="text-white/80">{item.stock_especifico}</div>
                <div className="text-gray-400">${costo.toFixed(2)}</div>
                <div className="text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">${precio.toFixed(2)}</div>
                <div className="text-[#a8b8d0] font-bold">{ganancia > 0 ? `+$${ganancia.toFixed(2)}` : 'N/A'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-3xl border border-white/10 p-4 md:p-8 w-full overflow-x-auto rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <h3 className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-white mb-6 drop-shadow-md">Historial de Ventas (Ganancia Real)</h3>
        <div className="min-w-[800px]">
          <div className="grid grid-cols-6 gap-4 text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-500 border-b border-white/10 pb-4 mb-4 font-bold text-center">
            <div className="col-span-2 text-left pl-4">Pieza Vendida</div>
            <div>Talla</div>
            <div>Costo</div>
            <div>Precio Venta</div>
            <div>Ganancia Neta</div>
          </div>
          {ventasDesglosadas.map((item, idx) => {
            const ganancia = item.precio - item.costo;
            return (
              <div key={`sold-${item.id}-${idx}`} className="grid grid-cols-6 gap-4 text-[10px] md:text-xs tracking-[0.1em] text-white border-b border-white/5 py-4 items-center text-center hover:bg-white/5 transition-colors duration-300 px-4 rounded-sm">
                <div className="col-span-2 flex items-center gap-4 text-left">
                  <img loading="lazy" src={item.imagen_url} alt={item.titulo} className="w-12 h-12 object-contain bg-black/60 rounded-sm shadow-inner p-1 opacity-70 filter grayscale hover:grayscale-0 transition-all" />
                  <div className="flex flex-col truncate">
                    <span className="uppercase truncate text-gray-300 font-bold">{item.titulo}</span>
                    <span className="text-[8px] text-gray-500 uppercase mt-1 truncate tracking-[0.2em]">{item.categoria}</span>
                  </div>
                </div>
                <div className="text-white/80 font-bold">{item.talla_especifica}</div>
                <div className="text-gray-400">${item.costo.toFixed(2)}</div>
                <div className="text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">${item.precio.toFixed(2)}</div>
                <div className="text-[#a8b8d0] font-bold drop-shadow-[0_0_8px_rgba(168,184,208,0.5)]">+${ganancia.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}