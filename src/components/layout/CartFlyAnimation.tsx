import { useShop } from '../../context/ShopContext';

export default function CartFlyAnimation() {
  const { stars } = useShop();

  return (
    <div className="pointer-events-none fixed inset-0 z-[500]" aria-hidden="true">
      {stars.map(star => (
        <span
          key={star.id}
          className="cart-fly-star"
          style={{
            left: star.x,
            top: star.y,
            '--fly-delta-x': `${star.targetX - star.x}px`,
            '--fly-delta-y': `${star.targetY - star.y}px`
          } as React.CSSProperties}
        >
          ✦
        </span>
      ))}
    </div>
  );
}
