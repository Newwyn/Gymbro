import React from 'react';

const CaloriesRing = ({ eaten, target }) => {
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = target > 0 ? Math.min(100, (eaten / target) * 100) : 0;
  const offset = circumference - (percentage / 100) * circumference;
  const remaining = Math.max(0, target - eaten);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="progress-ring-circle"
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#39FF14" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
      }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>
          {remaining}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
          kcal left
        </span>
      </div>
    </div>
  );
};

export default CaloriesRing;
