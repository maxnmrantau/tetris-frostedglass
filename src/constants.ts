export const COLS = 10;
export const ROWS = 20;
export const INITIAL_DROP_TIME = 800;
export const MIN_DROP_TIME = 100;
export const SPEED_INCREMENT = 0.95;

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export const TETROMINOS: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'var(--color-tetris-i)',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'var(--color-tetris-j)',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'var(--color-tetris-l)',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'var(--color-tetris-o)',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'var(--color-tetris-s)',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'var(--color-tetris-t)',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'var(--color-tetris-z)',
  },
};

export const RANDOM_TETROMINO = (): TetrominoType => {
  const types: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  return types[Math.floor(Math.random() * types.length)];
};
