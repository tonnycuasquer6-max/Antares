import { useState } from 'react';
import { supabase } from '../../services/supabase';
import type { NuevaPieza } from '../../types';

interface BulkProductFormProps {
  onSaved: (products: any[]) => void;
}

interface BulkProduct extends NuevaPieza {
  id: string;
  previewUrl: string;
  margen: number;
  linea: string;
}

const catalog: Record<string, string[]> = {
  Atelier: ['Joyería Exclusiva', 'Prêt-à-Porter'],
  Joyería: ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
  Esenciales: ['Básicos de Joyería', 'Básicos de Vestuario'],
  Sartorial: ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones'],
  Obsequios: ['$5', '$10', '$15', '$20', '$25', '$30', '$35', '$40', '$45', '$50']
};

const jewelrySubcategories = ['Anillos', 'Pulseras', 'Collares', 'Aretes', 'Piercings'];
const ringSizes = ['5', '6', '7', '8', '9', '10', '11', '12'];
const margins = [25, 50, 75, 100, 125, 150];
const detailedLines = new Set(['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales', 'Joyería Exclusiva']);

const emptyProduct = (file: File): BulkProduct => ({
  id: `${file.name}-${file.lastModified}-${Math.random()}`,
  previewUrl: URL.createObjectURL(file),
  titulo: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
  categoria: '',
  descripcion: '',
  costo: '',
  precio: '',
  disponibilidad: '',
  subcategoria: '',
  tallas: {},
  color: '',
  imagen: file,
  imagen_url: '',
  margen: 50,
  linea: ''
});

export default function BulkProductForm({ onSaved }: BulkProductFormProps) {
  const [products, setProducts] = useState<BulkProduct[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<BulkProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const selected = products.find(product => product.id === selectedId) || null;

  const updateProduct = (id: string, changes: Partial<BulkProduct>) => {
    setProducts(current => current.map(product => product.id === id ? { ...product, ...changes } : product));
  };

  const chooseFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 800);
    if (!files.length) return;
    const additions = files.map(emptyProduct);
    setProducts(current => [...current, ...additions].slice(0, 800));
    setSelectedId(additions[0].id);
    event.target.value = '';
  };

  const removeProduct = (id: string) => {
    setProducts(current => {
      const next = current.filter(product => product.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id || null);
      return next;
    });
  };

  const lineOptions = selected?.categoria ? catalog[selected.categoria] || [] : [];
  const needsDetail = selected?.linea === 'Acero Fino' || selected?.linea === 'Plata de Ley 925' || selected?.linea === 'Gemas y Piedras Naturales' || selected?.linea === 'Joyería Exclusiva';

  const calculatedPrice = selected && Number(selected.costo) > 0 ? Number(selected.costo) * (1 + selected.margen / 100) : 0;

  const setMargin = (margin: number) => {
    if (!selected) return;
    updateProduct(selected.id, { margen: margin, precio: Number(selected.costo) > 0 ? (Number(selected.costo) * (1 + margin / 100)).toFixed(2) : '' });
  };

  const saveProduct = async (product: BulkProduct, publish: boolean) => {
    if (!product.titulo.trim() || !product.categoria || !product.subcategoria || !product.precio) {
      setSelectedId(product.id);
      return alert('Completa título, categoría, subcategoría y precio de esta imagen.');
    }
    setSaving(true);
    let imageUrl = product.imagen_url;
    if (product.imagen) {
      const extension = product.imagen.name.split('.').pop() || 'png';
      const fileName = `productos/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('catalogo').upload(fileName, product.imagen);
      if (uploadError) {
        setSaving(false);
        return alert(`No se pudo subir ${product.titulo}: ${uploadError.message}`);
      }
      imageUrl = supabase.storage.from('catalogo').getPublicUrl(fileName).data.publicUrl;
    }

    const payload = {
      titulo: product.titulo.trim(),
      descripcion: product.descripcion.trim(),
      costo: Number(product.costo) || 0,
      precio: Number(product.precio),
      categoria: product.linea || product.categoria,
      subcategoria: product.subcategoria,
      disponibilidad: product.subcategoria === 'Anillos' ? 'Por talla' : (product.disponibilidad || 'Bajo Pedido'),
      publicado: publish,
      color: product.color.trim(),
      tallas: product.subcategoria === 'Anillos' ? product.tallas : null,
      imagen_url: imageUrl
    };
    const { data, error } = await supabase.from('productos').insert(payload).select().single();
    setSaving(false);
    if (error) return alert(`No se pudo guardar ${product.titulo}: ${error.message}`);
    onSaved([data]);
    URL.revokeObjectURL(product.previewUrl);
    setProducts(current => current.filter(item => item.id !== product.id));
    setSelectedId(null);
    setPreviewProduct(null);
    alert(`${product.titulo} se guardó correctamente.`);
  };

  return (
    <div className="liquid-glass p-5 md:p-8 mb-12 rounded-[2rem]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-[10px] md:text-xs tracking-[0.25em] uppercase text-white">Agregar productos</h3>
          <p className="text-[9px] tracking-[0.12em] uppercase text-gray-500 mt-2">Selecciona hasta 800 imágenes y configura cada pieza.</p>
        </div>
        <label className="liquid-button px-7 py-3 text-[9px] font-bold tracking-[0.25em] uppercase cursor-pointer">
          Agregar productos
          <input type="file" accept="image/*" multiple onChange={chooseFiles} className="hidden" />
        </label>
      </div>

      {products.length > 0 && (
        <>
          <div className="bulk-preview-cascade mt-8" aria-label="Previsualización de productos">
            {products.map(product => (
              <div key={product.id} role="button" tabIndex={0} onClick={() => setSelectedId(product.id)} onKeyDown={event => { if (event.key === 'Enter') setSelectedId(product.id); }} className={`bulk-preview-item ${selectedId === product.id ? 'is-selected' : 'is-secondary'}`}>
                <img src={product.previewUrl} alt={product.titulo} />
                <span>{product.titulo}</span>
                <button type="button" onClick={event => { event.stopPropagation(); removeProduct(product.id); }} className="bulk-preview-remove" aria-label={`Eliminar ${product.titulo}`}>×</button>
              </div>
            ))}
          </div>

          {selected && (
            <div className="bulk-product-editor liquid-form mt-8 animate-fade-in">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h4 className="text-[10px] tracking-[0.25em] uppercase text-white">Configurando: {selected.titulo}</h4>
                <span className="text-[9px] tracking-[0.15em] uppercase text-gray-500">{products.indexOf(selected) + 1} / {products.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <select value={selected.categoria} onChange={event => updateProduct(selected.id, { categoria: event.target.value, linea: '', subcategoria: '' })}>
                  <option value="">SELECCIONA ATELIER, JOYERÍA...</option>
                  {Object.keys(catalog).map(category => <option key={category} value={category}>{category}</option>)}
                </select>
                <select value={selected.linea} onChange={event => { const nextLine = event.target.value; updateProduct(selected.id, { linea: nextLine, subcategoria: nextLine && !detailedLines.has(nextLine) ? 'General' : '', tallas: {} }); }}>
                  <option value="">SELECCIONA OPCIÓN</option>
                  {lineOptions.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
                {needsDetail && <select value={selected.subcategoria} onChange={event => updateProduct(selected.id, { subcategoria: event.target.value, tallas: {} })}>
                  <option value="">SELECCIONA SUBCATEGORÍA</option>
                  {jewelrySubcategories.map(subcategory => <option key={subcategory} value={subcategory}>{subcategory}</option>)}
                </select>}
                <input value={selected.titulo} onChange={event => updateProduct(selected.id, { titulo: event.target.value })} placeholder="TÍTULO DEL PRODUCTO" />
                <select value={selected.color} onChange={event => updateProduct(selected.id, { color: event.target.value })}>
                  <option value="">COLOR</option>
                  <option value="Silver">SILVER</option>
                  <option value="Gold">GOLD</option>
                  <option value="Black">BLACK</option>
                  <option value="White">WHITE</option>
                </select>
                <input type="number" min="0" step="0.01" value={selected.costo} onChange={event => updateProduct(selected.id, { costo: event.target.value, precio: (Number(event.target.value) * (1 + selected.margen / 100)).toFixed(2) })} placeholder="COSTO" />
                <input type="number" min="0" step="0.01" value={selected.precio} onChange={event => updateProduct(selected.id, { precio: event.target.value })} placeholder="PRECIO DE VENTA" />
              </div>

              {Number(selected.costo) > 0 && (
                <div className="bulk-price-recommendations mt-6">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-gray-500 mb-3">Recomendaciones de ganancia</p>
                  {margins.map(margin => <button key={margin} type="button" onClick={() => setMargin(margin)} className={selected.margen === margin ? 'is-selected' : ''}>{margin}%<small>${(Number(selected.costo) * (1 + margin / 100)).toFixed(2)}</small></button>)}
                  <span className="text-[9px] text-gray-500 ml-2">Sugerido: ${calculatedPrice.toFixed(2)}</span>
                </div>
              )}

              {selected.subcategoria === 'Anillos' && (
                <div className="bulk-ring-sizes mt-6">
                  <p className="text-[9px] tracking-[0.2em] uppercase text-gray-500 mb-3">Tallas 5 a 12</p>
                  {ringSizes.map(size => <label key={size} onClick={() => updateProduct(selected.id, { tallas: { ...selected.tallas, [size]: Number(selected.tallas[size] || 0) + 1 } })}>{size}<input type="number" min="0" value={selected.tallas[size] || ''} onClick={event => event.stopPropagation()} onChange={event => updateProduct(selected.id, { tallas: { ...selected.tallas, [size]: event.target.value } })} placeholder="0" /></label>)}
                </div>
              )}

              {selected.subcategoria !== 'Anillos' && <input value={selected.disponibilidad} onChange={event => updateProduct(selected.id, { disponibilidad: event.target.value })} placeholder="STOCK O DISPONIBILIDAD" className="w-full mt-6" />}
              <textarea value={selected.descripcion} onChange={event => updateProduct(selected.id, { descripcion: event.target.value })} placeholder="DESCRIPCIÓN DEL PRODUCTO" rows={3} className="w-full mt-5" />
              <button type="button" onClick={() => setPreviewProduct(selected)} className="liquid-button w-full mt-6 py-4 text-[9px] font-bold tracking-[0.3em] uppercase">Ver tarjeta</button>
            </div>
          )}

        </>
      )}

      {previewProduct && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4" onClick={() => setPreviewProduct(null)}>
          <div className="bulk-product-card liquid-glass" onClick={event => event.stopPropagation()}>
            <button type="button" onClick={() => setPreviewProduct(null)} className="absolute top-3 right-4 text-white text-2xl bg-transparent border-0 cursor-pointer">×</button>
            <img src={previewProduct.previewUrl} alt={previewProduct.titulo} />
            <div className="bulk-product-card-info">
              <h2>{previewProduct.titulo}</h2>
              <p>{previewProduct.color || 'Color no especificado'}</p>
              <strong>${Number(previewProduct.precio || 0).toFixed(2)} USD</strong>
              {previewProduct.subcategoria === 'Anillos' && <div className="bulk-card-sizes">{ringSizes.filter(size => Number(previewProduct.tallas[size] || 0) > 0).map(size => <span key={size}>{size}<small>{previewProduct.tallas[size]}</small></span>)}</div>}
              <div className="bulk-card-actions">
                <button type="button" disabled={saving} onClick={() => saveProduct(previewProduct, false)}>Guardar tarjeta</button>
                <button type="button" disabled={saving} onClick={() => saveProduct(previewProduct, true)}>Guardar y publicar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
