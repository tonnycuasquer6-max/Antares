import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { Product, CartItem, Star, TallasType } from '../types';

interface ShopContextType {
  productos: Product[];
  setProductos: React.Dispatch<React.SetStateAction<Product[]>>;
  carrito: CartItem[];
  setCarrito: React.Dispatch<React.SetStateAction<CartItem[]>>;
  favoritos: (string | number)[];
  setFavoritos: React.Dispatch<React.SetStateAction<(string | number)[]>>;
  hiddenItems: string[];
  setHiddenItems: React.Dispatch<React.SetStateAction<string[]>>;
  stars: Star[];
  cartPulse: boolean;
  tallasDisponibles: string[];
  estructuraCatalogo: Record<string, string[]>;
  subcategoriasJoyeria: string[];
  parseTallasseguro: (tallasData: Product['tallas']) => TallasType;
  triggerStarAnimation: (e: React.MouseEvent) => void;
  agregarAlCarrito: (producto: Product, tallasSeleccionadas: string[], e?: React.MouseEvent, cantidad?: number, cantidadesPorTalla?: Record<string, number>) => void;
  updateCantidad: (id: string | number, tallaSeleccionada: string | undefined, delta: number) => void;
  toggleFavorito: (id: string | number) => void;
  fetchProductos: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);
const CONFIG_HIDDEN_ITEMS_KEY = 'antares_hidden_items';
const TALLAS_DISPONIBLES = ['5', '6', '7', '8', '9', '10', '11', '12'];
const SUBCATEGORIAS_JOYERIA = ['Todo', 'Anillos', 'Pulseras', 'Collares', 'Aretes', 'Piercings'];
const ESTRUCTURA_CATALOGO: Record<string, string[]> = {
  Atelier: ['Joyería Exclusiva', 'Prêt-à-Porter'],
  Joyería: ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
  Esenciales: ['Básicos de Joyería', 'Básicos de Vestuario'],
  Sartorial: ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones']
};

const queryProductos = () => supabase.from('productos').select('*').order('id', { ascending: false });

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
  const [productos, setProductos] = useState<Product[]>([]);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [favoritos, setFavoritos] = useState<(string | number)[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>(() => readStoredHiddenItems());
  const [stars, setStars] = useState<Star[]>([]);
  const [cartPulse, setCartPulse] = useState(false);

  const fetchProductos = useCallback(async () => {
    const { data, error } = await queryProductos();
    if (error) {
      console.error('No se pudieron cargar los productos:', error);
      return;
    }
    if (data) setProductos(data);
  }, []);

  const fetchConfiguracion = useCallback(async () => {
    const { data } = await supabase.from('configuracion').select('menus_ocultos').eq('id', 1).maybeSingle();
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
      const { data, error } = await queryProductos();
      if (error) {
        console.error('No se pudieron cargar los productos:', error);
        return;
      }
      if (isCurrent && data) setProductos(data);
    };

    const loadInitialData = async () => {
      await Promise.all([loadInitialProducts(), fetchConfiguracion()]);
    };
    void loadInitialData();
    return () => {
      isCurrent = false;
    };
  }, [fetchConfiguracion]);

  useEffect(() => {
    const refreshConfiguracion = () => { fetchConfiguracion(); };
    const channel = supabase
      .channel('configuracion-menu-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuracion', filter: 'id=eq.1' }, refreshConfiguracion)
      .subscribe();

    window.addEventListener('focus', refreshConfiguracion);
    return () => {
      window.removeEventListener('focus', refreshConfiguracion);
      void supabase.removeChannel(channel);
    };
  }, [fetchConfiguracion]);

  const triggerStarAnimation = (e: React.MouseEvent) => {
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
  };

  const agregarAlCarrito = (producto: Product, tallasSeleccionadas: string[], e?: React.MouseEvent, cantidad = 1, cantidadesPorTalla: Record<string, number> = {}) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      triggerStarAnimation(e);
    }

    const isRing = producto.subcategoria === 'Anillos';

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
  };

  const updateCantidad = (id: string | number, tallaSeleccionada: string | undefined, delta: number) => {
    setCarrito(prev => prev.map(item => {
      if (item.id === id && item.tallaSeleccionada === tallaSeleccionada) {
        const nuevaCantidad = Math.max(1, Math.min((item.cantidad || 1) + delta, item.stockMaximo));
        return { ...item, cantidad: nuevaCantidad };
      }
      return item;
    }));
  };

  const toggleFavorito = (id: string | number) => {
    setFavoritos(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  return (
    <ShopContext.Provider value={{
      productos, setProductos,
      carrito, setCarrito,
      favoritos, setFavoritos,
      hiddenItems, setHiddenItems,
      stars, cartPulse,
      tallasDisponibles: TALLAS_DISPONIBLES,
      estructuraCatalogo: ESTRUCTURA_CATALOGO,
      subcategoriasJoyeria: SUBCATEGORIAS_JOYERIA,
      parseTallasseguro, triggerStarAnimation, agregarAlCarrito, updateCantidad, toggleFavorito, fetchProductos
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};