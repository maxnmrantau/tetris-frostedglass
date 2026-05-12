import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ArrowUp, Zap } from 'lucide-react';
import { useTetris } from './hooks/useTetris';
import { TETROMINOS, INITIAL_DROP_TIME, SPEED_INCREMENT, MIN_DROP_TIME } from './constants';

export default function App() {
  const {
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
  } = useTetris();

  const [isStarted, setIsStarted] = useState(false);
  const [dropTime, setDropTime] = useState(INITIAL_DROP_TIME);
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStarted || gameOver) return;
      if (e.key === 'ArrowLeft') updatePlayerPos({ x: -1, y: 0, collided: false });
      if (e.key === 'ArrowRight') updatePlayerPos({ x: 1, y: 0, collided: false });
      if (e.key === 'ArrowDown') drop();
      if (e.key === 'ArrowUp') playerRotate();
      if (e.key === ' ') {
        e.preventDefault();
        hardDrop();
      }
      if (e.key === 'p' || e.key === 'Escape') setIsPaused(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, gameOver, updatePlayerPos, drop, playerRotate, hardDrop, setIsPaused]);

  // Game Loop
  const animate = useCallback((time: number) => {
    if (!isStarted || isPaused || gameOver) return;

    if (time - lastTimeRef.current > dropTime) {
      drop();
      lastTimeRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(animate);
  }, [isStarted, isPaused, gameOver, dropTime, drop]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(animate);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [animate]);

  // Speed up as level increases
  useEffect(() => {
    const newSpeed = Math.max(MIN_DROP_TIME, INITIAL_DROP_TIME * Math.pow(SPEED_INCREMENT, level - 1));
    setDropTime(newSpeed);
  }, [level]);

  const handleStart = () => {
    setIsStarted(true);
    resetGame();
  };

  const ghostPos = getGhostPos();

  return (
    <div className="min-h-screen relative text-slate-200 font-sans selection:bg-cyan-500/30 flex items-center justify-center p-4">
      <div className="mesh-bg" />
      
      <div className="relative flex gap-12 max-w-6xl w-full items-center justify-center">
        
        {/* Left Panel: Statistics (Glass) */}
        <div className="hidden lg:flex flex-col gap-6 w-56 shrink-0">
          <div className="glass p-6 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Level</p>
              <p className="text-4xl font-extralight text-white tracking-tighter">{level.toString().padStart(2, '0')}</p>
          </div>
          
          <div className="glass p-6">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Statistics</p>
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-500">Lines</span>
                    <span className="text-xl font-light text-white">{rows.toString().padStart(3, '0')}</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-xs text-slate-500">Goal</span>
                    <span className="text-xl font-light text-white">{(level * 10).toString().padStart(2, '0')}</span>
                </div>
            </div>
          </div>

          <div className="mt-auto glass p-6 space-y-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  <Zap className="w-3 h-3 text-cyan-400" /> Controls
              </div>
              <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between"><span>Rotate</span> <kbd className="bg-white/5 px-1.5 rounded border border-white/10">↑</kbd></div>
                  <div className="flex justify-between"><span>Move</span> <kbd className="bg-white/5 px-1.5 rounded border border-white/10">← →</kbd></div>
                  <div className="flex justify-between"><span>Drop</span> <kbd className="bg-white/5 px-1.5 rounded border border-white/10">↓</kbd></div>
                  <div className="flex justify-between"><span>Hard</span> <kbd className="bg-white/5 px-1.5 rounded border border-white/10">Space</kbd></div>
              </div>
          </div>
        </div>

        {/* Center: Main Board (Glass) */}
        <div className="relative group">
          <div className="glass p-2 relative shadow-2xl overflow-hidden ring-1 ring-white/10">
            <div className="grid grid-cols-10 gap-0.5 bg-black/30 rounded-xl overflow-hidden p-1 border border-white/5">
              {grid.map((row, y) =>
                row.map((cell, x) => {
                  let color = cell[1];
                  let opacity = cell[0] === 0 ? 0 : 1;
                  let isGhost = false;

                  if (activePiece && isStarted) {
                    activePiece.tetromino.shape.forEach((pRow, py) => {
                      pRow.forEach((pValue, px) => {
                        if (pValue !== 0 && x === activePiece.pos.x + px && y === activePiece.pos.y + py) {
                          color = activePiece.tetromino.color;
                          opacity = 1;
                        }
                      });
                    });
                  }

                  if (isStarted && ghostPos && !gameOver && !isPaused) {
                    const { shape, color: gColor } = activePiece!.tetromino;
                    shape.forEach((pRow, py) => {
                      pRow.forEach((pValue, px) => {
                        if (pValue !== 0 && x === ghostPos.x + px && y === ghostPos.y + py) {
                          const isOccupiedByActive = activePiece!.tetromino.shape[y - activePiece!.pos.y]?.[x - activePiece!.pos.x];
                          if (!isOccupiedByActive) {
                            color = gColor;
                            opacity = 0.15;
                            isGhost = true;
                          }
                        }
                      });
                    });
                  }

                  return (
                    <div
                      key={`${x}-${y}`}
                      className="w-7 h-7 sm:w-[30px] sm:h-[30px] flex items-center justify-center relative bg-white/[0.02] rounded-[4px]"
                    >
                      <AnimatePresence>
                        {opacity > 0 && (
                          <motion.div
                            initial={isGhost ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                            animate={isGhost 
                              ? { opacity: [0.1, 0.25, 0.1], scale: [0.98, 1, 0.98] } 
                              : { scale: 1, opacity }
                            }
                            transition={isGhost ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                            exit={{ scale: 1.5, opacity: 0 }}
                            style={{ backgroundColor: color, color: color }}
                            className={`w-[90%] h-[90%] rounded-[4px] relative ${isGhost ? 'ghost-cell' : 'block-glow'}`}
                          >
                            {!isGhost && <div className="absolute inset-0 bg-white/20 rounded-[4px] pointer-events-none" />}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {(!isStarted || gameOver || isPaused) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-slate-950/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                >
                  {!isStarted ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-8"
                      >
                        <div className="space-y-2">
                            <h1 className="text-6xl font-extralight tracking-tighter text-white">
                                TETRIS
                            </h1>
                            <p className="text-slate-400 text-[10px] tracking-[0.5em] uppercase font-bold">Frosted Glass Edition</p>
                        </div>
                        <button
                          onClick={handleStart}
                          className="glass group relative px-12 py-4 text-white font-bold overflow-hidden transition-all hover:bg-white/10 active:scale-95"
                        >
                          <span className="relative z-10 tracking-widest">START GAME</span>
                        </button>
                      </motion.div>
                  ) : gameOver ? (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="space-y-6"
                    >
                      <h2 className="text-5xl font-extralight tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
                        GAME OVER
                      </h2>
                      <div className="space-y-1">
                        <p className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Final Score</p>
                        <p className="text-4xl font-extralight text-white">{score.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={resetGame}
                        className="glass group flex items-center gap-2 px-10 py-3 text-white font-bold transition-all hover:bg-white/10 active:scale-95"
                      >
                        <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        RESTART
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-6"
                    >
                      <h2 className="text-4xl font-extralight tracking-tighter text-white">PAUSED</h2>
                      <button
                        onClick={() => setIsPaused(false)}
                        className="glass flex items-center gap-2 px-10 py-3 text-white font-bold transition-all hover:bg-white/10 active:scale-95"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        RESUME
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Next & Score (Glass) */}
        <div className="flex flex-col gap-6 w-56 shrink-0">
            <div className="glass p-6 text-center min-h-[140px] flex flex-col justify-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Next Piece</p>
                <div className="flex flex-col gap-1 items-center justify-center">
                    {TETROMINOS[nextPiece].shape.map((row, y) => (
                        <div key={y} className="flex gap-1">
                            {row.map((cell, x) => (
                                <div
                                    key={`${x}-${y}`}
                                    className={`w-4 h-4 rounded-sm transition-all duration-300 ${cell !== 0 ? 'block-glow' : 'bg-transparent opacity-0'}`}
                                    style={{ 
                                        backgroundColor: cell !== 0 ? TETROMINOS[nextPiece].color : 'transparent',
                                        color: cell !== 0 ? TETROMINOS[nextPiece].color : 'transparent'
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass p-6 flex flex-col items-center">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Score</p>
                <motion.h2 
                    key={score}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-extralight text-white tracking-tighter"
                >
                    {score.toLocaleString()}
                </motion.h2>
                <div className="mt-6 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                        animate={{ width: `${Math.min(100, (rows % 10) * 10)}%` }}
                        className="h-full bg-cyan-400" 
                    />
                </div>
                <p className="text-[10px] text-cyan-400/60 mt-2 uppercase font-bold tracking-wider">Level Progress</p>
            </div>

            <div className="mt-auto flex flex-col gap-3">
                <button 
                  onClick={() => setIsPaused(!isPaused)}
                  className="glass py-3 text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-all font-bold"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button 
                  onClick={resetGame}
                  className="glass py-3 text-[10px] uppercase tracking-widest text-white hover:bg-white/10 transition-all font-bold"
                >
                  Restart
                </button>
            </div>
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden fixed bottom-8 left-0 right-0 px-4 flex justify-between items-end z-40">
            <div className="grid grid-cols-3 gap-2">
                <button onClick={() => updatePlayerPos({ x: -1, y: 0, collided: false })} className="w-14 h-14 glass flex items-center justify-center"><ChevronLeft /></button>
                <button onClick={() => drop()} className="w-14 h-14 glass flex items-center justify-center"><ChevronDown /></button>
                <button onClick={() => updatePlayerPos({ x: 1, y: 0, collided: false })} className="w-14 h-14 glass flex items-center justify-center"><ChevronRight /></button>
            </div>
            <div className="flex flex-col gap-2">
                <button onClick={() => playerRotate()} className="w-16 h-16 glass !rounded-full flex items-center justify-center !bg-cyan-500/20"><ArrowUp /></button>
                <button onClick={() => hardDrop()} className="w-16 h-16 glass !rounded-full flex items-center justify-center !bg-purple-500/20 self-center"><Zap /></button>
            </div>
        </div>

      </div>
    </div>
  );
}

