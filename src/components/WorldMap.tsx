import React, { useEffect, useState, useCallback } from 'react';
import { WorldData, MapNode } from '../types';
import { sound } from '../audio';
import { Play, Edit3, Castle, Flag, CheckCircle2, ChevronRight, Compass } from 'lucide-react';

interface WorldMapProps {
  world: WorldData;
  onSelectLevel: (levelId: string, autoPlay: boolean) => void;
  onUpdateWorld: (world: WorldData) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({ world, onSelectLevel, onUpdateWorld }) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>(world.playerNodeId || 'node_1');
  const [animStep, setAnimStep] = useState<number>(0);

  // Sync avatar step animation
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimStep((prev) => (prev + 1) % 4);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const currentNode = world.nodes.find((n) => n.id === currentNodeId) || world.nodes[0];
  const currentLevel = currentNode ? world.levels[currentNode.levelId] : null;

  // Find accessible neighboring nodes along paths
  const getNeighbors = useCallback(
    (nodeId: string): MapNode[] => {
      const neighborIds = new Set<string>();
      world.paths.forEach((p) => {
        if (p.from === nodeId) neighborIds.add(p.to);
        if (p.to === nodeId) neighborIds.add(p.from);
      });
      return world.nodes.filter((n) => neighborIds.has(n.id));
    },
    [world]
  );

  // Navigate to neighbor
  const moveToNode = useCallback(
    (targetNode: MapNode) => {
      if (targetNode.id === currentNodeId) return;
      setCurrentNodeId(targetNode.id);
      sound.playNodeStep();
      onUpdateWorld({
        ...world,
        playerNodeId: targetNode.id,
      });
    },
    [currentNodeId, onUpdateWorld, world]
  );

  // Keyboard navigation on World Map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const neighbors = getNeighbors(currentNodeId);
      const curr = world.nodes.find((n) => n.id === currentNodeId);
      if (!curr) return;

      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        const next = neighbors.find((n) => n.x > curr.x);
        if (next) moveToNode(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        const next = neighbors.find((n) => n.x < curr.x);
        if (next) moveToNode(next);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        const next = neighbors.find((n) => n.y < curr.y);
        if (next) moveToNode(next);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        const next = neighbors.find((n) => n.y > curr.y);
        if (next) moveToNode(next);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (curr) {
          e.preventDefault();
          onSelectLevel(curr.levelId, true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNodeId, getNeighbors, moveToNode, onSelectLevel, world.nodes]);

  // World grid sizing: 10 columns by 6 rows
  const COLS = 10;
  const ROWS = 6;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Overworld Map Canvas Frame */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Retro World Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{world.title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Overworld Navigation</span>
                <span aria-hidden="true">·</span>
                <span>Use Arrow keys or Click to move</span>
                <span aria-hidden="true">·</span>
                <span>Press Enter to play</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono-num bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <span>Cleared Stages:</span>
            <span className="text-emerald-400 font-bold">
              {world.nodes.filter((n) => n.cleared).length} / {world.nodes.length}
            </span>
          </div>
        </div>

        {/* 10x6 Overworld Grid Board */}
        <div className="relative mt-6 w-full aspect-[16/9] max-h-[500px] bg-[#0c1322] rounded-xl border border-slate-800 p-4 select-none overflow-hidden">
          {/* Subtle grid background pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px',
            }}
          />

          {/* Overworld Paths (SVG lines) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {world.paths.map((path, idx) => {
              const nodeA = world.nodes.find((n) => n.id === path.from);
              const nodeB = world.nodes.find((n) => n.id === path.to);
              if (!nodeA || !nodeB) return null;

              const x1 = `${(nodeA.x + 0.5) * (100 / COLS)}%`;
              const y1 = `${(nodeA.y + 0.5) * (100 / ROWS)}%`;
              const x2 = `${(nodeB.x + 0.5) * (100 / COLS)}%`;
              const y2 = `${(nodeB.y + 0.5) * (100 / ROWS)}%`;

              const isCompleted = nodeA.cleared;

              return (
                <g key={idx}>
                  {/* Outer glow line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isCompleted ? '#10b981' : '#334155'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                  />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isCompleted ? '#34d399' : '#64748b'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                  />
                </g>
              );
            })}
          </svg>

          {/* Overworld Nodes */}
          {world.nodes.map((node) => {
            const isCurrent = node.id === currentNodeId;
            const isCleared = node.cleared;
            const leftPct = (node.x + 0.5) * (100 / COLS);
            const topPct = (node.y + 0.5) * (100 / ROWS);

            return (
              <div
                key={node.id}
                onClick={() => moveToNode(node)}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute cursor-pointer flex flex-col items-center group transition-transform ${
                  isCurrent ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                }`}
              >
                {/* Node Island Badge */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg relative ${
                    isCurrent
                      ? 'ring-4 ring-amber-400 bg-slate-800 border-2 border-amber-300'
                      : isCleared
                      ? 'bg-emerald-950/80 border-2 border-emerald-500/80'
                      : 'bg-slate-800/90 border-2 border-slate-700'
                  }`}
                >
                  {node.type === 'castle' ? (
                    <Castle
                      className={`w-7 h-7 ${
                        isCleared ? 'text-amber-400' : 'text-red-400'
                      }`}
                    />
                  ) : (
                    <Flag
                      className={`w-6 h-6 ${
                        isCleared ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    />
                  )}

                  {/* Cleared Star Badge */}
                  {isCleared && (
                    <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                    </div>
                  )}
                </div>

                {/* Node Label */}
                <span
                  className={`mt-2 text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-300 bg-slate-900/90 border border-slate-800'
                  }`}
                >
                  {node.name}
                </span>

                {/* Animated Mini Avatar when player is standing on this node */}
                {isCurrent && (
                  <div className="absolute -top-11 flex flex-col items-center pointer-events-none animate-bounce">
                    <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg">
                      <span className="font-arcade text-[10px] text-white">M</span>
                    </div>
                    <div className="w-2 h-2 bg-amber-400 rotate-45 -mt-1 shadow" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Virtual Overworld D-Pad Controls for HP & Tablet */}
        <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-amber-400 font-bold font-mono">📱 KONTROL PETA:</span>
            <span>Gunakan tombol panah di bawah untuk mengarahkan avatar</span>
          </div>

          <div className="flex items-center gap-2 select-none touch-none">
            <button
              onClick={() => {
                const curr = world.nodes.find((n) => n.id === currentNodeId);
                const next = getNeighbors(currentNodeId).find((n) => curr && n.x < curr.x);
                if (next) moveToNode(next);
              }}
              className="w-10 h-10 bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-100 rounded-lg border border-slate-700 flex items-center justify-center font-bold text-sm shadow cursor-pointer active:scale-95"
              title="Navigasi Kiri"
            >
              ◀
            </button>
            <button
              onClick={() => {
                const curr = world.nodes.find((n) => n.id === currentNodeId);
                const next = getNeighbors(currentNodeId).find((n) => curr && n.y < curr.y);
                if (next) moveToNode(next);
              }}
              className="w-10 h-10 bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-100 rounded-lg border border-slate-700 flex items-center justify-center font-bold text-sm shadow cursor-pointer active:scale-95"
              title="Navigasi Atas"
            >
              ▲
            </button>
            <button
              onClick={() => {
                const curr = world.nodes.find((n) => n.id === currentNodeId);
                const next = getNeighbors(currentNodeId).find((n) => curr && n.y > curr.y);
                if (next) moveToNode(next);
              }}
              className="w-10 h-10 bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-100 rounded-lg border border-slate-700 flex items-center justify-center font-bold text-sm shadow cursor-pointer active:scale-95"
              title="Navigasi Bawah"
            >
              ▼
            </button>
            <button
              onClick={() => {
                const curr = world.nodes.find((n) => n.id === currentNodeId);
                const next = getNeighbors(currentNodeId).find((n) => curr && n.x > curr.x);
                if (next) moveToNode(next);
              }}
              className="w-10 h-10 bg-slate-800 active:bg-amber-400 active:text-slate-950 text-slate-100 rounded-lg border border-slate-700 flex items-center justify-center font-bold text-sm shadow cursor-pointer active:scale-95"
              title="Navigasi Kanan"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Selected Stage Action Strip */}
        {currentNode && currentLevel && (
          <div className="mt-4 p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border font-arcade text-sm ${
                  currentNode.cleared
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                }`}
              >
                {currentNode.type === 'castle' ? 'BOSS' : 'LVL'}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-100">{currentLevel.name}</h3>
                  {currentNode.cleared && (
                    <span className="text-xs text-emerald-400 font-medium">· Cleared ⭐</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="capitalize">Tema: {currentLevel.theme}</span>
                  <span aria-hidden="true">·</span>
                  <span>Grid: {currentLevel.cols}x{currentLevel.rows}</span>
                  <span aria-hidden="true">·</span>
                  <span>Batas Waktu: {currentLevel.timeLimit}s</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => onSelectLevel(currentLevel.id, false)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Stage</span>
              </button>

              <button
                onClick={() => onSelectLevel(currentLevel.id, true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-lg shadow-amber-400/20 font-bold cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mainkan Level</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
