export * from './types/index';

export type Category = 'ACERO FINO' | 'PLATA 925' | 'GEMAS Y PIEDRAS NATURALES' | '';
export type Subcategory = 'Anillos' | 'Pulseras' | 'Collares' | 'Aretes' | 'Piercings' | '';

export interface CascadePhoto {
  id: string;
  file: File;
  previewUrl: string;
  category: Category;
  subcategory: Subcategory;
  title: string;
  cost: string;
  price: string;
  stock: string;
  jewelry_type: string;
  color: string;
  description: string;
  isPublished?: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  role: 'admin' | 'user' | string;
}
