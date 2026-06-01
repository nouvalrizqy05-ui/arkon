import { useState, useEffect } from 'react';

export default function CoinDisplay({ coins = 0, size = 'md' }) {
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (coins !== displayCoins) {
      setIsAnimating(true);
      // Animate count up/down
      const diff = coins - displayCoins;
      const steps = Math.min(Math.abs(diff), 20);
      const stepSize = diff / steps;
      let current = displayCoins;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current += stepSize;
        setDisplayCoins(Math.round(current));
        if (step >= steps) {
          setDisplayCoins(coins);
          clearInterval(interval);
          setTimeout(() => setIsAnimating(false), 300);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [coins]);

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  return (
    <div
      className={`inline-flex items-center bg-amber-500/15 border border-amber-500/30 rounded-full font-black text-primary transition-all ${sizeClasses[size]} ${isAnimating ? 'scale-110 border-amber-400/60' : 'scale-100'}`}
    >
      <span className="text-base">🪙</span>
      <span className={`tabular-nums transition-all ${isAnimating ? 'text-amber-300' : ''}`}>
        {displayCoins.toLocaleString('id-ID')}
      </span>
    </div>
  );
}
