import { useMemo, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, DollarSign, Download, Info, Package, Percent, RotateCcw, Search, TrendingUp, X } from 'lucide-react';
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
  porcentaje_inversionista?: string | number;
  retiro_socio?: boolean;
};

type VentaDesglosada = Pick<Product, 'id' | 'titulo' | 'costo' | 'precio'> & {
  categoria?: string;
  imagen_url?: string;
  porcentaje_inversionista: number;
  retiro_socio: boolean;
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
  retiro_socio?: boolean;
};

type PeriodoVentas = 'este-mes' | 'mes-pasado' | 'ultimos-3-meses' | 'todo';

const parseFechaVenta = (fecha: string): Date | null => {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(fecha);
  return Number.isNaN(date.getTime()) ? null : date;
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
  && (!('porcentaje_inversionista' in value) || typeof value.porcentaje_inversionista === 'string' || typeof value.porcentaje_inversionista === 'number')
  && (!('retiro_socio' in value) || typeof value.retiro_socio === 'boolean')
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
  const [periodoVentas, setPeriodoVentas] = useState<PeriodoVentas>('todo');
  const [busquedaVentas, setBusquedaVentas] = useState('');
  const [isRankingVisible, setIsRankingVisible] = useState(false);
  const [isRetirosModalOpen, setIsRetirosModalOpen] = useState(false);
  const formatCurrency = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    []
  );
  const formatPercentage = useMemo(
    () => new Intl.NumberFormat('es-ES', { style: 'percent', maximumFractionDigits: 1 }),
    []
  );
  const formatDate = useMemo(
    () => new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeZone: 'UTC' }),
    []
  );

  useEffect(() => {
    const channel = supabase
      .channel('realtime-productos')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'productos' }, payload => {
        setProductos(prevProductos =>
          prevProductos.map(producto =>
            producto.id === payload.new.id ? { ...producto, ...payload.new } : producto
          )
        );
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [setProductos]);

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
    const productosPorId = new Map(productos.map(producto => [String(producto.id), producto]));
    const porcentajeInversionista = (id: string | number, porcentajeGuardado?: string | number) => {
      const porcentaje = Number(porcentajeGuardado ?? productosPorId.get(String(id))?.porcentaje_inversionista ?? 0);
      return Number.isFinite(porcentaje) ? Math.min(100, Math.max(0, porcentaje)) : 0;
    };

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
            porcentaje_inversionista: porcentajeInversionista(value.id, value.porcentaje_inversionista),
            retiro_socio: ped.retiro_socio === true || value.retiro_socio === true,
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
        porcentaje_inversionista: porcentajeInversionista(venta.producto_id ?? `manual-${venta.id}`),
        retiro_socio: venta.retiro_socio === true,
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
  }, [listaPedidos, ventasManuales, productos]);

  const ventasFiltradas = useMemo(() => {
    const now = new Date();
    const inicioEsteMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const inicioMesPasado = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const inicioUltimosTresMeses = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const query = busquedaVentas.trim().toLocaleLowerCase('es');

    return ventasDesglosadas.filter(venta => {
      const fecha = parseFechaVenta(venta.fecha_venta);
      if (periodoVentas !== 'todo') {
        if (!fecha) return false;
        if (periodoVentas === 'este-mes' && fecha < inicioEsteMes) return false;
        if (periodoVentas === 'mes-pasado' && (fecha < inicioMesPasado || fecha >= inicioEsteMes)) return false;
        if (periodoVentas === 'ultimos-3-meses' && fecha < inicioUltimosTresMeses) return false;
      }

      if (!query) return true;
      const pedidoId = venta.pedidoId === undefined ? 'venta manual' : String(venta.pedidoId);
      return [venta.titulo, venta.talla_especifica, pedidoId]
        .some(value => value.toLocaleLowerCase('es').includes(query));
    });
  }, [ventasDesglosadas, periodoVentas, busquedaVentas]);

  const resumenVentas = useMemo(() => {
    const totales = ventasFiltradas.reduce((resumen, venta) => {
      resumen.ingresos += venta.precio * venta.cantidad;
      resumen.costo += venta.costo * venta.cantidad;
      return resumen;
    }, { ingresos: 0, costo: 0 });
    const ventasParaMargen = ventasFiltradas.filter(venta => !venta.retiro_socio);
    const ingresosParaMargen = ventasParaMargen.reduce(
      (total, venta) => total + venta.precio * venta.cantidad,
      0
    );
    const gananciaParaMargen = ventasParaMargen.reduce(
      (total, venta) => total + (venta.precio - venta.costo) * venta.cantidad,
      0
    );
    const gananciaNeta = totales.ingresos - totales.costo;

    return {
      ...totales,
      gananciaNeta,
      margen: ingresosParaMargen === 0 ? 0 : gananciaParaMargen / ingresosParaMargen
    };
  }, [ventasFiltradas]);

  const distribucionCapital = useMemo(
    () => ventasFiltradas
      .filter(venta => !venta.retiro_socio && venta.porcentaje_inversionista > 0)
      .reduce((totales, venta) => {
        const ingresos = venta.precio * venta.cantidad;
        totales.admin += ingresos * (100 - venta.porcentaje_inversionista) / 100;
        totales.inversionista += ingresos * venta.porcentaje_inversionista / 100;
        return totales;
      }, { admin: 0, inversionista: 0 }),
    [ventasFiltradas]
  );

  const retirosSocio = useMemo(
    () => ventasDesglosadas.filter(venta => venta.retiro_socio),
    [ventasDesglosadas]
  );

  const rankingProductos = useMemo(() => {
    const productosAgrupados = new Map<string, {
      nombre: string;
      unidades: number;
      ingresos: number;
      gananciaNeta: number;
    }>();

    ventasDesglosadas.forEach(venta => {
      const clave = venta.titulo.trim().toLocaleLowerCase('es');
      const resumen = productosAgrupados.get(clave) ?? {
        nombre: venta.titulo,
        unidades: 0,
        ingresos: 0,
        gananciaNeta: 0
      };
      resumen.unidades += venta.cantidad;
      resumen.ingresos += venta.precio * venta.cantidad;
      resumen.gananciaNeta += (venta.precio - venta.costo) * venta.cantidad;
      productosAgrupados.set(clave, resumen);
    });

    return [...productosAgrupados.values()].sort(
      (a, b) => b.unidades - a.unidades || b.ingresos - a.ingresos || a.nombre.localeCompare(b.nombre, 'es')
    );
  }, [ventasDesglosadas]);

  const exportarVentasCSV = () => {
    const escaparCampo = (valor: string | number) => `"${String(valor).replaceAll('"', '""')}"`;
    const filas = [
      ['Pieza', 'Fecha', 'Talla', 'ID de Pedido', 'Cantidad', 'Costo unitario (USD)', 'PVP unitario (USD)', 'Ganancia neta (USD)', 'Margen (%)'],
      ...ventasFiltradas.map(venta => {
        const fecha = /^\d{4}-\d{2}-\d{2}$/.test(venta.fecha_venta)
          ? new Date(`${venta.fecha_venta}T00:00:00Z`)
          : parseFechaVenta(venta.fecha_venta);
        const ganancia = (venta.precio - venta.costo) * venta.cantidad;
        const margen = venta.precio === 0 ? 0 : ((venta.precio - venta.costo) / venta.precio) * 100;

        return [
          venta.titulo,
          fecha ? formatDate.format(fecha) : '',
          venta.talla_especifica,
          venta.pedidoId === undefined ? 'Venta manual' : String(venta.pedidoId),
          venta.cantidad,
          venta.costo,
          venta.precio,
          ganancia.toFixed(2),
          margen.toFixed(1)
        ];
      })
    ];
    const contenidoCSV = `\uFEFF${filas.map(fila => fila.map(escaparCampo).join(';')).join('\r\n')}`;
    const archivo = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `historial-ventas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  };

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

  useEffect(() => {
    if (!isRetirosModalOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const appContainer = document.querySelector<HTMLElement>('#root > div');
    const previousAppOverflowY = appContainer?.style.overflowY;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsRetirosModalOpen(false);
    };

    document.body.style.overflow = 'hidden';
    if (appContainer) appContainer.style.overflowY = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (appContainer && previousAppOverflowY !== undefined) appContainer.style.overflowY = previousAppOverflowY;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isRetirosModalOpen]);

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
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-8 gap-4 text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-500 border-b border-white/10 pb-4 mb-4 font-bold text-center">
            <div className="col-span-2 text-left pl-4">Pieza</div>
            <div>Talla</div>
            <div>Stock</div>
            <div>Costo</div>
            <div>Precio</div>
            <div>Ganancia Potencial</div>
            <div>FACEBOOK</div>
          </div>
          {stockProyeccion.map(item => {
            const costo = Number.parseFloat(String(item.costo)) || 0;
            const precio = Number.parseFloat(String(item.precio)) || 0;
            const ganancia = (precio - costo) * item.existencias;
            const facebookStatusColor = item.estado_facebook === 'publicado'
              ? 'bg-blue-500'
              : item.estado_facebook === 'error'
                ? 'bg-red-500'
                : 'bg-gray-300';
            return (
              <div key={`inv-${item.id}`} className="grid grid-cols-8 gap-4 text-[10px] md:text-xs tracking-[0.1em] text-white border-b border-white/5 py-1 items-center text-center hover:bg-white/5 transition-colors duration-300 px-4 rounded-sm">
                <div className="col-span-2 flex items-center gap-4 text-left">
                  <button type="button" onClick={() => !item.publicado && publicarProducto(item.id)} className={`inventory-status-dot ${item.vendido ? 'is-sold-out' : item.publicado ? 'is-published' : 'is-draft'}`} title={item.vendido ? 'Agotado' : item.publicado ? 'Publicado' : 'Guardar y publicar'} aria-label={item.vendido ? 'Agotado' : item.publicado ? 'Publicado' : 'Publicar producto'} />
                  <div className="w-24 h-24 shrink-0 overflow-hidden rounded-md bg-black/60 shadow-inner">
                    <img loading="lazy" src={item.imagen_url} alt={item.titulo} className="w-full h-full object-cover rounded-md" />
                  </div>
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
                <div className="flex items-center justify-center">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${facebookStatusColor}`} title={`Estado de Facebook: ${item.estado_facebook || 'no publicado'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-4 md:p-8 w-full overflow-x-auto rounded-sm">
        <h3 className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-white mb-6 drop-shadow-md">Dashboard Financiero · Historial de Ventas</h3>
        {errorVentas && <p role="alert" className="mb-4 text-xs text-red-400">{errorVentas}</p>}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative block w-full md:max-w-sm">
            <Search size={15} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={busquedaVentas}
              onChange={event => setBusquedaVentas(event.target.value)}
              placeholder="Buscar pieza, talla o pedido..."
              aria-label="Buscar ventas por pieza, talla o pedido"
              className="w-full border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-600 focus:border-white/30"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Periodo
              <select
                value={periodoVentas}
                onChange={event => setPeriodoVentas(event.target.value as PeriodoVentas)}
                className="border border-white/10 bg-black/60 px-3 py-2 text-xs normal-case tracking-normal text-white outline-none focus:border-white/30"
              >
                <option value="este-mes">Este mes</option>
                <option value="mes-pasado">Mes pasado</option>
                <option value="ultimos-3-meses">Últimos 3 meses</option>
                <option value="todo">Todo</option>
              </select>
            </label>
            <button
              type="button"
              onClick={exportarVentasCSV}
              disabled={ventasFiltradas.length === 0}
              className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-300 transition-colors hover:border-white/30 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={13} aria-hidden="true" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={() => setIsRankingVisible(visible => !visible)}
              aria-expanded={isRankingVisible}
              aria-controls="ranking-productos"
              className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-300 transition-colors hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              {isRankingVisible ? 'Ocultar Ranking' : 'Ver Ranking de Productos'}
              {isRankingVisible
                ? <ChevronUp size={13} aria-hidden="true" />
                : <ChevronDown size={13} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          {[
            { label: 'Ingresos totales', value: resumenVentas.ingresos, Icon: DollarSign, detail: 'Ventas registradas' },
            { label: 'Costo de mercancía', value: resumenVentas.costo, Icon: Package, detail: 'COGS · costo base' },
            { label: 'Ganancia neta total', value: resumenVentas.gananciaNeta, Icon: TrendingUp, detail: 'Ingresos menos costos' }
          ].map(({ label, value, Icon, detail }) => (
            <article key={label} className="glass-panel rounded-sm border border-white/5 bg-white/[0.03] p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">{label}</p>
                <Icon size={16} aria-hidden="true" className="text-[#a8b8d0]" />
              </div>
              <p className="text-xl font-bold tracking-wide text-white md:text-2xl">{formatCurrency.format(value)}</p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-gray-600">{detail}</p>
            </article>
          ))}
          <article className="glass-panel rounded-sm border border-white/5 bg-white/[0.03] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Margen de rentabilidad</p>
              <Percent size={16} aria-hidden="true" className="text-[#a8b8d0]" />
            </div>
            <p className="text-xl font-bold tracking-wide text-white md:text-2xl">{formatPercentage.format(resumenVentas.margen)}</p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-gray-600">Ganancia sobre ingresos · sin retiros</p>
          </article>
          <article className="glass-panel rounded-sm border border-white/5 bg-white/[0.03] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Capital Admin</p>
              <DollarSign size={16} aria-hidden="true" className="text-[#a8b8d0]" />
            </div>
            <p className="text-xl font-bold tracking-wide text-white md:text-2xl">{formatCurrency.format(distribucionCapital.admin)}</p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-gray-600">Ventas con participación · retiros excluidos</p>
          </article>
          <article className="glass-panel rounded-sm border border-white/5 bg-white/[0.03] p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Capital Inversionista</p>
              <button
                type="button"
                onClick={() => setIsRetirosModalOpen(true)}
                aria-label="Abrir historial de retiros de socio"
                aria-haspopup="dialog"
                className="text-[#a8b8d0] transition-colors hover:text-white"
              >
                <Info size={16} aria-hidden="true" />
              </button>
            </div>
            <p className="text-xl font-bold tracking-wide text-white md:text-2xl">{formatCurrency.format(distribucionCapital.inversionista)}</p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-gray-600">Ventas con participación · retiros excluidos</p>
          </article>
        </div>

        {isRankingVisible && <section id="ranking-productos" aria-labelledby="ranking-productos-title" className="glass-panel mb-8 rounded-sm border border-white/5 bg-white/[0.02] p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-1 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 id="ranking-productos-title" className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                Ranking de rendimiento de productos
              </h4>
              <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-gray-600">
                Historial completo · ordenado por unidades vendidas
              </p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.15em] text-gray-600">
              {rankingProductos.length} {rankingProductos.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto pr-1">
            {rankingProductos.length > 0 ? (
              <ol className="divide-y divide-white/5">
                {rankingProductos.map((producto, index) => (
                  <li key={producto.nombre.trim().toLocaleLowerCase('es')} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[2rem_minmax(0,1fr)_auto_auto_auto] sm:gap-5">
                    <span className="text-center text-[10px] font-bold tabular-nums text-gray-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-gray-200" title={producto.nombre}>
                      {producto.nombre}
                    </span>
                    <span className="text-right text-[9px] text-gray-400">
                      <span className="block font-bold text-white">{producto.unidades}</span>
                      unidades
                    </span>
                    <span className="col-start-2 text-[9px] text-gray-500 sm:col-start-auto sm:text-right">
                      <span className="block font-bold text-[#a8b8d0]">{formatCurrency.format(producto.ingresos)}</span>
                      Ingresos
                    </span>
                    <span className="col-start-3 row-start-2 text-right text-[9px] text-gray-500 sm:col-start-auto sm:row-start-auto">
                      <span className="block font-bold text-emerald-300/80">{formatCurrency.format(producto.gananciaNeta)}</span>
                      Ganancia neta
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-8 text-center text-[10px] uppercase tracking-[0.15em] text-gray-600">
                Aún no hay ventas para generar el ranking.
              </p>
            )}
          </div>
        </section>}

        <div className="min-w-[1450px]">
          <div className="grid grid-cols-9 gap-4 text-[10px] md:text-xs tracking-[0.3em] uppercase text-gray-500 border-b border-white/10 pb-4 mb-4 font-bold text-center">
            <div className="col-span-2 text-left pl-4">Pieza Vendida</div>
            <div>Fecha</div>
            <div>Talla</div>
            <div>ID de Pedido</div>
            <div>Costo</div>
            <div>PVP</div>
            <div>Ganancia Neta</div>
            <div>Margen %</div>
          </div>
          {ventasFiltradas.map(item => {
            const ganancia = (item.precio - item.costo) * item.cantidad;
            const margen = item.precio === 0 ? 0 : (item.precio - item.costo) / item.precio;
            const fechaVenta = parseFechaVenta(item.fecha_venta);
            const fechaFormateada = /^\d{4}-\d{2}-\d{2}$/.test(item.fecha_venta)
              ? new Date(`${item.fecha_venta}T00:00:00Z`)
              : fechaVenta;
            const fecha = fechaFormateada ? formatDate.format(fechaFormateada) : '-';
            return (
              <div key={item.clave} className="grid grid-cols-9 gap-4 text-[10px] md:text-xs tracking-[0.1em] text-white border-b border-white/5 py-4 items-center text-center hover:bg-white/5 transition-colors duration-300 px-4 rounded-sm">
                <div className="col-span-2 flex items-center gap-4 text-left">
                  <img loading="lazy" src={item.imagen_url} alt={item.titulo} className="w-20 h-20 shrink-0 object-cover bg-black/60 rounded-md shadow-inner p-1 opacity-70 filter grayscale hover:grayscale-0 transition-all" />
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
                <div className="text-gray-400">{item.pedidoId === undefined ? 'Venta manual' : `#${item.pedidoId}`}</div>
                <div className="text-gray-400">{formatCurrency.format(item.costo)}</div>
                <div className="text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{formatCurrency.format(item.precio)}</div>
                <div className="text-[#a8b8d0] font-bold drop-shadow-[0_0_8px_rgba(168,184,208,0.5)]">{ganancia >= 0 ? '+' : ''}{formatCurrency.format(ganancia)}</div>
                <div className={margen < 0.3 ? 'font-bold text-amber-300/80' : 'font-bold text-emerald-300/80'}>{formatPercentage.format(margen)}</div>
              </div>
            );
          })}
          {ventasFiltradas.length === 0 && (
            <p className="py-10 text-center text-xs uppercase tracking-[0.15em] text-gray-500">
              No hay ventas para los filtros seleccionados.
            </p>
          )}
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
      {isRetirosModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex min-h-screen items-center justify-center overflow-y-auto bg-black/80 p-4"
          onClick={() => setIsRetirosModalOpen(false)}
        >
          <section
            className="glass-panel my-auto max-h-[85vh] w-full max-w-2xl overflow-hidden border border-white/10 bg-black/90"
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-withdrawals-title"
            onClick={event => event.stopPropagation()}
          >
            <header className="flex items-start justify-between border-b border-white/10 p-5 md:p-6">
              <div>
                <h3 id="partner-withdrawals-title" className="text-sm uppercase tracking-[0.2em] text-white">Historial de Retiros de Socio</h3>
                <p className="mt-2 text-[9px] uppercase tracking-[0.15em] text-gray-500">{retirosSocio.length} {retirosSocio.length === 1 ? 'retiro registrado' : 'retiros registrados'}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRetirosModalOpen(false)}
                aria-label="Cerrar historial de retiros"
                className="p-1 text-gray-500 transition-colors hover:text-white"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="max-h-[65vh] overflow-y-auto p-5 md:p-6">
              {retirosSocio.length > 0 ? (
                <ul className="divide-y divide-white/10">
                  {retirosSocio.map(venta => {
                    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(venta.fecha_venta)
                      ? new Date(`${venta.fecha_venta}T00:00:00Z`)
                      : parseFechaVenta(venta.fecha_venta);
                    return (
                      <li key={venta.clave} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[4rem_minmax(0,1fr)_auto_auto] sm:gap-4">
                        {venta.imagen_url ? (
                          <img src={venta.imagen_url} alt="" className="h-14 w-14 object-cover" />
                        ) : (
                          <div aria-hidden="true" className="h-14 w-14 bg-white/5" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-white" title={venta.titulo}>{venta.titulo}</p>
                          <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-gray-500">
                            {fecha ? formatDate.format(fecha) : venta.fecha_venta || 'Fecha no disponible'}
                            {venta.cantidad > 1 ? ` · ${venta.cantidad} unidades` : ''}
                          </p>
                        </div>
                        <span className="col-start-2 text-[9px] uppercase tracking-[0.12em] text-gray-500 sm:col-start-auto">Costo unitario {formatCurrency.format(venta.costo)}</span>
                        <span className="col-start-3 row-start-1 text-right text-xs font-bold text-white sm:col-start-auto sm:row-start-auto">
                          {formatCurrency.format(venta.costo * venta.cantidad)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-10 text-center text-[10px] uppercase tracking-[0.15em] text-gray-500">Aún no hay retiros de socio registrados.</p>
              )}
            </div>
          </section>
        </div>,
        document.body
      )}
    </section>
  );
}