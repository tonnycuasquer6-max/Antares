import { useState } from 'react';
import { supabase } from '../services/supabase';
import { estructuraCatalogo } from '../utils/constants';

export default function ProfileView({ store }: { store: any }) {
  const { 
    user, userRole, setShowCompleteProfile, setActiveView, solicitarCambioContrasena, 
    hiddenItems, toggleMenuVisibility, categoriasDescarga, handleCheckbox, 
    isAllSelected, toggleAll, setMenuPdfExpandido, menuPdfExpandido, fetchProductos 
  } = store;

  // --- LÓGICA DE CASCADA DE FOTOS (PUNTO 1) ---
  const [cascadePhotos, setCascadePhotos] = useState<any[]>([]);
  const [isUploadingCascade, setIsUploadingCascade] = useState(false);

  const handleMultiplePhotoSelect = (e: any) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newCascadeItems = newFiles.map((file: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        categoria: '',
        subcategoria: '',
        titulo: '',
        costo: '',
        precio: '',
        disponibilidad: '',
        color: '',
        descripcion: '',
        isPublished: false
      }));
      setCascadePhotos(prev => [...prev, ...newCascadeItems]);
    }
  };

  const updateCascadeItem = (id: string, field: string, value: any) => {
    setCascadePhotos(prev => prev.map(photo => {
      if (photo.id === id) {
        const updated = { ...photo, [field]: value };
        if (field === 'categoria' && value === 'Gemas y Piedras Naturales') {
          updated.subcategoria = 'Gemas y Piedras Naturales'; // Sin subopciones
        } else if (field === 'categoria') {
          updated.subcategoria = '';
        }
        return updated;
      }
      return photo;
    }));
  };

  const handlePublishCascade = async (photo: any) => {
    if (!photo.titulo || !photo.precio) return alert('Ponle un título y precio a la pieza.');
    setIsUploadingCascade(true);

    let imageUrl = '';
    try {
      const fileExt = photo.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('catalogo').upload(fileName, photo.file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('catalogo').getPublicUrl(fileName);
      imageUrl = publicUrl;

      const payload = { 
        titulo: photo.titulo, 
        descripcion: photo.descripcion, 
        costo: Number(photo.costo) || 0, 
        precio: Number(photo.precio), 
        categoria: photo.categoria, 
        disponibilidad: photo.disponibilidad || 'Bajo Pedido',
        subcategoria: photo.subcategoria || 'General', 
        color: photo.color || '',
        tallas: photo.subcategoria === 'Anillos' ? JSON.stringify({}) : null, // Se puede editar luego en el catálogo
        imagen_url: imageUrl 
      };

      const { error } = await supabase.from('productos').insert([payload]).select();
      if (error) throw error;
      
      if (fetchProductos) fetchProductos(); // Actualiza el estado global
      updateCascadeItem(photo.id, 'isPublished', true);
      alert(`¡Pieza "${photo.titulo}" publicada con éxito!`);
    } catch (error) {
      alert('Error publicando la pieza.');
      console.error(error);
    } finally {
      setIsUploadingCascade(false);
    }
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-12 md:py-20 flex-grow animate-fade-in">
      <div className="bg-white/5 backdrop-blur-3xl p-8 md:p-16 shadow-2xl relative border border-none flex flex-col items-center">
        
        <h2 className="text-[14px] tracking-[0.4em] uppercase text-white mb-6 font-light text-center">Mi Perfil</h2>
        <div className="w-12 h-px bg-white/20 mb-12"></div>

        {/* INFORMACIÓN DEL USUARIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 w-full max-w-2xl mb-12 text-center md:text-center">
          <div className="flex flex-col items-center">
            <label className="block text-[8px] tracking-[0.3em] uppercase text-gray-500 mb-3">Nombres</label>
            <p className="text-white text-[12px] tracking-[0.2em] uppercase font-light">
              {user?.user_metadata?.first_name || 'NO ESPECIFICADO'}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <label className="block text-[8px] tracking-[0.3em] uppercase text-gray-500 mb-3">Apellidos</label>
            <p className="text-white text-[12px] tracking-[0.2em] uppercase font-light">
              {user?.user_metadata?.last_name || 'NO ESPECIFICADO'}
            </p>
          </div>
          <div className="md:col-span-2 flex flex-col items-center">
            <label className="block text-[8px] tracking-[0.3em] uppercase text-gray-500 mb-3">Correo Electrónico</label>
            <p className="text-white text-[12px] tracking-[0.1em] font-light truncate w-full" title={user?.email}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* BOTONES DE PERFIL */}
        <div className="w-full border-t border-white/10 pt-10 mb-12 flex flex-col sm:flex-row justify-center gap-4 md:gap-8">
          <button 
            onClick={() => setShowCompleteProfile(true)} 
            className="text-[8px] tracking-[0.3em] uppercase text-white border border-white/20 px-8 py-4 hover:bg-white hover:text-black transition-all duration-500 outline-none cursor-pointer bg-transparent"
          >
            Editar Información
          </button>
          <button 
            onClick={() => setActiveView('medidas')} 
            className="text-[8px] tracking-[0.3em] uppercase text-white border border-white/20 px-8 py-4 hover:bg-white hover:text-black transition-all duration-500 outline-none cursor-pointer bg-transparent"
          >
            Configurar Medidas
          </button>
          <button 
            onClick={solicitarCambioContrasena} 
            className="text-[8px] tracking-[0.3em] uppercase text-white border border-white/20 px-8 py-4 hover:bg-white hover:text-black transition-all duration-500 outline-none cursor-pointer bg-transparent"
          >
            Cambiar Contraseña
          </button>
        </div>

        {/* FUNCIONES DE ADMINISTRADOR */}
        {userRole === 'admin' && (
          <div className="w-full">
            {/* 1. CARGA EN CASCADA DE FOTOS */}
            <div className="mb-4 pt-6 md:pt-8 border-t border-white/10 mt-6 w-full flex flex-col items-center">
              <label className="block text-[14px] tracking-[0.3em] uppercase text-white mb-4 md:mb-6 text-center font-light">Cargar Nuevas Piezas</label>
              <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase text-center mb-6 md:mb-8 font-light">Sube múltiples imágenes simultáneamente para procesarlas en cascada.</p>
              
              <div className="border border-dashed border-white/20 p-8 text-center rounded-sm w-full max-w-2xl bg-black/20 mb-8">
                <label className="bg-white text-black px-8 py-3 text-[10px] font-bold tracking-[0.3em] uppercase cursor-pointer hover:bg-gray-200 transition">
                  Seleccionar Archivos
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleMultiplePhotoSelect} />
                </label>
              </div>

              {/* CONTENEDOR CASCADA */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                {cascadePhotos.filter(p => !p.isPublished).map((photo) => (
                  <div key={photo.id} className="border border-white/10 bg-black/40 p-6 rounded-sm flex flex-col gap-6 shadow-2xl animate-fade-in">
                    <img src={photo.previewUrl} alt="Preview" className="w-full h-48 object-contain bg-black/50" />
                    
                    {/* NIVEL 1 */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[8px] uppercase tracking-[0.2em] text-gray-400">1. Material</label>
                      <select 
                        className="bg-transparent border-b border-white/20 text-white p-2 text-[10px] uppercase tracking-widest outline-none [&>option]:bg-black"
                        value={photo.categoria}
                        onChange={(e) => updateCascadeItem(photo.id, 'categoria', e.target.value)}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Acero Fino">Acero Fino</option>
                        <option value="Plata de Ley 925">Plata 925</option>
                        <option value="Gemas y Piedras Naturales">Gemas y Piedras Naturales</option>
                      </select>
                    </div>

                    {/* NIVEL 2 */}
                    {(photo.categoria === 'Acero Fino' || photo.categoria === 'Plata de Ley 925') && (
                      <div className="flex flex-col gap-2 animate-fade-in">
                        <label className="text-[8px] uppercase tracking-[0.2em] text-gray-400">2. Tipo de Pieza</label>
                        <select 
                          className="bg-transparent border-b border-white/20 text-white p-2 text-[10px] uppercase tracking-widest outline-none [&>option]:bg-black"
                          value={photo.subcategoria}
                          onChange={(e) => updateCascadeItem(photo.id, 'subcategoria', e.target.value)}
                        >
                          <option value="">Seleccione...</option>
                          <option value="Anillos">Anillos</option>
                          <option value="Pulseras">Pulseras</option>
                          <option value="Collares">Collares</option>
                          <option value="Aretes">Aretes</option>
                          <option value="Piercings">Piercings</option>
                        </select>
                      </div>
                    )}

                    {/* NIVEL 3: DETALLES Y PUBLICAR */}
                    {((photo.categoria === 'Gemas y Piedras Naturales') || (photo.categoria && photo.subcategoria)) && (
                      <div className="border-t border-white/10 pt-6 flex flex-col gap-4 animate-fade-in">
                        <input 
                          type="text" placeholder="TÍTULO DE LA OBRA"
                          className="bg-transparent border-b border-white/20 pb-2 outline-none uppercase text-[10px] tracking-widest text-center w-full focus:border-white transition-colors"
                          value={photo.titulo} onChange={(e) => updateCascadeItem(photo.id, 'titulo', e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="number" placeholder="COSTO FABRICACIÓN"
                            className="bg-transparent border-b border-white/20 pb-2 outline-none uppercase text-[10px] tracking-widest text-center focus:border-white transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={photo.costo} onChange={(e) => updateCascadeItem(photo.id, 'costo', e.target.value)}
                          />
                          <input 
                            type="number" placeholder="PRECIO VENTA"
                            className="bg-transparent border-b border-white/20 pb-2 outline-none uppercase text-[10px] tracking-widest text-center focus:border-white transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-champagne font-bold"
                            value={photo.precio} onChange={(e) => updateCascadeItem(photo.id, 'precio', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" placeholder="DISPONIBILIDAD"
                            className="bg-transparent border-b border-white/20 pb-2 outline-none uppercase text-[10px] tracking-widest text-center focus:border-white transition-colors"
                            value={photo.disponibilidad} onChange={(e) => updateCascadeItem(photo.id, 'disponibilidad', e.target.value)}
                          />
                          <input 
                            type="text" placeholder="COLOR (OPCIONAL)"
                            className="bg-transparent border-b border-white/20 pb-2 outline-none uppercase text-[10px] tracking-widest text-center focus:border-white transition-colors"
                            value={photo.color} onChange={(e) => updateCascadeItem(photo.id, 'color', e.target.value)}
                          />
                        </div>
                        <textarea 
                          placeholder="DESCRIPCIÓN EDITORIAL..." rows={2}
                          className="bg-transparent border-b border-white/20 pb-2 outline-none uppercase text-[10px] tracking-widest text-center w-full focus:border-white transition-colors resize-none mt-2"
                          value={photo.descripcion} onChange={(e) => updateCascadeItem(photo.id, 'descripcion', e.target.value)}
                        />
                        <button 
                          onClick={() => handlePublishCascade(photo)} disabled={isUploadingCascade}
                          className="w-full bg-white text-black py-3 mt-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-gray-200 transition disabled:opacity-50"
                        >
                          {isUploadingCascade ? 'Publicando...' : 'Publicar Pieza'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. CONFIGURACIÓN DE MENÚS */}
            <div className="mb-4 pt-6 md:pt-8 border-t border-white/10 mt-6 w-full flex flex-col items-center">
              <label className="block text-[14px] tracking-[0.3em] uppercase text-white mb-4 md:mb-6 text-center font-light">Configuración de Menús</label>
              <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase text-center mb-6 md:mb-8 font-light">Oculta o muestra secciones en la página principal.</p>
              
              <div className="flex flex-col gap-2 w-full max-w-md mx-auto mb-10">
                {Object.keys(estructuraCatalogo).concat('Obsequios').map(menu => (
                  <div key={menu} className="bg-transparent p-4 border border-none">
                    <div className="flex justify-between items-center">
                      <span className={`text-[12px] tracking-[0.2em] uppercase ${hiddenItems.includes(menu) ? 'text-red-500' : 'text-white font-light'}`}>{menu}</span>
                      <button onClick={() => toggleMenuVisibility(menu)} className="text-[10px] uppercase tracking-[0.2em] bg-transparent border border-white/20 text-gray-300 hover:text-white px-3 py-2 cursor-pointer transition-colors">
                        {hiddenItems.includes(menu) ? 'MOSTRAR' : 'OCULTAR'}
                      </button>
                    </div>
                    
                    {estructuraCatalogo[menu] && estructuraCatalogo[menu].map(sub => (
                      <div key={sub} className="flex justify-between items-center pl-6 mt-3 pt-3 border-t border-white/5">
                        <span className={`text-[10px] tracking-[0.1em] uppercase ${hiddenItems.includes(sub) ? 'text-red-400' : 'text-gray-400 font-light'}`}>{sub}</span>
                        <button onClick={() => toggleMenuVisibility(sub)} className="text-[8px] uppercase tracking-[0.2em] bg-transparent border border-white/10 text-gray-500 hover:text-white px-2 py-1 cursor-pointer transition-colors">
                          {hiddenItems.includes(sub) ? 'MOSTRAR' : 'OCULTAR'}
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. CATÁLOGO PDF */}
            <div className="mb-4 pt-6 md:pt-8 border-t border-white/10 mt-6 w-full flex flex-col items-center">
              <label className="block text-[14px] tracking-[0.3em] uppercase text-white mb-4 md:mb-6 text-center font-light">Catálogo PDF</label>
              <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase text-center mb-6 md:mb-8 font-light">Seleccione las colecciones que desea incluir en su PDF interactivo.</p>
              <div className="flex flex-col gap-3 md:gap-4 mb-8 md:mb-10 w-full max-w-md mx-auto">
                {Object.entries(estructuraCatalogo).map(([menuPrincipal, submenus]) => (
                  <div key={menuPrincipal} className="border-b border-white/10 pb-3 md:pb-4">
                    <div className="w-full flex justify-between items-center bg-transparent border-none outline-none group cursor-pointer" onClick={() => setMenuPdfExpandido(menuPdfExpandido === menuPrincipal ? null : menuPrincipal)}>
                      <button className="text-gray-300 group-hover:text-white text-[12px] tracking-[0.3em] uppercase bg-transparent border-none outline-none cursor-pointer transition-colors text-left flex-grow font-light">
                        {menuPrincipal}
                      </button>
                      <div className={`w-3.5 h-3.5 border transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer ${isAllSelected(menuPrincipal, categoriasDescarga) ? 'bg-white border-white' : 'border-gray-500'}`} onClick={(e) => { e.stopPropagation(); toggleAll(menuPrincipal); }}>
                        {isAllSelected(menuPrincipal, categoriasDescarga) && <div className="w-2 h-2 bg-black"></div>}
                      </div>
                    </div>
                    {menuPdfExpandido === menuPrincipal && (
                      <div className="pt-4 md:pt-6 flex flex-col gap-3 md:gap-4 pl-2 animate-fade-in">
                        {submenus.map(cat => (
                          <label key={cat} className="flex items-center gap-3 md:gap-4 cursor-pointer group w-full">
                            <div className={`w-3.5 h-3.5 border transition-colors flex items-center justify-center flex-shrink-0 ${categoriasDescarga.includes(cat) ? 'bg-white border-white' : 'border-gray-500 group-hover:border-white'}`}>
                              {categoriasDescarga.includes(cat) && <div className="w-2 h-2 bg-black"></div>}
                            </div>
                            <input type="checkbox" className="hidden" onChange={() => handleCheckbox(cat)} checked={categoriasDescarga.includes(cat)} />
                            <span className="text-gray-400 group-hover:text-white text-[10px] tracking-[0.2em] uppercase transition-colors font-light">{cat}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <button onClick={() => window.print()} className="text-black text-[12px] font-bold tracking-[0.3em] uppercase px-8 py-4 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none border-none shadow-xl flex items-center justify-center gap-3">
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="14" width="14"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Generar Catálogo PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}