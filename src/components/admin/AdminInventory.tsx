import { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { supabase } from '../../services/supabase';
import BulkProductForm from './BulkProductForm';
import type { PedidoData, Product } from '../../types';

type ProductoStock = Omit<Product, 'tallas'> & {
  existencias: number;
  tallas: { talla: string; existencias: number; agotada: boolean }[];
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
  fecha_venta: string;
  cantidad: number;
  clave: string;
  origen: 'pedido' | 'manual';
  ventaManualId?: number;
  pedidoId?: string | number;
  pedidoItemIndex?: number;
};

type VentaManualRegistro = {
  id: number;
  producto_id: string | number | null;
  producto_titulo: string;
  categoria: string | null;
  imagen_url: string | null;
  talla: string;
  cantidad: number;
  costo: number;
  pvp: number;
  fecha_venta: string;
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
  parseTallasseguro: (tallas: Product['tallas']) => Record<string, number | string>,
  tallasVendidas: ReadonlySet<string>
): ProductoStock[] => {
  const productosAgrupados = new Map<string, ProductoStock>();

  productos.forEach(producto => {
    const tallas = producto.subcategoria === 'Anillos'
      ? Object.entries(parseTallasseguro(producto.tallas))
        .map(([talla, cantidad]) => ({
          talla,
          existencias: Math.max(0, Number.parseInt(String(cantidad), 10) || 0),
          agotada: Number.parseInt(String(cantidad), 10) <= 0
            && tallasVendidas.has(`${producto.id}:${talla}`)
        }))
      : [];
    const existencias = producto.subcategoria === 'Anillos'
      ? tallas.reduce((total, talla) => total + talla.existencias, 0)
      : Math.max(0, Number.parseInt(String(producto.disponibilidad), 10) || 0);
    const clave = String(producto.id ?? producto.titulo.trim().toLowerCase());
    const productoExistente = productosAgrupados.get(clave);

    if (productoExistente) {
      productoExistente.existencias += existencias;
      tallas.forEach(talla => {
        const tallaExistente = productoExistente.tallas.find(item => item.talla === talla.talla);
        if (tallaExistente) {
          tallaExistente.existencias += talla.existencias;
          tallaExistente.agotada = tallaExistente.existencias === 0 && (tallaExistente.agotada || talla.agotada);
        }
        else productoExistente.tallas.push(talla);
      });
      return;
    }

    productosAgrupados.set(clave, {
      ...producto,
      existencias,
      tallas
    });
  });

  return [...productosAgrupados.values()];
};

export default function AdminInventory() {
  const { productos, parseTallasseguro, setProductos, fetchProductos } = useShop();
  const [listaPedidos, setListaPedidos] = useState<PedidoData[]>([]);
  const [ventasManuales, setVentasManuales] = useState<VentaManualRegistro[]>([]);
  const [errorVentas, setErrorVentas] = useState('');
  const [ventaPorDeshacer, setVentaPorDeshacer] = useState<VentaDesglosada | null>(null);
  const [contrasenaDeshacer, setContrasenaDeshacer] = useState('');
  const [errorDeshacer, setErrorDeshacer] = useState('');
  const [deshaciendoVenta, setDeshaciendoVenta] = useState(false);
  const formatCurrency = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    []
  );

  const fetchSales = useCallback(async () => {
    const [ordersResult, manualSalesResult] = await Promise.all([
      supabase.from('pedidos').select('*').order('id', { ascending: false }),
      supabase.from('ventas_manuales').select('*').order('fecha_venta', { ascending: false }).order('id', { ascending: false })
    ]);
    if (ordersResult.error) {
      console.error('No se pudo cargar el historial de pedidos:', ordersResult.error);
    } else if (ordersResult.data) {
      setListaPedidos(ordersResult.data);
    }
    if (manualSalesResult.error) {
      console.error('No se pudo cargar el historial de ventas manuales:', manualSalesResult.error);
      setErrorVentas('No se pudieron cargar las ventas manuales. Verifica que la migración de ventas esté aplicada.');
    } else {
      setVentasManuales(manualSalesResult.data || []);
      setErrorVentas('');
    }
  }, []);

  useEffect(() => {
    const refreshSales = () => { void fetchSales(); };
    window.addEventListener('antares-manual-sale-recorded', refreshSales);
    queueMicrotask(refreshSales);
    return () => window.removeEventListener('antares-manual-sale-recorded', refreshSales);
  }, [fetchSales]);

  const ventasDesglosadas = useMemo(() => {
    const desglosadas: VentaDesglosada[] = [];
    listaPedidos.filter(ped => ped.estado === 'Completado').forEach(ped => {
      let items: unknown;
      try {
        items = typeof ped.productos === 'string' ? JSON.parse(ped.productos || '[]') : ped.productos;
      } catch (error) {
        console.error(`No se pudieron interpretar los productos del pedido ${ped.id}:`, error);
        return;
      }
      if (!Array.isArray(items)) return;
      items.forEach((value: unknown, itemIndex: number) => {
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
            precio: Number.parseFloat(String(value.precio)) || 0,
            fecha_venta: ped.created_at || '',
            cantidad: 1,
            clave: `pedido-${ped.id}-${itemIndex}-${i}`,
            origen: 'pedido',
            pedidoId: ped.id,
            pedidoItemIndex: itemIndex
          });
        }
      });
    });
    ventasManuales.forEach(venta => {
      desglosadas.push({
        id: venta.producto_id ?? `manual-${venta.id}`,
        titulo: venta.producto_titulo,
        categoria: venta.categoria || undefined,
        imagen_url: venta.imagen_url || undefined,
        talla_especifica: venta.talla,
        costo: Number(venta.costo) || 0,
        precio: Number(venta.pvp) || 0,
        fecha_venta: venta.fecha_venta,
        cantidad: venta.cantidad,
        clave: `manual-${venta.id}`,
        origen: 'manual',
        ventaManualId: venta.id
      });
    });
    return desglosadas.sort(
      (a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime()
    );
  }, [listaPedidos, ventasManuales]);

  const tallasVendidas = useMemo(
    () => new Set(
      ventasDesglosadas
        .filter(venta => venta.talla_especifica !== 'N/A')
        .map(venta => `${venta.id}:${venta.talla_especifica}`)
    ),
    [ventasDesglosadas]
  );

  const stockProyeccion = useMemo(
    () => agruparProductosPorProducto(productos, parseTallasseguro, tallasVendidas),
    [productos, parseTallasseguro, tallasVendidas]
  );

  useEffect(() => {
    if (!ventaPorDeshacer) return;

    const appContainer = document.querySelector<HTMLElement>('#root > div');
    const previousBodyOverflow = document.body.style.overflow;
    const previousAppOverflowY = appContainer?.style.overflowY;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deshaciendoVenta) setVentaPorDeshacer(null);
    };

    document.body.style.overflow = 'hidden';
    if (appContainer) appContainer.style.overflowY = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (appContainer && previousAppOverflowY !== undefined) appContainer.style.overflowY = previousAppOverflowY;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [ventaPorDeshacer, deshaciendoVenta]);

  const publicarProducto = async (id: string | number) => {
    const { data, error } = await supabase.from('productos').update({ publicado: true }).eq('id', id).select().single();
    if (!error && data) setProductos(current => current.map(product => product.id === id ? data : product));
  };

  const deshacerVenta = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ventaPorDeshacer) return;
    setDeshaciendoVenta(true);
    setErrorDeshacer('');

    const { error } = ventaPorDeshacer.origen === 'manual'
      ? await supabase.rpc('deshacer_venta_manual', {
        p_venta_id: ventaPorDeshacer.ventaManualId,
        p_password: contrasenaDeshacer
      })
      : await supabase.rpc('deshacer_venta_pedido', {
        p_pedido_id: ventaPorDeshacer.pedidoId,
        p_item_index: ventaPorDeshacer.pedidoItemIndex,
        p_password: contrasenaDeshacer
      });

    if (error) {
      console.error('No se pudo deshacer la venta:', error);
      setErrorDeshacer(error.message.includes('Contraseña incorrecta')
        ? 'La contraseña no es correcta.'
        : `No se pudo deshacer la venta: ${error.message}`);
      setDeshaciendoVenta(false);
      return;
    }

    setVentaPorDeshacer(null);
    setContrasenaDeshacer('');
    setDeshaciendoVenta(false);
    await Promise.all([fetchProductos(), fetchSales()]);
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
                <div className="text-white/80 font-bold">
                  {item.tallas.length
                    ? item.tallas.map((talla, index) => (
                      <span key={talla.talla} className={talla.agotada ? 'text-red-400' : ''} title={talla.agotada ? 'Talla agotada' : undefined}>
                        {index > 0 ? ', ' : ''}{talla.talla}
                      </span>
                    ))
                    : '-'}
                </div>
                <div className={item.existencias === 0 ? 'text-red-400 font-bold' : 'text-white/80'} title={item.existencias === 0 ? 'Agotado' : undefined}>
                  {item.existencias}
                </div>
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
        {errorVentas && <p role="alert" className="mb-4 text-xs text-red-400">{errorVentas}</p>}
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-7 gap-4 text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-500 border-b border-white/10 pb-4 mb-4 font-bold text-center">
            <div className="col-span-2 text-left pl-4">Pieza Vendida</div>
            <div>Fecha</div>
            <div>Talla</div>
            <div>Costo</div>
            <div>PVP</div>
            <div>Ganancia Neta</div>
          </div>
          {ventasDesglosadas.map(item => {
            const ganancia = (item.precio - item.costo) * item.cantidad;
            const fecha = item.fecha_venta
              ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(item.fecha_venta))
              : '-';
            return (
              <div key={item.clave} className="grid grid-cols-7 gap-4 text-[10px] md:text-xs tracking-[0.1em] text-white border-b border-white/5 py-4 items-center text-center hover:bg-white/5 transition-colors duration-300 px-4 rounded-sm">
                <div className="col-span-2 flex items-center gap-4 text-left">
                  <img loading="lazy" src={item.imagen_url} alt={item.titulo} className="w-12 h-12 object-contain bg-black/60 rounded-sm shadow-inner p-1 opacity-70 filter grayscale hover:grayscale-0 transition-all" />
                  <div className="flex flex-col truncate">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="uppercase truncate text-gray-300 font-bold">{item.titulo}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setVentaPorDeshacer(item);
                          setContrasenaDeshacer('');
                          setErrorDeshacer('');
                        }}
                        className="shrink-0 text-gray-400 hover:text-white transition-colors"
                        aria-label={`Deshacer venta de ${item.titulo}`}
                        title="Deshacer venta"
                      >
                        <RotateCcw size={14} aria-hidden="true" />
                      </button>
                    </div>
                    <span className="text-[8px] text-gray-500 uppercase mt-1 truncate tracking-[0.2em]">{item.categoria}{item.cantidad > 1 ? ` · ${item.cantidad} unidades` : ''}</span>
                  </div>
                </div>
                <div className="text-gray-400">{fecha}</div>
                <div className="text-white/80 font-bold">{item.talla_especifica}</div>
                <div className="text-gray-400">{formatCurrency.format(item.costo)}</div>
                <div className="text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{formatCurrency.format(item.precio)}</div>
                <div className="text-[#a8b8d0] font-bold drop-shadow-[0_0_8px_rgba(168,184,208,0.5)]">{ganancia >= 0 ? '+' : ''}{formatCurrency.format(ganancia)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {ventaPorDeshacer && createPortal(
        <div className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center overflow-y-auto bg-black/80 p-4" onClick={() => !deshaciendoVenta && setVentaPorDeshacer(null)}>
          <form
            className="glass-panel my-auto w-full max-w-md p-6 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="undo-sale-title"
            onSubmit={deshacerVenta}
            onClick={event => event.stopPropagation()}
          >
            <h3 id="undo-sale-title" className="text-sm tracking-[0.2em] uppercase text-white mb-3">Deshacer venta</h3>
            <p className="text-xs text-gray-400 mb-5">
              Se restaurará el stock de {ventaPorDeshacer.titulo} y se eliminará la venta del historial.
            </p>
            <label htmlFor="undo-sale-password" className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-2">Contraseña</label>
            <input
              id="undo-sale-password"
              type="password"
              value={contrasenaDeshacer}
              onChange={event => setContrasenaDeshacer(event.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              className="w-full bg-black/50 border border-white/20 px-3 py-2 text-white outline-none focus:border-white/60"
            />
            {errorDeshacer && <p role="alert" className="text-xs text-red-400 mt-3">{errorDeshacer}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" disabled={deshaciendoVenta} onClick={() => setVentaPorDeshacer(null)} className="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-400 hover:text-white disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={deshaciendoVenta || !contrasenaDeshacer} className="px-4 py-2 text-[10px] uppercase tracking-widest bg-white text-black disabled:opacity-50">
                {deshaciendoVenta ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </section>
  );
}