import { useState } from 'react';

function ConfettiEffect() {
  const [particles] = useState(() => {
    const colors = ['#d946ef', '#22d3ee', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2.5,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            '--fall-duration': `${p.duration}s`,
            '--particle-color': p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: p.id % 2 === 0 ? '50%' : '0%'
          }}
        />
      ))}
    </div>
  );
}

export default ConfettiEffect;
