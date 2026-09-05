import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { Product, CartItem, Star } from '../types';

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
  sectoresQuito: { nombre: string; precio: number }[];
  parseTallasseguro: (tallasData: any) => Record<string, number | string>;
  triggerStarAnimation: (e: React.MouseEvent) => void;
  agregarAlCarrito: (producto: Product, tallasSeleccionadas: string[], e?: React.MouseEvent) => void;
  updateCantidad: (id: string | number, tallaSeleccionada: string | undefined, delta: number) => void;
  toggleFavorito: (id: string | number) => void;
  fetchProductos: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [productos, setProductos] = useState<Product[]>([]);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [favoritos, setFavoritos] = useState<(string | number)[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const [cartPulse, setCartPulse] = useState(false);

  const tallasDisponibles = ['6', '7', '8', '9', '10', '11', '12'];
  const subcategoriasJoyeria = ['Todo', 'Anillos', 'Pulseras', 'Collares', 'Aretes', 'Piercings'];
  const estructuraCatalogo = {
    'Atelier': ['Joyería Exclusiva', 'Prêt-à-Porter'],
    'Joyería': ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
    'Esenciales': ['Básicos de Joyería', 'Básicos de Vestuario'],
    'Sartorial': ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones']
  };
  const sectoresQuito = [
    { nombre: 'Quito Centro', precio: 1.00 },
    { nombre: 'Quito Sur (Quitumbe)', precio: 1.50 },
    { nombre: 'Quito Sur (De Quitumbe hacia el sur)', precio: 2.00 },
    { nombre: 'Quito Norte', precio: 2.00 },
    { nombre: 'Tumbaco', precio: 2.50 },
    { nombre: 'Los Chillos', precio: 2.00 },
    { nombre: 'Provincias', precio: 6.50 },
  ];

  const fetchProductos = useCallback(async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (data) setProductos(data);
  }, []);

  const fetchConfiguracion = useCallback(async () => {
    const { data } = await supabase.from('configuracion').select('menus_ocultos').eq('id', 1).single();
    if (data && data.menus_ocultos) setHiddenItems(data.menus_ocultos);
  }, []);

  useEffect(() => {
    fetchProductos();
    fetchConfiguracion();
  }, [fetchProductos, fetchConfiguracion]);

  const parseTallasseguro = (tallasData: any): Record<string, number | string> => {
    if (!tallasData) return {};
    if (typeof tallasData === 'object') return tallasData;
    try {
      const parsed = JSON.parse(tallasData);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch (e) {}
    if (typeof tallasData === 'string') {
      const obj: Record<string, number> = {};
      tallasData.split(',').forEach(t => { 
        const val = t.trim();
        if(val) obj[val] = 1; 
      });
      return obj;
    }
    return {};
  };

  const triggerStarAnimation = (e: React.MouseEvent) => {
    if (!e || !e.currentTarget) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = Date.now();
    const startX = rect.left + (rect.width / 2);
    const startY = rect.top + (rect.height / 2);
    
    setStars(prev => [...prev, { id, x: startX, y: startY, active: false }]);
    
    setTimeout(() => {
      setStars(prev => prev.map(s => s.id === id ? { ...s, active: true } : s));
    }, 50);
    
    setTimeout(() => {
      setStars(prev => prev.filter(s => s.id !== id));
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 400); 
    }, 700);
  };

  const agregarAlCarrito = (producto: Product, tallasSeleccionadas: string[], e?: React.MouseEvent) => {
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
          const index = newCart.findIndex(item => item.id === producto.id && item.tallaSeleccionada === talla);
          if (index > -1) {
            if (newCart[index].cantidad < maxForTalla) newCart[index].cantidad += 1;
          } else {
            newCart.push({ ...producto, tallaSeleccionada: talla, cantidad: 1, stockMaximo: maxForTalla });
          }
        });
      } else {
        const stockMax = parseInt(String(producto.disponibilidad)) || 99;
        const index = newCart.findIndex(item => item.id === producto.id);
        if (index > -1) {
          if (newCart[index].cantidad < stockMax) newCart[index].cantidad += 1;
        } else {
          newCart.push({ ...producto, cantidad: 1, stockMaximo: stockMax });
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
      tallasDisponibles, estructuraCatalogo, subcategoriasJoyeria, sectoresQuito,
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