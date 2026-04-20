// Tipos para Productos
export interface Product {
  id: string | number;
  titulo: string;
  descripcion: string;
  costo: number;
  precio: number;
  categoria: string;
  disponibilidad: string | number;
  subcategoria: string;
  color: string;
  tallas: Record<string, number> | string | null;
  imagen_url: string;
  vendido: boolean;
  vendidos: number;
  created_at?: string;
}

export interface CartItem extends Product {
  cantidad: number;
  stockMaximo: number;
  tallaSeleccionada?: string;
}

export interface Star {
  id: number;
  x: number;
  y: number;
  active: boolean;
}

export interface PerfilForm {
  tratamiento: string;
  nombre: string;
  apellidos: string;
  dia: string;
  mes: string;
  anio: string;
  prefijo: string;
  telefono: string;
  newsletter: boolean;
}

export interface PedidoData {
  id: string | number;
  cliente_nombre: string;
  cliente_telefono: string;
  productos: string;
  total_envio: number;
  estado: 'En progreso' | 'Completado' | 'Cancelado';
  comprobante_url: string;
  link_maps: string;
  created_at?: string;
}

export interface EnvioConfig {
  tipo: 'local' | 'domicilio';
  sectorPrecio: number;
  sectorNombre: string;
  linkMaps: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface NuevaPieza {
  titulo: string;
  descripcion: string;
  costo: string | number;
  precio: string | number;
  disponibilidad: string;
  subcategoria: string;
  tallas: Record<string, any>;
  color: string;
  imagen: File | null;
  imagen_url: string;
}

export interface Sector {
  nombre: string;
  precio: number;
}

export type TallasType = Record<string, number | string>;
