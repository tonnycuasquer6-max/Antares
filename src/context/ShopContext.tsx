import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { ShopContext, type ShopContextType } from './shop-context';
import type { Product, CartItem, Star, TallasType } from '../types';
const CONFIG_HIDDEN_ITEMS_KEY = 'antares_hidden_items';
const TALLAS_DISPONIBLES = ['5', '6', '7', '8', '9', '10', '11', '12'];
const SUBCATEGORIAS_JOYERIA = ['Todo', 'Anillos', 'Pulseras', 'Collares', 'Aretes', 'Piercings'];
const ESTRUCTURA_CATALOGO: Record<string, string[]> = {
  Atelier: ['Joyería Exclusiva', 'Prêt-à-Porter'],
  Joyería: ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
  Esenciales: ['Básicos de Joyería', 'Básicos de Vestuario'],
  Sartorial: ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones']
};

const queryProductos = (isAdmin: boolean) => {
  const table = isAdmin ? 'productos' : 'productos_publicos';
  return supabase.from(table).select('*').order('id', { ascending: false });
};

const parseTallasseguro = (tallasData: Product['tallas']): TallasType => {
  if (!tallasData) return {};
  if (typeof tallasData === 'object') return tallasData;

  try {
    const parsed: unknown = JSON.parse(tallasData);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => typeof value === 'number' || typeof value === 'string')
      );
    }
  } catch {
    // Legacy comma-separated sizes are parsed below.
  }

  const tallas: TallasType = {};
  tallasData.split(',').forEach(talla => {
    const valor = talla.trim();
    if (valor) tallas[valor] = 1;
  });
  return tallas;
};

const normalizeMenuKey = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const normalizeHiddenItems = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map(item => normalizeMenuKey(item))
      .filter(Boolean)
  )];
};

const readStoredHiddenItems = (): string[] => {
  try {
    const stored = localStorage.getItem(CONFIG_HIDDEN_ITEMS_KEY);
    if (!stored) return [];
    return normalizeHiddenItems(JSON.parse(stored));
  } catch {
    return [];
  }
};

const persistHiddenItems = (items: string[]) => {
  try {
    localStorage.setItem(CONFIG_HIDDEN_ITEMS_KEY, JSON.stringify(items));
  } catch {
    // no-op
  }
};

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const { userRole } = useAuth();
  const [productos, setProductos] = useState<Product[]>([]);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [favoritos, setFavoritos] = useState<(string | number)[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>(() => readStoredHiddenItems());
  const [stars, setStars] = useState<Star[]>([]);
  const [cartPulse, setCartPulse] = useState(false);

  const fetchProductos = useCallback(async () => {
    const { data, error } = await queryProductos(userRole === 'admin');
    if (error) {
      console.error('No se pudieron cargar los productos:', error);
      return;
    }
    if (data) setProductos(data);
  }, [userRole]);

  const fetchConfiguracion = useCallback(async (isActive: () => boolean = () => true) => {
    const { data } = await supabase.from('configuracion').select('menus_ocultos').eq('id', 1).maybeSingle();
    if (!isActive()) return;
    const nextHiddenItems = normalizeHiddenItems(data?.menus_ocultos);
    const finalHiddenItems = nextHiddenItems.length > 0 ? nextHiddenItems : readStoredHiddenItems();
    setHiddenItems(current => {
      if (current.length === finalHiddenItems.length && current.every(item => finalHiddenItems.includes(item))) return current;
      persistHiddenItems(finalHiddenItems);
      return finalHiddenItems;
    });
  }, []);

  useEffect(() => {
    persistHiddenItems(hiddenItems);
  }, [hiddenItems]);

  useEffect(() => {
    let isCurrent = true;
    const loadInitialProducts = async () => {
      const { data, error } = await queryProductos(userRole === 'admin');
      if (error) {
        console.error('No se pudieron cargar los productos:', error);
        return;
      }
      if (isCurrent && data) setProductos(data);
    };

    const loadInitialData = async () => {
      await Promise.all([loadInitialProducts(), fetchConfiguracion(() => isCurrent)]);
    };
    void loadInitialData();
    return () => {
      isCurrent = false;
    };
  }, [fetchConfiguracion, userRole]);

  useEffect(() => {
    let isCurrent = true;
    const refreshConfiguracion = () => { void fetchConfiguracion(() => isCurrent); };
    const channel = supabase
      .channel('configuracion-menu-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracion', filter: 'id=eq.1' }, refreshConfiguracion)
      .subscribe();

    window.addEventListener('focus', refreshConfiguracion);
    return () => {
      isCurrent = false;
      window.removeEventListener('focus', refreshConfiguracion);
      void supabase.removeChannel(channel);
    };
  }, [fetchConfiguracion]);

  const triggerStarAnimation = useCallback((e: React.MouseEvent) => {
    if (!e || !e.currentTarget) return;
    const cart = document.getElementById('cart-icon');
    const cartRect = cart?.getBoundingClientRect();
    const id = Date.now();
    const startX = e.clientX;
    const startY = e.clientY;
    const targetX = cartRect ? cartRect.left + (cartRect.width / 2) : startX;
    const targetY = cartRect ? cartRect.top + (cartRect.height / 2) : startY;
    
    setStars(prev => [...prev, { id, x: startX, y: startY, targetX, targetY, active: false }]);
    
    setTimeout(() => {
      setStars(prev => prev.filter(s => s.id !== id));
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 400); 
    }, 720);
  }, []);

  const agregarAlCarrito = useCallback((producto: Product, tallasSeleccionadas: string[], e?: React.MouseEvent, cantidad = 1, cantidadesPorTalla: Record<string, number> = {}) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      triggerStarAnimation(e);
    }

    const isRing = producto.subcategoria?.toLowerCase().trim() === 'anillos';

    setCarrito(prev => {
      const newCart = [...prev];
      if (isRing) {
        const tallasObj = parseTallasseguro(producto.tallas);
        tallasSeleccionadas.forEach(talla => {
          const maxForTalla = parseInt(String(tallasObj[talla] || 0));
          const cantidadSolicitada = Math.max(0, Math.min(cantidadesPorTalla[talla] || cantidad, maxForTalla));
          const index = newCart.findIndex(item => item.id === producto.id && item.tallaSeleccionada === talla);
          if (cantidadSolicitada === 0) return;
          if (index > -1) {
            newCart[index].cantidad = Math.min(newCart[index].cantidad + cantidadSolicitada, maxForTalla);
          } else {
            newCart.push({ ...producto, tallaSeleccionada: talla, cantidad: cantidadSolicitada, stockMaximo: maxForTalla });
          }
        });
      } else {
        const stockMax = parseInt(String(producto.disponibilidad)) || 99;
        const index = newCart.findIndex(item => item.id === producto.id);
        if (index > -1) {
          newCart[index].cantidad = Math.min(newCart[index].cantidad + cantidad, stockMax);
        } else {
          newCart.push({ ...producto, cantidad: Math.min(cantidad, stockMax), stockMaximo: stockMax });
        }
      }
      return newCart;
    });
  }, [triggerStarAnimation]);

  const updateCantidad = useCallback((id: string | number, tallaSeleccionada: string | undefined, delta: number) => {
    setCarrito(prev => prev.map(item => {
      if (item.id === id && item.tallaSeleccionada === tallaSeleccionada) {
        const nuevaCantidad = Math.max(1, Math.min((item.cantidad || 1) + delta, item.stockMaximo));
        return { ...item, cantidad: nuevaCantidad };
      }
      return item;
    }));
  }, []);

  const toggleFavorito = useCallback((id: string | number) => {
    setFavoritos(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  }, []);

  const value = useMemo<ShopContextType>(() => ({
    productos, setProductos,
    carrito, setCarrito,
    favoritos, setFavoritos,
    hiddenItems, setHiddenItems,
    stars, cartPulse,
    tallasDisponibles: TALLAS_DISPONIBLES,
    estructuraCatalogo: ESTRUCTURA_CATALOGO,
    subcategoriasJoyeria: SUBCATEGORIAS_JOYERIA,
    parseTallasseguro, triggerStarAnimation, agregarAlCarrito, updateCantidad, toggleFavorito, fetchProductos
  }), [
    productos, carrito, favoritos, hiddenItems, stars, cartPulse,
    fetchProductos, triggerStarAnimation, agregarAlCarrito, updateCantidad, toggleFavorito
  ]);

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};