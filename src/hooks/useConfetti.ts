'use client';

import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  const showConfetti = useCallback((x: number, y: number) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: {
        x: x / window.innerWidth,
        y: y / window.innerHeight,
      },
      colors: ['#FF0000', '#FF69B4', '#FF1493'],
      shapes: ['circle'],
      ticks: 200,
    });
  }, []);

  return { showConfetti };
} 