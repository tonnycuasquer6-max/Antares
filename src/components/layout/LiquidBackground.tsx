import { useEffect, useRef } from 'react';

export default function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Estilo Gótico / Apple Liquid Glass (Tonos oscuros, negros, grises metálicos profundos)
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.5, '#0a0a0a');
      gradient.addColorStop(1, '#111111');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Olas líquidas
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let i = 0; i < width; i++) {
        const y = Math.sin(i * 0.002 + time) * 30 + Math.sin(i * 0.005 - time * 0.5) * 20;
        ctx.lineTo(i, height * 0.8 + y);
      }
      ctx.lineTo(width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let i = 0; i < width; i++) {
        const y = Math.cos(i * 0.003 - time * 0.8) * 40 + Math.sin(i * 0.004 + time) * 15;
        ctx.lineTo(i, height * 0.9 + y);
      }
      ctx.lineTo(width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fill();

      time += 0.01;
      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 z-0 pointer-events-none opacity-80"
      />
      {/* Capa de Glassmorphism estilo Apple */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-black/40 backdrop-blur-[60px] border-t border-white/5 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"></div>
    </>
  );
}