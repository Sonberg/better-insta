import { useCallback } from 'react';

export function useConfetti() {
  const showConfetti = useCallback(async (x: number, y: number) => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      
      const count = 150;
      const defaults = {
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight
        },
        ticks: 100,
        particleCount: 80,
        spread: 70,
        startVelocity: 30,
        gravity: 0.8,
        scalar: 1,
        shapes: ['circle', 'square', 'star'],
        colors: [
          '#FF0000',
          '#FF69B4',
          '#FFD700',
          '#FF6B6B',
          '#4169E1',
          '#8A2BE2',
          '#00FF00',
          '#FF4500',
          '#FF1493',
          '#00FFFF',
        ],
        drift: 1,
        disableForReducedMotion: true
      };

      function fire(particleRatio: number, opts: Record<string, unknown>) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.4, {
        spread: 40,
        startVelocity: 45,
        decay: 0.94,
      });

      setTimeout(() => {
        fire(0.35, {
          spread: 60,
          startVelocity: 50,
          decay: 0.92,
        });
      }, 200);

      fire(0.35, {
        spread: 120,
        decay: 0.91,
        scalar: 0.8,
        ticks: 150
      });

      fire(0.15, {
        spread: 120,
        startVelocity: 55,
        decay: 0.91,
        scalar: 1.2,
        ticks: 120
      });

      fire(0.25, {
        spread: 100,
        startVelocity: 45,
        decay: 0.92,
        scalar: 1.2,
        drift: 2
      });

      setTimeout(() => {
        fire(0.2, {
          spread: 130,
          startVelocity: 30,
          decay: 0.92,
          scalar: 0.8,
          ticks: 150
        });
      }, 400);

    } catch (error) {
      console.error('Failed to load confetti:', error);
    }
  }, []);

  return { showConfetti };
} 