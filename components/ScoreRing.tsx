'use client';

import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function ScoreRing({ score, size = 120, strokeWidth = 10 }: ScoreRingProps) {
  const [animated, setAnimated] = useState(0);

  const radius        = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference * (1 - animated / 100);

  const color =
    score >= 75 ? '#49de50' :
    score >= 50 ? '#cac5fe' :
    '#f75353';

  const label =
    score >= 80 ? 'Excellent' :
    score >= 65 ? 'Good'      :
    score >= 50 ? 'Fair'      :
    'Needs Work';

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div
      className="score-ring-container"
      style={{ width: size, height: size }}
    >
      <svg
        className="score-ring-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          className="score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Animated fill */}
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      {/* Centre label */}
      <div className="score-ring-label flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-[10px] text-light-600">/100</span>
        <span className="text-[11px] font-semibold mt-0.5" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}
