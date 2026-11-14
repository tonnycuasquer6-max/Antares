import { createContext } from 'react';
import type { Product, CartItem, Star, TallasType } from '../types';

export interface ShopContextType {
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

export const ShopContext = createContext<ShopContextType | undefined>(undefined);
