export const LOGO_URL = "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/aa.png"; 
export const FONDO_HEADER_URL = "/fondo-header.png"; 

export const getMockupUrl = (prenda: string, vista: string) => {
  if (prenda === 'Capucha') return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/IMG_1120.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/IMG_1121.png";
  if (prenda === 'Buso') return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/85.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/86.png";
  if (prenda === 'Hoodie') return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/83.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/84.png";
  return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/81.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/82.png";
};

export const tallasDisponibles = ['6', '7', '8', '9', '10', '11', '12'];
export const sectoresQuito = [
  { nombre: 'Quito Centro', precio: 1.00 },
  { nombre: 'Quito Sur (Quitumbe)', precio: 1.50 },
  { nombre: 'Quito Sur (De Quitumbe hacia el sur)', precio: 2.00 },
  { nombre: 'Quito Norte', precio: 2.00 },
  { nombre: 'Tumbaco', precio: 2.50 },
  { nombre: 'Los Chillos', precio: 2.00 },
  { nombre: 'Provincias', precio: 6.50 },
];

export const coloresPredeterminados = [
  {name: 'Blanco Original', hex: '#ffffff'}, 
  {name: 'Negro', hex: '#111111'}
];

export const estructuraCatalogo: Record<string, string[]> = {
  'Atelier': ['Joyería Exclusiva', 'Prêt-à-Porter'],
  'Joyería': ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
  'Esenciales': ['Básicos de Joyería', 'Básicos de Vestuario'],
  'Sartorial': ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones']
};

export const subcategoriasJoyeria = ['Todo', 'Anillos', 'Pulseras', 'Collares', 'Aretes', 'Piercings'];

export const parseTallasseguro = (tallasData: any) => {
  if (!tallasData) return {};
  if (typeof tallasData === 'object') return tallasData;
  try {
    const parsed = JSON.parse(tallasData);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed;
  } catch (e) {}
  if (typeof tallasData === 'string') {
    const obj: any = {};
    tallasData.split(',').forEach((t: string) => { 
      const val = t.trim();
      if(val) obj[val] = 1; 
    });
    return obj;
  }
  return {};
};

export const isAllSelected = (menuPrincipal: string, categoriasDescarga: string[]) => estructuraCatalogo[menuPrincipal].every(sub => categoriasDescarga.includes(sub));

export const cristalOpacoSubmenuClass = "flex flex-col bg-white/5 backdrop-blur-xl py-6 px-8 shadow-none border border-white/10"; 
export const menuUnderlineClass = "absolute bottom-0 h-px bg-white transition-all duration-500";