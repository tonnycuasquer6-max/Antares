import { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';

const getMockupUrl = (prenda: string, vista: string) => {
  if (prenda === 'Capucha') return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/IMG_1120.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/IMG_1121.png";
  if (prenda === 'Buso') return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/85.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/86.png";
  if (prenda === 'Hoodie') return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/83.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/84.png";
  return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/81.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/82.png";
};

const coloresPredeterminados = [
  { name: 'Blanco Original', hex: '#ffffff' }, 
  { name: 'Negro Profundo', hex: '#111111' }
];

export default function PretAPorter() {
  const { setCarrito, triggerStarAnimation } = useShop();

  const [customPrenda, setCustomPrenda] = useState('Camiseta'); 
  const [customVista, setCustomView] = useState('frente'); 
  const [customColor, setCustomColor] = useState('#ffffff');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [customPlacement, setCustomPlacement] = useState('centro-pecho');
  const [customRenderedImage, setCustomRenderedImage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [sizeOffset, setSizeOffset] = useState(0); 
  const [yOffset, setYOffset] = useState(0); 

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const shirtImg = new Image();
    shirtImg.crossOrigin = "Anonymous";
    
    shirtImg.onload = () => {
      canvas.width = shirtImg.width;
      canvas.height = shirtImg.height;
      ctx.drawImage(shirtImg, 0, 0);
      
      if(customColor !== '#ffffff') {
         ctx.globalCompositeOperation = 'source-atop';
         ctx.fillStyle = customColor;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.globalCompositeOperation = 'multiply';
         ctx.drawImage(shirtImg, 0, 0);
         ctx.globalCompositeOperation = 'source-over'; 
      }
      
      if (customLogo) {
        const logoImg = new Image();
        logoImg.onload = () => {
          let x = 0, y = 0, baseSize = 0;
          const shirtWidth = canvas.width;
          const shirtHeight = canvas.height;
          
          if (customVista === 'frente') {
              switch(customPlacement) {
                case 'pecho-izq': x = shirtWidth * 0.65; y = shirtHeight * 0.35; baseSize = shirtWidth * 0.12; break;
                case 'pecho-der': x = shirtWidth * 0.35; y = shirtHeight * 0.35; baseSize = shirtWidth * 0.12; break;
                case 'centro-pecho': x = shirtWidth * 0.5; y = shirtHeight * 0.40; baseSize = shirtWidth * 0.35; break;
                case 'pecho-sup-centro': x = shirtWidth * 0.5; y = shirtHeight * 0.25; baseSize = shirtWidth * 0.35; break;
                default: x = shirtWidth * 0.5; y = shirtHeight * 0.40; baseSize = shirtWidth * 0.35;
              }
          } else {
              switch(customPlacement) {
                case 'espalda-sup': x = shirtWidth * 0.5; y = shirtHeight * 0.25; baseSize = shirtWidth * 0.20; break;
                case 'espalda-centro': x = shirtWidth * 0.5; y = shirtHeight * 0.45; baseSize = shirtWidth * 0.40; break;
                default: x = shirtWidth * 0.5; y = shirtHeight * 0.45; baseSize = shirtWidth * 0.40;
              }
          }
          
          const finalSize = Math.max(10, baseSize + sizeOffset);
          const finalY = y + yOffset;
          const aspectLogo = logoImg.width / logoImg.height;
          
          ctx.drawImage(logoImg, x - finalSize/2, finalY - (finalSize/aspectLogo)/2, finalSize, finalSize/aspectLogo);
          setCustomRenderedImage(canvas.toDataURL());
        };
        logoImg.src = customLogo;
      } else {
        setCustomRenderedImage(canvas.toDataURL());
      }
    };
    shirtImg.onerror = () => { setCustomRenderedImage(null); };
    shirtImg.src = getMockupUrl(customPrenda, customVista);
  }, [customColor, customLogo, customPlacement, customVista, sizeOffset, yOffset, customPrenda]);

  const procesarInsigniaLogotipo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setIsRemovingBg(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const rBg = data[0], gBg = data[1], bBg = data[2], aBg = data[3];
          if(aBg > 0) { 
              const tolerance = 45;
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                if (Math.abs(r - rBg) < tolerance && Math.abs(g - gBg) < tolerance && Math.abs(b - bBg) < tolerance) {
                  data[i+3] = 0; 
                }
              }
              ctx.putImageData(imageData, 0, 0);
          }
          setCustomLogo(canvas.toDataURL());
        } catch(e) {
           console.error("Error al procesar fondo:", e);
           setCustomLogo(event.target?.result as string); 
        }
        setIsRemovingBg(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getPlacementLabel = () => {
    switch(customPlacement) {
      case 'pecho-izq': return 'Pecho (Izquierda)';
      case 'pecho-der': return 'Pecho (Derecha)';
      case 'centro-pecho': return 'Centro Pecho';
      case 'pecho-sup-centro': return 'Pecho Superior Centro';
      case 'espalda-sup': return 'Espalda Superior';
      case 'espalda-centro': return 'Mitad Espalda';
      default: return 'Centro Pecho';
    }
  };

  const getCalculatedPrice = () => {
     let basePrice = 0;
     switch(customPrenda) {
       case 'Camiseta': basePrice = 5.99; break;
       case 'Buso': basePrice = 8.99; break;
       case 'Hoodie': basePrice = 12.99; break;
       case 'Capucha': basePrice = 16.99; break;
       default: basePrice = 5.99;
     }
     let stampPrice = 0;
     if (customLogo) {
        if (customVista === 'frente') {
           if (['centro-pecho', 'pecho-sup-centro'].includes(customPlacement)) stampPrice = 3.00;
           else if (['pecho-izq', 'pecho-der'].includes(customPlacement)) stampPrice = 1.50;
        } else {
           if (customPlacement === 'espalda-centro') stampPrice = 3.00;
           else if (customPlacement === 'espalda-sup') stampPrice = 2.00;
        }
     }
     return (basePrice + stampPrice).toFixed(2);
  };

  const handleCustomAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if(!customRenderedImage) return;
    triggerStarAnimation(e);
    const finalPrice = parseFloat(getCalculatedPrice());
    const customItem = {
      id: `custom-${Date.now()}`,
      titulo: `PRÊT-À-PORTER: ${customPrenda} Diseño Exclusivo`,
      categoria: 'Prêt-à-Porter',
      subcategoria: 'A Medida',
      costo: 0,
      precio: finalPrice,
      cantidad: 1,
      stockMaximo: 99,
      imagen_url: customRenderedImage,
      tallaSeleccionada: 'A Medida',
      color: customColor,
      tallas: null,
      vendido: false,
      vendidos: 0,
      disponibilidad: 'A Medida',
      descripcion: `Prenda: ${customPrenda}, Tono: ${customColor}, Vista: ${customVista.toUpperCase()}, Ubicación: ${getPlacementLabel()}`
    };
    setCarrito(prev => [...prev, customItem]);
  };

  return (
    <section className="container mx-auto py-8 md:py-16 flex-grow animate-fade-in w-full max-w-7xl relative z-10">
      <h2 className="text-[12px] md:text-[16px] tracking-[0.4em] uppercase text-white mb-8 sm:mb-12 text-center border-b border-white/10 pb-4 sm:pb-6 break-words drop-shadow-md">
        Prêt-à-Porter Personalizado
      </h2>
      
      <div className="liquid-glass flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-start w-full p-6 md:p-12 shadow-2xl rounded-[2rem]">
        
        {/* Visualizador */}
        <div className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-none lg:w-1/2 flex flex-col gap-4">
            <div className="flex justify-center gap-2 sm:gap-4 mb-2">
              <button 
                type="button" 
                onClick={() => { setCustomView('frente'); setSizeOffset(0); setYOffset(0); }} 
                className={`px-4 sm:px-6 py-2 text-[8px] sm:text-[10px] tracking-[0.2em] uppercase transition-colors outline-none cursor-pointer border flex-1 sm:flex-none ${customVista === 'frente' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-transparent border-white/20 text-gray-500 hover:text-white'}`}
              >
                Frente
              </button>
              <button 
                type="button" 
                onClick={() => { setCustomView('espalda'); setSizeOffset(0); setYOffset(0); }} 
                className={`px-4 sm:px-6 py-2 text-[8px] sm:text-[10px] tracking-[0.2em] uppercase transition-colors outline-none cursor-pointer border flex-1 sm:flex-none ${customVista === 'espalda' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-transparent border-white/20 text-gray-500 hover:text-white'}`}
              >
                Espalda
              </button>
            </div>
            
            <div className="w-full relative bg-black/60 backdrop-blur-[50px] aspect-[3/4] flex items-center justify-center overflow-hidden group border border-white/5 rounded-sm mx-auto shadow-inner">
              <img 
                src={customRenderedImage || getMockupUrl(customPrenda, customVista)} 
                alt="Renderizado Prêt-à-Porter" 
                className="w-full h-full object-contain z-10 transition-opacity duration-500" 
              />
              {!customRenderedImage && <p className="absolute text-[8px] sm:text-[10px] text-gray-600 uppercase tracking-[0.2em] z-50 text-center px-4 animate-pulse">Generando Cristal...</p>}
            </div>
        </div>

        {/* Controles */}
        <div className="w-full max-w-[400px] md:max-w-[500px] lg:max-w-none lg:w-1/2 flex flex-col gap-8 lg:gap-10">
          
          <div className="flex flex-col gap-3 sm:gap-4">
            <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left drop-shadow-md">1. Seleccione la Prenda</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 w-full">
              {['Camiseta', 'Buso', 'Hoodie', 'Capucha'].map(prenda => (
                <button 
                  key={prenda} 
                  type="button" 
                  onClick={() => setCustomPrenda(prenda)} 
                  className={`py-3 px-2 text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPrenda === prenda ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}
                >
                  {prenda}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left drop-shadow-md">2. Tono de Prenda</p>
            <div className="flex gap-3 sm:gap-4 flex-wrap items-center justify-center lg:justify-start">
              {coloresPredeterminados.map(color => (
                <div 
                  key={color.name} 
                  onClick={() => setCustomColor(color.hex)} 
                  className={`w-8 h-8 sm:w-10 sm:h-10 cursor-pointer rounded-full border-2 transition-transform ${customColor === color.hex ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-white/20 hover:scale-110'}`} 
                  style={{ backgroundColor: color.hex }} 
                  title={color.name} 
                />
              ))}
              <label 
                className={`relative w-8 h-8 sm:w-10 sm:h-10 cursor-pointer rounded-full border-2 transition-transform flex items-center justify-center overflow-hidden ${!coloresPredeterminados.map(c=>c.hex).includes(customColor) ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'border-white/20 hover:scale-110'}`} 
                style={{ background: 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)' }} 
                title="Elegir otro color"
              >
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="absolute opacity-0 w-full h-full cursor-pointer" />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left drop-shadow-md">3. Insignia Personal</p>
            <div className="flex flex-col gap-2 w-full">
              <input 
                type="file" 
                accept="image/*" 
                onChange={procesarInsigniaLogotipo} 
                className="text-[8px] sm:text-[10px] text-gray-500 file:mr-2 sm:file:mr-4 file:py-2 sm:file:py-3 file:px-4 sm:file:px-6 file:border file:border-white/20 hover:file:border-white/50 file:tracking-[0.1em] sm:file:tracking-[0.2em] file:uppercase file:bg-black/40 file:text-gray-400 hover:file:text-white transition-all cursor-pointer w-full file:rounded-sm" 
              />
              {isRemovingBg && <p className="text-[7px] sm:text-[8px] text-gray-300 tracking-[0.1em] uppercase animate-pulse mt-1 sm:mt-2 text-center lg:text-left">Renderizando cristalografía...</p>}
            </div>
          </div>

          {customLogo && (
            <div className="flex flex-col gap-4 animate-fade-in w-full">
              <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left drop-shadow-md">4. Ubicación ({customVista})</p>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full">
                {customVista === 'frente' ? (
                  <>
                    <button type="button" onClick={() => { setCustomPlacement('pecho-izq'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPlacement === 'pecho-izq' ? 'bg-white/20 text-white border-white/50' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Pecho Izquierdo</button>
                    <button type="button" onClick={() => { setCustomPlacement('pecho-der'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPlacement === 'pecho-der' ? 'bg-white/20 text-white border-white/50' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Pecho Derecho</button>
                    <button type="button" onClick={() => { setCustomPlacement('pecho-sup-centro'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border col-span-2 w-full ${customPlacement === 'pecho-sup-centro' ? 'bg-white/20 text-white border-white/50' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Pecho Sup. Centro</button>
                    <button type="button" onClick={() => { setCustomPlacement('centro-pecho'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border col-span-2 w-full ${customPlacement === 'centro-pecho' ? 'bg-white/20 text-white border-white/50' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Centro Pecho</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => { setCustomPlacement('espalda-sup'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPlacement === 'espalda-sup' ? 'bg-white/20 text-white border-white/50' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Espalda Superior</button>
                    <button type="button" onClick={() => { setCustomPlacement('espalda-centro'); setSizeOffset(0); setYOffset(0); }} className={`py-2 sm:py-3 px-1 sm:px-2 text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.1em] uppercase transition-colors cursor-pointer outline-none border w-full ${customPlacement === 'espalda-centro' ? 'bg-white/20 text-white border-white/50' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white hover:border-white/30'}`}>Centro Espalda</button>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:gap-4 mt-2 w-full">
                <p className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase text-center lg:text-left drop-shadow-md">5. Ajuste Fino</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8 w-full">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[7px] sm:text-[8px] text-gray-400 tracking-[0.1em] uppercase">Tamaño</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSizeOffset(s => s - 5)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black/40 border border-white/10 text-white hover:bg-white/20 cursor-pointer text-base sm:text-lg font-bold outline-none rounded-sm transition-colors">-</button>
                      <button type="button" onClick={() => setSizeOffset(s => s + 5)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black/40 border border-white/10 text-white hover:bg-white/20 cursor-pointer text-base sm:text-lg font-bold outline-none rounded-sm transition-colors">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[7px] sm:text-[8px] text-gray-400 tracking-[0.1em] uppercase">Posición Vertical</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setYOffset(y => y - 5)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black/40 border border-white/10 text-white hover:bg-white/20 cursor-pointer text-xs sm:text-sm font-bold outline-none rounded-sm transition-colors">▲</button>
                      <button type="button" onClick={() => setYOffset(y => y + 5)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-black/40 border border-white/10 text-white hover:bg-white/20 cursor-pointer text-xs sm:text-sm font-bold outline-none rounded-sm transition-colors">▼</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-white/10 flex flex-col gap-4 sm:gap-6 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-2 sm:gap-0 w-full">
               <span className="text-[12px] sm:text-[14px] text-white/80 tracking-[0.2em] font-light">VALOR A MEDIDA</span>
               <span className="text-[16px] sm:text-[20px] text-white font-bold tracking-[0.1em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">${getCalculatedPrice()} USD</span>
            </div>
            <button 
              onClick={handleCustomAddToCart} 
              className="w-full bg-white text-black text-[8px] sm:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase py-4 sm:py-5 hover:bg-gray-300 transition-all duration-300 cursor-pointer outline-none border-none shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] rounded-sm"
            >
              Añadir Diseño al Bolso
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}