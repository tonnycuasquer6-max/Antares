import { useEffect, useRef } from 'react';

type SkyStar = { x: number; y: number; size: number; alpha: number };
type Constellation = { name: string; stars: [number, number][] };

const constellations: Constellation[] = [
  { name: 'Aries', stars: [[0.09, 0.18], [0.12, 0.2], [0.15, 0.17], [0.13, 0.24]] },
  { name: 'Tauro', stars: [[0.26, 0.13], [0.29, 0.18], [0.32, 0.15], [0.35, 0.21], [0.3, 0.24]] },
  { name: 'Geminis', stars: [[0.48, 0.11], [0.51, 0.17], [0.54, 0.13], [0.57, 0.2], [0.52, 0.25]] },
  { name: 'Cancer', stars: [[0.7, 0.12], [0.74, 0.16], [0.78, 0.13], [0.75, 0.22], [0.71, 0.2]] },
  { name: 'Leo', stars: [[0.87, 0.29], [0.91, 0.25], [0.94, 0.3], [0.9, 0.35], [0.85, 0.37], [0.88, 0.32]] },
  { name: 'Virgo', stars: [[0.16, 0.43], [0.2, 0.39], [0.24, 0.44], [0.28, 0.4], [0.31, 0.47], [0.25, 0.51]] },
  { name: 'Libra', stars: [[0.45, 0.39], [0.49, 0.36], [0.53, 0.42], [0.5, 0.47], [0.46, 0.45]] },
  { name: 'Escorpio', stars: [[0.69, 0.4], [0.73, 0.44], [0.77, 0.42], [0.8, 0.48], [0.76, 0.53], [0.71, 0.5]] },
  { name: 'Sagitario', stars: [[0.08, 0.68], [0.12, 0.64], [0.16, 0.69], [0.2, 0.65], [0.24, 0.72], [0.18, 0.76]] },
  { name: 'Capricornio', stars: [[0.36, 0.64], [0.4, 0.69], [0.45, 0.66], [0.49, 0.72], [0.44, 0.77], [0.39, 0.74]] },
  { name: 'Acuario', stars: [[0.64, 0.68], [0.68, 0.63], [0.72, 0.7], [0.77, 0.66], [0.82, 0.73], [0.74, 0.77]] },
  { name: 'Piscis', stars: [[0.88, 0.65], [0.92, 0.69], [0.95, 0.75], [0.9, 0.8], [0.85, 0.76], [0.82, 0.7]] }
];

export default function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };
    resizeCanvas();

    let time = 0;
    let animationFrame = 0;
    const skyStars: SkyStar[] = Array.from({ length: 180 }, (_, index) => ({
      x: (Math.sin(index * 12.9898) * 43758.5453) % 1,
      y: (Math.sin((index + 41) * 78.233) * 24634.6345) % 1,
      size: index % 19 === 0 ? 1.8 : index % 7 === 0 ? 1.2 : 0.55 + (index % 4) * 0.12,
      alpha: 0.28 + ((index * 17) % 62) / 100
    }));

    skyStars.forEach(star => {
      if (star.x < 0) star.x += 1;
      if (star.y < 0) star.y += 1;
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Cielo profundo en negro y gris, sin un patrón geométrico dominante.
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#020202');
      gradient.addColorStop(0.52, '#111111');
      gradient.addColorStop(1, '#030303');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      skyStars.forEach(star => {
        const pulse = 0.82 + Math.sin(time * 1.4 + star.x * 18) * 0.18;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(218, 218, 218, ${star.alpha * pulse})`;
        ctx.fill();
      });

      constellations.forEach(constellation => {
        constellation.stars.forEach(([x, y], index) => {
          ctx.beginPath();
          ctx.arc(x * width, y * height, 1.35 + (index % 3) * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(235, 235, 235, 0.82)';
          ctx.fill();
        });
      });

      time += 0.01;
      animationFrame = requestAnimationFrame(draw);
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) draw();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="screen-only fixed inset-0 z-0 pointer-events-none opacity-100"
      />
      <div className="screen-only fixed inset-0 z-0 pointer-events-none bg-transparent shadow-[inset_0_0_100px_rgba(0,0,0,0.28)]"></div>
    </>
  );
}