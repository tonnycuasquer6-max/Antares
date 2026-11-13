export default function Home({ store }: { store: any }) {
  const { user, setShowLoginModal, irACategoria, setActiveView } = store;

  return (
    <div className="w-full animate-fade-in flex flex-col items-center pb-20">
      <section className="w-full text-center py-16 md:py-32">
        <h2 className="text-4xl md:text-8xl font-bold tracking-[0.2em] uppercase text-white mb-6 md:mb-8 opacity-90 break-words">Elegancia Atemporal</h2>
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
          <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Sastrería a Medida')} className="p-6 md:p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer">
            <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Sastrería a Medida</h4>
            <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Creación de prendas exclusivas adaptadas a su silueta y estilo personal, utilizando únicamente los tejidos más nobles.</p>
          </div>
          
          <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Joyería Exclusiva')} className="p-6 md:p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer">
            <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Joyería Personalizada</h4>
            <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Diseño y forja de piezas únicas y exclusivas, seleccionando gemas excepcionales para capturar momentos eternos.</p>
          </div>
          
          <div onClick={() => !user ? setShowLoginModal(true) : setActiveView('perfil')} className="p-6 md:p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer sm:col-span-2 lg:col-span-1">
            <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Asesoría de Imagen</h4>
            <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Curaduría de estilo y armario por nuestros expertos, elevando su presencia y confianza en cada ocasión especial.</p>
          </div>
        </div>
      </section>
    </div>
  );
}