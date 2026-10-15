import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LevelData, STAGE_ROWS, TILE_SIZE } from '../types';
import { GameEngine, GameStats } from '../gameEngine';
import { sound, audioManager } from '../audio';
import { AudioToggle } from './AudioToggle';
import {
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  ArrowRight,
  Compass,
  Sparkles,
} from 'lucide-react';

interface PlayModeProps {
  level: LevelData;
  onStop: () => void;
  onStageCleared: (levelId: string, stats: GameStats) => void;
  onOpenMap: () => void;
}

export const PlayMode: React.FC<PlayModeProps> = ({
  level,
  onStop,
  onStageCleared,
  onOpenMap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [isMuted, setIsMuted] = useState<boolean>(!sound.enabled);
  const [victoryStats, setVictoryStats] = useState<GameStats | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(960);
  const canvasHeight = STAGE_ROWS * TILE_SIZE; // 480px

  // Resize canvas width according to container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasWidth(Math.min(containerRef.current.clientWidth, 1200));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize and run Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleVictory = (stats: GameStats) => {
      setVictoryStats(stats);
      onStageCleared(level.id, stats);
    };

    const engine = new GameEngine(canvas, level, handleVictory);
    engineRef.current = engine;
    engine.start();

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.keys.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.keys.right = true;
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        engine.keys.jump = true;
        engine.keys.jumpPressed = true;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        engine.keys.down = true;
      } else if (e.key === 'r' || e.key === 'R') {
        engine.respawnPlayer();
        sound.playHurt();
      } else if (e.key === 'Escape') {
        onStop();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engine.keys.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engine.keys.right = false;
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        engine.keys.jump = false;
        engine.keys.jumpPressed = false;
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        engine.keys.down = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      engine.stop();
    };
  }, [level, onStageCleared, onStop]);

  // Restart current stage
  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.resetLevel();
      setVictoryStats(null);
    }
  };

  // Toggle Mute
  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setIsMuted(!sound.enabled);
  };

  // Touch button controls for mobile
  const handleTouchLeft = (pressed: boolean) => {
    if (engineRef.current) engineRef.current.keys.left = pressed;
  };
  const handleTouchRight = (pressed: boolean) => {
    if (engineRef.current) engineRef.current.keys.right = pressed;
  };
  const handleTouchJump = (pressed: boolean) => {
    if (engineRef.current) {
      engineRef.current.keys.jump = pressed;
      if (pressed) engineRef.current.keys.jumpPressed = true;
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Top Play Control Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-arcade text-xs text-emerald-400">PLAYTEST MODE</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-xs text-slate-300 font-bold hidden sm:inline">{level.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <AudioToggle />

          <button
            onClick={handleRestart}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ulangi Stage (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ulangi</span>
            <span className="font-mono-num">(R)</span>
          </button>

          <button
            onClick={onStop}
            className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-red-600/20 font-arcade"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            STOP TEST
          </button>
        </div>
      </div>

      {/* Main Play Canvas Frame */}
      <div
        ref={containerRef}
        className="w-full max-w-5xl bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col items-center"
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="block pixelated select-none max-w-full h-auto object-contain"
        />

        {/* Victory Celebration Modal */}
        {victoryStats && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-30">
            <div className="w-full max-w-md bg-slate-900 border-2 border-amber-400 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mb-4 text-amber-400">
                <Trophy className="w-8 h-8" />
              </div>

              <h2 className="font-arcade text-lg text-amber-400 tracking-wider">STAGE CLEAR!</h2>
              <p className="text-xs text-slate-400 mt-1">{level.name}</p>

              {/* Stats Breakdown */}
              <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 my-5 flex flex-col gap-2.5 text-xs font-mono-num">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Coins Gathered:</span>
                  <span className="text-amber-400 font-bold font-arcade">★ {victoryStats.coins}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Enemies Stomped:</span>
                  <span className="text-rose-400 font-bold font-arcade">⚔ {victoryStats.enemiesStomped}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Time Bonus:</span>
                  <span className="text-emerald-400 font-bold font-arcade">
                    +{Math.floor(victoryStats.timeRemaining) * 10}
                  </span>
                </div>
                <div className="h-px bg-slate-800 my-1" />
                <div className="flex justify-between items-center text-sm font-bold text-slate-100">
                  <span>Total Score:</span>
                  <span className="text-sky-400 font-arcade">{victoryStats.score}</span>
                </div>
              </div>

              {/* Victory Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={onOpenMap}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 font-arcade"
                >
                  <Compass className="w-4 h-4" />
                  WORLD MAP
                </button>

                <button
                  onClick={handleRestart}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  Replay
                </button>

                <button
                  onClick={onStop}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Virtual On-Screen Gamepad Controls for HP & Tablet */}
      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-3">
        {/* Status & Hints Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono-num border-b border-slate-800/80 pb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">🎮 KONTROL VIRTUAL:</span>
            <span>Gunakan tombol sentuh di bawah jika menggunakan HP / Tablet</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-400">
            <span>Keyboard: [A/D] Jalan · [Spasi/W] Lompat · [R] Ulang · [Esc] Stop</span>
          </div>
        </div>

        {/* Tactile Virtual Touch Buttons */}
        <div className="flex items-center justify-between gap-4 select-none touch-none py-1">
          {/* Left / Right Directional Controls */}
          <div className="flex items-center gap-3">
            <button
              onTouchStart={(e) => { e.preventDefault(); handleTouchLeft(true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleTouchLeft(false); }}
              onMouseDown={() => handleTouchLeft(true)}
              onMouseUp={() => handleTouchLeft(false)}
              className="w-16 h-14 sm:w-20 sm:h-16 bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-100 rounded-2xl border-2 border-slate-700 active:border-amber-300 flex flex-col items-center justify-center font-bold text-lg sm:text-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Gerak Kiri (A / Panah Kiri)"
            >
              <span>◀</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 -mt-1 font-arcade">KIRI</span>
            </button>

            <button
              onTouchStart={(e) => { e.preventDefault(); handleTouchRight(true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleTouchRight(false)} }
              onMouseDown={() => handleTouchRight(true)}
              onMouseUp={() => handleTouchRight(false)}
              className="w-16 h-14 sm:w-20 sm:h-16 bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-100 rounded-2xl border-2 border-slate-700 active:border-amber-300 flex flex-col items-center justify-center font-bold text-lg sm:text-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Gerak Kanan (D / Panah Kanan)"
            >
              <span>▶</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 -mt-1 font-arcade">KANAN</span>
            </button>
          </div>

          {/* Center Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="px-3 py-2 sm:px-4 sm:py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow"
              title="Ulangi Level"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ulangi</span>
              <span className="font-mono-num">(R)</span>
            </button>
          </div>

          {/* Jump Action Button (Big arcade button) */}
          <div className="flex items-center gap-3">
            <button
              onTouchStart={(e) => { e.preventDefault(); handleTouchJump(true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleTouchJump(false); }}
              onMouseDown={() => handleTouchJump(true)}
              onMouseUp={() => handleTouchJump(false)}
              className="w-24 h-14 sm:w-28 sm:h-16 bg-gradient-to-t from-amber-500 to-amber-400 active:from-amber-400 active:to-amber-300 text-slate-950 rounded-2xl border-2 border-amber-300 shadow-xl shadow-amber-400/30 flex flex-col items-center justify-center font-arcade text-xs sm:text-sm font-black transition-transform active:scale-95 cursor-pointer"
              title="Melompat (Spasi / W / Panah Atas)"
            >
              <span>LOMPAT</span>
              <span className="text-[9px] opacity-80 font-sans tracking-wide">JUMP [A]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
