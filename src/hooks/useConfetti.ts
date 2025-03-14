import { useCallback } from 'react';

export function useConfetti() {
  const showConfetti = useCallback(async (x: number, y: number) => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      
      const count = 50;
      const defaults = {
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight
        },
        ticks: 50,
        particleCount: 50,
        spread: 55,
        startVelocity: 20,
        scalar: 0.75,
        shapes: ['circle', 'square'],
        colors: ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'],
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    } catch (error) {
      console.error('Failed to load confetti:', error);
    }
  }, []);

  return { showConfetti };
} 