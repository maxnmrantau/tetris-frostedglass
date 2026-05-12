import { useState, useCallback, useEffect, useRef } from 'react';
import { COLS, ROWS, TETROMINOS, RANDOM_TETROMINO, TetrominoType } from '../constants';
import { audio } from '../utils/audio';

type Piece = {
  pos: { x: number; y: number };
  tetromino: { shape: number[][]; color: string };
  collided: boolean;
};

const createGrid = () =>
  Array.from(Array(ROWS), () =>
    Array(COLS).fill([0, 'transparent'])
  );

export const useTetris = () => {
  const [grid, setGrid] = useState(createGrid());
  const [activePiece, setActivePiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType>(RANDOM_TETROMINO());
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const spawnPiece = useCallback((type?: TetrominoType) => {
    const selectedType = type || nextPiece;
    const { shape, color } = TETROMINOS[selectedType];
    const newPiece: Piece = {
      pos: { x: COLS / 2 - Math.floor(shape[0].length / 2), y: 0 },
      tetromino: { shape, color },
      collided: false,
    };
    
    // Check if new piece can spawn, if not game over
    if (checkCollision(newPiece, grid, { x: 0, y: 0 })) {
      setGameOver(true);
      audio.playGameOver();
      return;
    }

    setActivePiece(newPiece);
    setNextPiece(RANDOM_TETROMINO());
  }, [nextPiece, grid]);

  const checkCollision = (piece: Piece, currentGrid: any[][], { x: moveX, y: moveY }: { x: number; y: number }) => {
    for (let y = 0; y < piece.tetromino.shape.length; y++) {
      for (let x = 0; x < piece.tetromino.shape[y].length; x++) {
        if (piece.tetromino.shape[y][x] !== 0) {
          const nextY = y + piece.pos.y + moveY;
          const nextX = x + piece.pos.x + moveX;

          if (
            !currentGrid[nextY] ||
            !currentGrid[nextY][nextX] ||
            currentGrid[nextY][nextX][0] !== 0
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (matrix: number[][], dir: number) => {
    const rotated = matrix.map((_, index) => matrix.map(col => col[index]));
    if (dir > 0) return rotated.map(row => row.reverse());
    return rotated.reverse();
  };

  const playerRotate = () => {
    if (!activePiece || gameOver || isPaused) return;
    const clonedPiece = JSON.parse(JSON.stringify(activePiece));
    clonedPiece.tetromino.shape = rotate(clonedPiece.tetromino.shape, 1);

    // Wall kick
    const pos = clonedPiece.pos.x;
    let offset = 1;
    while (checkCollision(clonedPiece, grid, { x: 0, y: 0 })) {
      clonedPiece.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPiece.tetromino.shape[0].length) {
        clonedPiece.tetromino.shape = rotate(clonedPiece.tetromino.shape, -1);
        clonedPiece.pos.x = pos;
        return;
      }
    }
    audio.playRotate();
    setActivePiece(clonedPiece);
  };

  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    if (!activePiece || gameOver || isPaused) return;
    
    if (!checkCollision(activePiece, grid, { x, y })) {
      setActivePiece(prev => prev ? ({
        ...prev,
        pos: { x: prev.pos.x + x, y: prev.pos.y + y },
        collided,
      }) : null);
      if (x !== 0) audio.playMove();
    } else {
      if (y > 0) {
        // Landed
        if (activePiece.pos.y < 1) {
          setGameOver(true);
          audio.playGameOver();
          return;
        }
        setGrid(prev => sweepRows(mergeGrid(prev, activePiece)));
        spawnPiece();
        audio.playDrop();
      }
    }
  };

  const mergeGrid = (prevGrid: any[][], piece: Piece) => {
    const newGrid = prevGrid.map(row => [...row]);
    piece.tetromino.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          newGrid[y + piece.pos.y][x + piece.pos.x] = [value, piece.tetromino.color];
        }
      });
    });
    return newGrid;
  };

  const sweepRows = (newGrid: any[][]) => {
    let linesCleared = 0;
    const sweptGrid = newGrid.reduce((acc, row) => {
      if (row.every(cell => cell[0] !== 0)) {
        linesCleared++;
        acc.unshift(new Array(COLS).fill([0, 'transparent']));
        return acc;
      }
      acc.push(row);
      return acc;
    }, [] as any[][]);

    if (linesCleared > 0) {
      const linePoints = [0, 40, 100, 300, 1200];
      setScore(prev => prev + linePoints[linesCleared] * level);
      setRows(prev => {
        const newRows = prev + linesCleared;
        if (Math.floor(newRows / 10) > Math.floor(prev / 10)) {
          setLevel(l => l + 1);
        }
        return newRows;
      });
      audio.playLineClear();
    }
    return sweptGrid;
  };

  const drop = () => {
    updatePlayerPos({ x: 0, y: 1, collided: false });
  };

  const hardDrop = () => {
    if (!activePiece || gameOver || isPaused) return;
    let moveY = 0;
    while (!checkCollision(activePiece, grid, { x: 0, y: moveY + 1 })) {
      moveY++;
    }
    const finalPiece = { ...activePiece, pos: { ...activePiece.pos, y: activePiece.pos.y + moveY } };
    setGrid(prev => sweepRows(mergeGrid(prev, finalPiece)));
    spawnPiece();
    audio.playDrop();
  };

  const getGhostPos = () => {
    if (!activePiece) return null;
    let moveY = 0;
    while (!checkCollision(activePiece, grid, { x: 0, y: moveY + 1 })) {
      moveY++;
    }
    return { x: activePiece.pos.x, y: activePiece.pos.y + moveY };
  };

  const resetGame = () => {
    setGrid(createGrid());
    setScore(0);
    setRows(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    spawnPiece(RANDOM_TETROMINO());
  };

  useEffect(() => {
    if (!activePiece && !gameOver) {
      spawnPiece();
    }
  }, [activePiece, gameOver, spawnPiece]);

  return {
    grid,
    activePiece,
    nextPiece,
    score,
    rows,
    level,
    gameOver,
    isPaused,
    setIsPaused,
    updatePlayerPos,
    playerRotate,
    drop,
    hardDrop,
    getGhostPos,
    resetGame,
  };
};
