import { useMemo, useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { supabase } from '../../services/supabase';
import BulkProductForm from './BulkProductForm';
import type { PedidoData, Product } from '../../types';

type ProductoStock = Omit<Product, 'tallas'> & {
  existencias: number;
  tallas: (string | number)[];
};

type ProductoPedido = {
  id: string | number;
  titulo: string;
  categoria?: string;
  imagen_url?: string;
  tallaSeleccionada?: string;
  cantidad?: string | number;
  costo?: string | number;
  precio?: string | number;
};

type VentaDesglosada = Pick<Product, 'id' | 'titulo' | 'costo' | 'precio'> & {
  categoria?: string;
  imagen_url?: string;
  talla_especifica: string;
};

const esProductoPedido = (value: unknown): value is ProductoPedido => (
  typeof value === 'object'
  && value !== null
  && 'id' in value
  && (typeof value.id === 'string' || typeof value.id === 'number')
  && 'titulo' in value
  && typeof value.titulo === 'string'
  && (!('categoria' in value) || typeof value.categoria === 'string')
  && (!('imagen_url' in value) || typeof value.imagen_url === 'string')
  && (!('tallaSeleccionada' in value) || typeof value.tallaSeleccionada === 'string')
  && (!('cantidad' in value) || typeof value.cantidad === 'string' || typeof value.cantidad === 'number')
  && (!('costo' in value) || typeof value.costo === 'string' || typeof value.costo === 'number')
  && (!('precio' in value) || typeof value.precio === 'string' || typeof value.precio === 'number')
);

const agruparProductosPorProducto = (
  productos: Product[],
  parseTallasseguro: (tallas: Product['tallas']) => Record<string, number | string>
): ProductoStock[] => {
  const productosAgrupados = new Map<string, ProductoStock>();

  productos.forEach(producto => {
    const tallas = producto.subcategoria === 'Anillos'
      ? Object.entries(parseTallasseguro(producto.tallas))
        .filter(([, cantidad]) => Number.parseInt(String(cantidad), 10) > 0)
      : [];
    const existencias = producto.subcategoria === 'Anillos'
      ? tallas.reduce((total, [, cantidad]) => total + Number.parseInt(String(cantidad), 10), 0)
      : Math.max(0, Number.parseInt(String(producto.disponibilidad), 10) || 0);
    const clave = String(producto.id ?? producto.titulo.trim().toLowerCase());
    const productoExistente = productosAgrupados.get(clave);

    if (productoExistente) {
      productoExistente.existencias += existencias;
      productoExistente.tallas = [...new Set([...productoExistente.tallas, ...tallas.map(([talla]) => talla)])];
      return;
    }

    productosAgrupados.set(clave, {
      ...producto,
      existencias,
      tallas: tallas.map(([talla]) => talla)
    });
  });

  return [...productosAgrupados.values()];
};

export default function AdminInventory() {
  const { productos, parseTallasseguro, setProductos } = useShop();
  const [listaPedidos, setListaPedidos] = useState<PedidoData[]>([]);
  const formatCurrency = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    []
  );

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase.from('pedidos').select('*').order('id', { ascending: false });
      if (data) setListaPedidos(data);
    };
    fetchOrders();
  }, []);

  const stockProyeccion = useMemo(() => {
    return agruparProductosPorProducto(productos, parseTallasseguro);
  }, [productos, parseTallasseguro]);

  const ventasDesglosadas = useMemo(() => {
    const desglosadas: VentaDesglosada[] = [];
    listaPedidos.filter(ped => ped.estado === 'Completado').forEach(ped => {
      const items: unknown = JSON.parse(ped.productos || '[]');
      if (!Array.isArray(items)) return;
      items.forEach((value: unknown) => {
        if (!esProductoPedido(value)) return;
        const qty = Number.parseInt(String(value.cantidad), 10) || 1;
        for (let i = 0; i < qty; i++) {
          desglosadas.push({
            id: value.id,
            titulo: value.titulo,
            categoria: value.categoria,
            imagen_url: value.imagen_url,
            talla_especifica: value.tallaSeleccionada || 'N/A',
            costo: Number.parseFloat(String(value.costo)) || 0,
            precio: Number.parseFloat(String(value.precio)) || 0
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
      
      <div className="glass-panel p-4 md:p-8 w-full overflow-x-auto mb-16 rounded-sm">
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
          {stockProyeccion.map(item => {
            const costo = Number.parseFloat(String(item.costo)) || 0;
            const precio = Number.parseFloat(String(item.precio)) || 0;
            const ganancia = (precio - costo) * item.existencias;
            return (
              <div key={`inv-${item.id}`} className="grid grid-cols-7 gap-4 text-[10px] md:text-xs tracking-[0.1em] text-white border-b border-white/5 py-4 items-center text-center hover:bg-white/5 transition-colors duration-300 px-4 rounded-sm">
                <div className="col-span-2 flex items-center gap-4 text-left">
                  <button type="button" onClick={() => !item.publicado && publicarProducto(item.id)} className={`inventory-status-dot ${item.vendido ? 'is-sold-out' : item.publicado ? 'is-published' : 'is-draft'}`} title={item.vendido ? 'Agotado' : item.publicado ? 'Publicado' : 'Guardar y publicar'} aria-label={item.vendido ? 'Agotado' : item.publicado ? 'Publicado' : 'Publicar producto'} />
                  <img loading="lazy" src={item.imagen_url} alt={item.titulo} className="w-12 h-12 object-contain bg-black/60 rounded-sm shadow-inner p-1" />
                  <div className="flex flex-col truncate">
                    <span className="uppercase truncate font-bold text-white/90">{item.titulo}</span>
                    <span className="text-[8px] text-gray-500 uppercase mt-1 truncate tracking-[0.2em]">{item.categoria}</span>
                  </div>
                </div>
                <div className="text-white/80 font-bold">{item.tallas.length ? item.tallas.join(', ') : '-'}</div>
                <div className="text-white/80">{item.existencias}</div>
                <div className="text-gray-400">{formatCurrency.format(costo)}</div>
                <div className="text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{formatCurrency.format(precio)}</div>
                <div className="text-[#a8b8d0] font-bold">{ganancia > 0 ? `+${formatCurrency.format(ganancia)}` : formatCurrency.format(ganancia)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-4 md:p-8 w-full overflow-x-auto rounded-sm">
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
                <div className="text-gray-400">{formatCurrency.format(item.costo)}</div>
                <div className="text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{formatCurrency.format(item.precio)}</div>
                <div className="text-[#a8b8d0] font-bold drop-shadow-[0_0_8px_rgba(168,184,208,0.5)]">+{formatCurrency.format(ganancia)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}