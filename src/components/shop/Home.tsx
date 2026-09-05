import { useAuth } from '../../context/AuthContext';

interface HomeProps {
  onNavigate: (category: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { user, setShowLoginModal } = useAuth();

  const handleNavigation = (category: string) => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      onNavigate(category);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pb-20">
      <section className="w-full text-center py-16 md:py-32">
        <h2 className="text-4xl md:text-8xl font-bold tracking-[0.2em] uppercase text-white mb-6 md:mb-8 opacity-90 break-words drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          Elegancia Atemporal
        </h2>
        <p className="text-gray-400 tracking-[0.2em] uppercase text-[10px] md:text-xs max-w-2xl mx-auto leading-loose px-4">
          Bienvenido al Atelier de Antares. Un espacio dedicado a la sofisticación, el diseño atemporal y la exclusividad en cada detalle.
        </p>
      </section>

      <section className="w-full max-w-5xl mx-auto py-12 md:py-20 text-center">
        <h3 className="text-sm md:text-lg tracking-[0.3em] uppercase text-gray-500 mb-8 md:mb-10">Sobre Nosotros</h3>
        <p className="text-white text-base md:text-2xl leading-relaxed max-w-3xl mx-auto font-light">
          "Fundada con la visión de redefinir el lujo contemporáneo, Antares fusiona la artesanía tradicional con una estética vanguardista. Cada una de nuestras piezas cuenta una historia de meticulosa atención al detalle y pasión inquebrantable por la perfección."
        </p>
      </section>

      <section className="w-full max-w-6xl mx-auto py-16 md:py-24">
        <h3 className="text-sm md:text-lg tracking-[0.3em] uppercase text-gray-500 mb-10 md:mb-16 text-center">Nuestros Servicios</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-center">
          
          <div 
            onClick={() => handleNavigation('Sastrería a Medida')} 
            className="p-6 md:p-10 bg-black/40 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all duration-500 cursor-pointer group"
          >
            <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6 group-hover:scale-105 transition-transform duration-500">
              Sastrería a Medida
            </h4>
            <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose group-hover:text-gray-300 transition-colors">
              Creación de prendas exclusivas adaptadas a su silueta y estilo personal, utilizando únicamente los tejidos más nobles.
            </p>
          </div>

          <div 
            onClick={() => handleNavigation('Joyería Exclusiva')} 
            className="p-6 md:p-10 bg-black/40 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all duration-500 cursor-pointer group"
          >
            <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6 group-hover:scale-105 transition-transform duration-500">
              Joyería Personalizada
            </h4>
            <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose group-hover:text-gray-300 transition-colors">
              Diseño y forja de piezas únicas y exclusivas, seleccionando gemas excepcionales para capturar momentos eternos.
            </p>
          </div>

          <div 
            onClick={() => handleNavigation('perfil')} 
            className="p-6 md:p-10 bg-black/40 backdrop-blur-md border border-white/5 hover:border-white/20 transition-all duration-500 cursor-pointer sm:col-span-2 lg:col-span-1 group"
          >
            <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6 group-hover:scale-105 transition-transform duration-500">
              Asesoría de Imagen
            </h4>
            <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose group-hover:text-gray-300 transition-colors">
              Curaduría de estilo y armario por nuestros expertos, elevando su presencia y confianza en cada ocasión especial.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}