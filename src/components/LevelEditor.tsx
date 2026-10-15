import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LevelData, Tile, TILE_DEFS, TILE_SIZE, STAGE_COLS, STAGE_ROWS, ThemeType, createEmptyGrid } from '../types';
import { sound } from '../audio';
import {
  Grid,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Maximize2,
  Trash2,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LevelEditorProps {
  level: LevelData;
  onUpdateLevel: (updated: LevelData) => void;
  onStartPlaytest: () => void;
}

export const LevelEditor: React.FC<LevelEditorProps> = ({
  level,
  onUpdateLevel,
  onStartPlaytest,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active Tool Brush (0 to 7)
  const [activeTile, setActiveTile] = useState<Tile>(Tile.SOLID);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [scrollX, setScrollX] = useState<number>(0);

  // Mouse drag & interaction states
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [mouseButton, setMouseButton] = useState<number>(0); // 0 = left, 2 = right
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStartX, setPanStartX] = useState<number>(0);
  const [panStartScrollX, setPanStartScrollX] = useState<number>(0);
  const [hoverTile, setHoverTile] = useState<{ col: number; row: number } | null>(null);

  // Total canvas pixel width & height
  const stagePixelWidth = STAGE_COLS * TILE_SIZE; // 2560px
  const stagePixelHeight = STAGE_ROWS * TILE_SIZE; // 480px

  // Maximum scrollable width depending on viewport width
  const [viewportWidth, setViewportWidth] = useState<number>(960);

  // Measure container width
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setViewportWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxScrollX = Math.max(0, stagePixelWidth - viewportWidth);

  // Clamped scroll setter
  const safeSetScrollX = useCallback(
    (newX: number) => {
      setScrollX(Math.max(0, Math.min(maxScrollX, newX)));
    },
    [maxScrollX]
  );

  // Paint or erase tile in level grid
  const applyBrush = useCallback(
    (col: number, row: number, tileType: Tile) => {
      if (col < 0 || col >= STAGE_COLS || row < 0 || row >= STAGE_ROWS) return;

      const newGrid = level.grid.map((r) => [...r]);

      // If placing Player Start, clear any previous Player Start
      if (tileType === Tile.PLAYER_START) {
        for (let r = 0; r < STAGE_ROWS; r++) {
          for (let c = 0; c < STAGE_COLS; c++) {
            if (newGrid[r][c] === Tile.PLAYER_START) {
              newGrid[r][c] = Tile.AIR;
            }
          }
        }
      }

      // If placing Goal, clear any previous Goal
      if (tileType === Tile.GOAL) {
        for (let r = 0; r < STAGE_ROWS; r++) {
          for (let c = 0; c < STAGE_COLS; c++) {
            if (newGrid[r][c] === Tile.GOAL) {
              newGrid[r][c] = Tile.AIR;
            }
          }
        }
      }

      if (newGrid[row][col] !== tileType) {
        newGrid[row][col] = tileType;
        onUpdateLevel({
          ...level,
          grid: newGrid,
        });
      }
    },
    [level, onUpdateLevel]
  );

  // Mouse Event Handlers on Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Middle click (button 1) or Alt + Left click: Pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStartX(e.clientX);
      setPanStartScrollX(scrollX);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = e.clientX - rect.left + scrollX;
    const mouseCanvasY = e.clientY - rect.top;

    const col = Math.floor(mouseCanvasX / TILE_SIZE);
    const row = Math.floor(mouseCanvasY / TILE_SIZE);

    setIsMouseDown(true);
    setMouseButton(e.button);

    if (e.button === 0) {
      // Left click -> paint activeTile
      applyBrush(col, row, activeTile);
    } else if (e.button === 2) {
      // Right click -> erase to AIR
      applyBrush(col, row, Tile.AIR);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning) {
      const dx = e.clientX - panStartX;
      safeSetScrollX(panStartScrollX - dx);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = e.clientX - rect.left + scrollX;
    const mouseCanvasY = e.clientY - rect.top;

    const col = Math.floor(mouseCanvasX / TILE_SIZE);
    const row = Math.floor(mouseCanvasY / TILE_SIZE);

    if (col >= 0 && col < STAGE_COLS && row >= 0 && row < STAGE_ROWS) {
      setHoverTile({ col, row });
    } else {
      setHoverTile(null);
    }

    if (isMouseDown) {
      if (mouseButton === 0) {
        applyBrush(col, row, activeTile);
      } else if (mouseButton === 2) {
        applyBrush(col, row, Tile.AIR);
      }
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
    setIsPanning(false);
    setHoverTile(null);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent native right-click menu
  };

  // Mouse wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    safeSetScrollX(scrollX + delta);
  };

  // Touch event handlers for tablets and mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = touch.clientX - rect.left + scrollX;
    const mouseCanvasY = touch.clientY - rect.top;
    const col = Math.floor(mouseCanvasX / TILE_SIZE);
    const row = Math.floor(mouseCanvasY / TILE_SIZE);
    setIsMouseDown(true);
    setMouseButton(0);
    applyBrush(col, row, activeTile);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = touch.clientX - rect.left + scrollX;
    const mouseCanvasY = touch.clientY - rect.top;
    const col = Math.floor(mouseCanvasX / TILE_SIZE);
    const row = Math.floor(mouseCanvasY / TILE_SIZE);
    if (col >= 0 && col < STAGE_COLS && row >= 0 && row < STAGE_ROWS) {
      setHoverTile({ col, row });
      applyBrush(col, row, activeTile);
    }
  };

  const handleTouchEnd = () => {
    setIsMouseDown(false);
    setHoverTile(null);
  };

  // Keyboard shortcuts for brush selection (0-7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num in TILE_DEFS) {
        setActiveTile(num as Tile);
        sound.playNodeStep();
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGrid((prev) => !prev);
      } else if (e.key === 'p' || e.key === 'P') {
        onStartPlaytest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartPlaytest]);

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Background depending on theme
    const theme = level.theme;
    if (theme === 'grassland') {
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#38bdf8');
      grad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);
    } else if (theme === 'underground') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, cw, ch);
    } else if (theme === 'sky') {
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#4338ca');
      grad.addColorStop(1, '#f472b6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(1, '#44403c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);
    }

    ctx.save();
    ctx.translate(-Math.floor(scrollX), 0);

    const startCol = Math.max(0, Math.floor(scrollX / TILE_SIZE));
    const endCol = Math.min(STAGE_COLS - 1, Math.ceil((scrollX + cw) / TILE_SIZE));

    // Draw Stage Tiles
    for (let r = 0; r < STAGE_ROWS; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = level.grid[r][c];
        const tx = c * TILE_SIZE;
        const ty = r * TILE_SIZE;

        if (tile !== Tile.AIR) {
          drawEditorTile(ctx, tile, tx, ty, c, r, level.theme, level.grid);
        }
      }
    }

    // Draw Grid Lines
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let c = startCol; c <= endCol + 1; c++) {
        const gx = c * TILE_SIZE;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, ch);
        ctx.stroke();
      }

      // Horizontal lines
      for (let r = 0; r <= STAGE_ROWS; r++) {
        const gy = r * TILE_SIZE;
        ctx.beginPath();
        ctx.moveTo(startCol * TILE_SIZE, gy);
        ctx.lineTo((endCol + 1) * TILE_SIZE, gy);
        ctx.stroke();
      }
    }

    // Draw Hover Cursor Ghost
    if (hoverTile) {
      const hx = hoverTile.col * TILE_SIZE;
      const hy = hoverTile.row * TILE_SIZE;

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 1, hy + 1, TILE_SIZE - 2, TILE_SIZE - 2);

      // Ghost preview of active tile
      if (activeTile !== Tile.AIR) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        drawEditorTile(ctx, activeTile, hx, hy, hoverTile.col, hoverTile.row, level.theme, level.grid);
        ctx.restore();
      } else {
        // Red cross for eraser
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx + 4, hy + 4);
        ctx.lineTo(hx + TILE_SIZE - 4, hy + TILE_SIZE - 4);
        ctx.moveTo(hx + TILE_SIZE - 4, hy + 4);
        ctx.lineTo(hx + 4, hy + TILE_SIZE - 4);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [level, scrollX, showGrid, hoverTile, activeTile, viewportWidth]);

  // Quick Tools: Auto-fill ground
  const handleFillGround = () => {
    const newGrid = level.grid.map((r) => [...r]);
    for (let c = 0; c < STAGE_COLS; c++) {
      newGrid[STAGE_ROWS - 1][c] = Tile.SOLID;
      newGrid[STAGE_ROWS - 2][c] = Tile.SOLID;
    }
    onUpdateLevel({ ...level, grid: newGrid });
    sound.playBlockHit();
  };

  // Quick Tools: Clear Stage
  const handleClearStage = () => {
    if (window.confirm('Clear all placed tiles from this stage?')) {
      const emptyGrid = createEmptyGrid();
      onUpdateLevel({ ...level, grid: emptyGrid });
      sound.playHurt();
    }
  };

  // Change Theme
  const handleThemeChange = (newTheme: ThemeType) => {
    onUpdateLevel({ ...level, theme: newTheme });
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Level Editor Toolbar */}
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="font-arcade text-xs text-amber-400">STAGE BUILDER</span>
            <span className="text-slate-600">|</span>
            <input
              type="text"
              value={level.name}
              onChange={(e) => onUpdateLevel({ ...level, name: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-400 w-44"
              placeholder="Stage Name"
            />
          </div>

          {/* Theme Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              {(['grassland', 'underground', 'sky', 'castle'] as ThemeType[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => handleThemeChange(thm)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                    level.theme === thm
                      ? 'bg-amber-400 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {thm}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                showGrid
                  ? 'bg-slate-800 border-amber-400/50 text-amber-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Grid (G)"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              onClick={handleFillGround}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              title="Auto-fill Ground Floor"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Fill Ground</span>
            </button>

            <button
              onClick={handleClearStage}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-red-950/60 hover:border-red-600/50 text-slate-400 hover:text-red-300 text-xs flex items-center gap-1.5 transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>

            <button
              onClick={onStartPlaytest}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 font-arcade"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              PLAYTEST
            </button>
          </div>
        </div>

        {/* Tile Palette (8 Brushes with Keyboard Shortcuts) */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.values(TILE_DEFS).map((def) => {
            const isSelected = activeTile === def.id;
            return (
              <button
                key={def.id}
                onClick={() => {
                  setActiveTile(def.id);
                  sound.playNodeStep();
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-xs ${
                  isSelected
                    ? 'bg-slate-800 border-amber-400 text-white ring-2 ring-amber-400/20 shadow-md scale-105'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                {/* Tile Icon Preview */}
                <div
                  className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shadow"
                  style={{ backgroundColor: def.color, color: '#fff' }}
                >
                  {def.id === Tile.QUESTION ? '?' : def.id === Tile.COIN ? '★' : def.id === Tile.AIR ? '✕' : ''}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold">{def.name}</span>
                  <span className="text-[10px] text-slate-400">Key [{def.shortcut}]</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas Frame */}
      <div
        ref={containerRef}
        className="w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl p-3 shadow-2xl relative flex flex-col items-center select-none"
      >
        {/* Editor Controls Hint Bar */}
        <div className="w-full flex items-center justify-between text-xs text-slate-400 px-3 py-1.5 mb-2 bg-slate-950/40 rounded-lg">
          <div className="flex items-center gap-3">
            <span>Left Click: Paint</span>
            <span aria-hidden="true">·</span>
            <span>Right Click: Erase</span>
            <span aria-hidden="true">·</span>
            <span>Alt+Drag or Wheel: Pan</span>
          </div>
          <div className="font-mono-num text-slate-400">
            {hoverTile ? `Col: ${hoverTile.col} / ${STAGE_COLS} · Row: ${hoverTile.row}` : 'Hover over grid'}
          </div>
        </div>

        {/* Viewport Canvas Wrapper */}
        <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 relative">
          <canvas
            ref={canvasRef}
            width={viewportWidth}
            height={stagePixelHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={handleContextMenu}
            onWheel={handleWheel}
            className="cursor-crosshair block pixelated max-w-full touch-none select-none"
          />
        </div>

        {/* Horizontal Mini-Scrubber Track */}
        <div className="w-full mt-3 flex items-center gap-3 px-2">
          <button
            onClick={() => safeSetScrollX(0)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 font-mono-num"
            title="Jump to Start"
          >
            Start
          </button>

          <button
            onClick={() => safeSetScrollX(scrollX - 250)}
            className="p-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Interactive Range Scrubber */}
          <div className="flex-1 flex flex-col justify-center">
            <input
              type="range"
              min="0"
              max={maxScrollX}
              value={scrollX}
              onChange={(e) => safeSetScrollX(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono-num mt-1">
              <span>Col 0</span>
              <span>Col 40</span>
              <span>Col 80 (Goal)</span>
            </div>
          </div>

          <button
            onClick={() => safeSetScrollX(scrollX + 250)}
            className="p-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => safeSetScrollX(maxScrollX)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 font-mono-num"
            title="Jump to Goal"
          >
            Goal
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper: Draw Tile for Editor Canvas
function drawEditorTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  x: number,
  y: number,
  col: number,
  row: number,
  theme: ThemeType,
  grid: number[][]
) {
  const s = TILE_SIZE;

  switch (tile) {
    case Tile.SOLID: {
      if (theme === 'grassland') {
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#713f12';
        ctx.fillRect(x + 2, y + 8, s - 4, s - 10);
        ctx.fillStyle = '#a16207';
        ctx.fillRect(x + 4, y + 10, 10, 8);
        ctx.fillRect(x + 18, y + 20, 10, 8);

        const isTop = row === 0 || grid[row - 1][col] !== Tile.SOLID;
        if (isTop) {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(x, y, s, 6);
          ctx.fillStyle = '#16a34a';
          for (let i = 0; i < s; i += 6) {
            ctx.fillRect(x + i, y + 5, 3, 3);
          }
        }
      } else if (theme === 'underground') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        ctx.fillStyle = '#475569';
        ctx.fillRect(x + 4, y + 4, 10, 10);
        ctx.fillRect(x + 16, y + 16, 12, 10);
      } else if (theme === 'castle') {
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(x + 4, y + 4, 11, 10);
        ctx.fillRect(x + 17, y + 16, 11, 10);
      } else {
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#fdf2f8';
        ctx.fillRect(x + 4, y + 4, 8, 8);
        ctx.fillRect(x + 18, y + 16, 8, 8);
      }
      break;
    }

    case Tile.QUESTION: {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 3, y + 3, 2, 2);
      ctx.fillRect(x + s - 5, y + 3, 2, 2);
      ctx.fillRect(x + 3, y + s - 5, 2, 2);
      ctx.fillRect(x + s - 5, y + s - 5, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Press Start 2P", monospace';
      ctx.fillText('?', x + 9, y + 23);
      break;
    }

    case Tile.SPIKE: {
      ctx.fillStyle = '#94a3b8';
      for (let i = 0; i < 3; i++) {
        const sx = x + i * 10 + 2;
        ctx.beginPath();
        ctx.moveTo(sx, y + s);
        ctx.lineTo(sx + 5, y + 8);
        ctx.lineTo(sx + 10, y + s);
        ctx.fill();
      }
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x, y + s - 4, s, 4);
      break;
    }

    case Tile.COIN: {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 16, 7, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 16, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case Tile.ENEMY: {
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.arc(x + 16, y + 14, 11, Math.PI, 0);
      ctx.lineTo(x + 28, y + 22);
      ctx.lineTo(x + 4, y + 22);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + 8, y + 18, 16, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 10, y + 12, 3, 5);
      ctx.fillRect(x + 19, y + 12, 3, 5);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + 6, y + 24, 7, 4);
      ctx.fillRect(x + 19, y + 24, 7, 4);
      break;
    }

    case Tile.GOAL: {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(x + 13, y, 6, s);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x + 16, y + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(x + 19, y + 6);
      ctx.lineTo(x + 36, y + 14);
      ctx.lineTo(x + 19, y + 22);
      ctx.fill();
      break;
    }

    case Tile.PLAYER_START: {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.45)';
      ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('START', x + 3, y + 20);
      break;
    }
  }
}
