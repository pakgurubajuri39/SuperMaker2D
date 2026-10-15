import React, { useState, useEffect } from 'react';
import { WorldData, LevelData, createDefaultWorld, createLevel1, createLevel2, createLevel3, createLevel4 } from './types';
import { LandingPage } from './components/LandingPage';
import { WorldMap } from './components/WorldMap';
import { LevelEditor } from './components/LevelEditor';
import { PlayMode } from './components/PlayMode';
import { DataModal } from './components/DataModal';
import { AudioToggle } from './components/AudioToggle';
import { GameStats } from './gameEngine';
import { sound } from './audio';
import {
  Gamepad2,
  Compass,
  Edit3,
  Play,
  Square,
  FileDown,
  Layers,
  Sparkles,
  HelpCircle,
  Volume2,
  VolumeX,
  Home,
  Check,
} from 'lucide-react';

type ViewMode = 'landing' | 'world_map' | 'editor' | 'play';

const STORAGE_KEY = 'super_maker_2d_world_save_v1';

export default function App() {
  // Load initial world from localStorage or default preset
  const [world, setWorld] = useState<WorldData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as WorldData;
      }
    } catch (e) {
      console.warn('Could not read saved world from localStorage:', e);
    }
    return createDefaultWorld();
  });

  const [activeLevelId, setActiveLevelId] = useState<string>('lvl_1');
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [showPresetsMenu, setShowPresetsMenu] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(!sound.enabled);

  // Autosave to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
    } catch (e) {
      console.warn('Could not save world to localStorage:', e);
    }
  }, [world]);

  const activeLevel = world.levels[activeLevelId] || world.levels['lvl_1'];

  // Handle Level updates from editor
  const handleUpdateLevel = (updatedLevel: LevelData) => {
    setWorld((prev) => ({
      ...prev,
      levels: {
        ...prev.levels,
        [updatedLevel.id]: updatedLevel,
      },
    }));
  };

  // Handle stage cleared in play mode
  const handleStageCleared = (lvlId: string, stats: GameStats) => {
    setWorld((prev) => {
      const updatedNodes = prev.nodes.map((node) => {
        if (node.levelId === lvlId) {
          return { ...node, cleared: true };
        }
        return node;
      });

      return {
        ...prev,
        nodes: updatedNodes,
      };
    });
  };

  // Select level from world map or preset
  const handleSelectLevel = (lvlId: string, autoPlay: boolean) => {
    setActiveLevelId(lvlId);
    if (autoPlay) {
      setCurrentView('play');
    } else {
      setCurrentView('editor');
    }
  };

  // Reset all to default preset world
  const handleResetDefaults = () => {
    if (window.confirm('Reset seluruh dunia dan 4 stage ke kondisi awal?')) {
      const freshWorld = createDefaultWorld();
      setWorld(freshWorld);
      setActiveLevelId('lvl_1');
      setCurrentView('world_map');
      sound.playFanfare();
    }
  };

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundMuted(!sound.enabled);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Universal Top Bar Contract:
          [Brand title, 1-line] — [4-5 clean single-line nav links] — [1 primary action] */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 shrink-0 text-left bg-transparent border-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-arcade text-xs shadow-md shadow-amber-400/20">
            M
          </div>
          <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap font-arcade hover:text-amber-300 transition-colors">
            SUPER MAKER 2D
          </span>
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <button
            onClick={() => setCurrentView('landing')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer ${
              currentView === 'landing' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </button>

          <button
            onClick={() => setCurrentView('world_map')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer ${
              currentView === 'world_map' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Peta Dunia</span>
          </button>

          <button
            onClick={() => setCurrentView('editor')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer ${
              currentView === 'editor' ? 'text-amber-400 font-bold' : ''
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Level Editor</span>
          </button>

          {/* Preset stages dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pilihan Level ({Object.keys(world.levels).length})</span>
            </button>

            {showPresetsMenu && (
              <div
                className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowPresetsMenu(false)}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Pilih Stage
                </div>
                {Object.values(world.levels).map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => {
                      setActiveLevelId(lvl.id);
                      setShowPresetsMenu(false);
                      setCurrentView('editor');
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                      activeLevelId === lvl.id ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <span>{lvl.name}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{lvl.theme}</span>
                  </button>
                ))}
                <div className="border-t border-slate-800 my-1.5" />
                <button
                  onClick={() => {
                    handleResetDefaults();
                    setShowPresetsMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Reset Semua Level
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsDataModalOpen(true)}
            className="flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Ekspor / Impor</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 hover:text-amber-400 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Petunjuk</span>
          </button>
        </nav>

        {/* Zone 3: Audio Toggle & Primary Action (Visible across PC, Laptop, Tablet, & HP) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <AudioToggle />

          {currentView === 'play' ? (
            <button
              onClick={() => setCurrentView('editor')}
              className="px-3.5 py-2 sm:px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-red-600/20 font-arcade cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentView('play')}
              className="px-4 py-2 sm:px-5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-400/20 font-arcade cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden xs:inline">MAIN</span>
              <span className="xs:hidden">PLAY</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col items-center">
        {/* Navigation Tabs for mobile/small viewports */}
        <div className="flex md:hidden w-full items-center justify-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-4 text-xs font-medium">
          <button
            onClick={() => setCurrentView('landing')}
            className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
              currentView === 'landing' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Beranda
          </button>
          <button
            onClick={() => setCurrentView('world_map')}
            className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
              currentView === 'world_map' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Peta
          </button>
          <button
            onClick={() => setCurrentView('editor')}
            className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
              currentView === 'editor' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setCurrentView('play')}
            className={`flex-1 py-2 text-center rounded-lg transition-colors cursor-pointer ${
              currentView === 'play' ? 'bg-emerald-400 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            Main
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="px-2.5 py-2 text-slate-400 cursor-pointer"
          >
            Bantuan
          </button>
        </div>

        {/* View 0: Landing Page */}
        {currentView === 'landing' && (
          <LandingPage
            world={world}
            onStartAdventure={() => setCurrentView('world_map')}
            onOpenEditor={(lvlId) => {
              if (lvlId) setActiveLevelId(lvlId);
              setCurrentView('editor');
            }}
            onPlayStage={(lvlId) => {
              setActiveLevelId(lvlId);
              setCurrentView('play');
            }}
            onOpenGuide={() => setShowHelpModal(true)}
          />
        )}

        {/* View 1: World Map View */}
        {currentView === 'world_map' && (
          <WorldMap
            world={world}
            onSelectLevel={handleSelectLevel}
            onUpdateWorld={(w) => setWorld(w)}
          />
        )}

        {/* View 2: Level Editor View */}
        {currentView === 'editor' && (
          <LevelEditor
            level={activeLevel}
            onUpdateLevel={handleUpdateLevel}
            onStartPlaytest={() => setCurrentView('play')}
          />
        )}

        {/* View 3: Play / Test Mode View */}
        {currentView === 'play' && (
          <PlayMode
            level={activeLevel}
            onStop={() => setCurrentView('editor')}
            onStageCleared={handleStageCleared}
            onOpenMap={() => setCurrentView('world_map')}
          />
        )}
      </main>

      {/* Footer with user requested signature */}
      <footer className="w-full border-t border-slate-800/80 py-5 px-6 text-xs text-slate-400 bg-slate-950/60">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-arcade text-[10px] text-amber-400">SUPER MAKER 2D</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300 font-semibold">@created by. Pak GuruAI</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Tersimpan Otomatis di Browser</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsDataModalOpen(true)}
              className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Ekspor JSON
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Petunjuk Game
            </button>
          </div>
        </div>
      </footer>

      {/* Export / Import Modal */}
      <DataModal
        world={world}
        activeLevel={activeLevel}
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onImportWorld={(imported) => {
          setWorld(imported);
          const firstLvl = Object.keys(imported.levels)[0];
          if (firstLvl) setActiveLevelId(firstLvl);
        }}
      />

      {/* Petunjuk Game Modal dalam Bahasa Indonesia */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📖</span>
                <h3 className="font-arcade text-sm text-amber-400">PETUNJUK LENGKAP GAME</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Petunjuk 1 */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="font-bold text-amber-400 font-arcade text-[11px] flex items-center gap-1.5">
                  <span>🎮</span> KONTROL PEMAIN (KEYBOARD &amp; HP/TABLET)
                </span>
                <p className="mt-2 text-slate-300 leading-relaxed">
                  • <strong>Berjalan / Lari:</strong> Tombol <span className="text-amber-300 font-mono">[A / D]</span> atau Panah Kiri / Kanan. Pada layar HP / Tablet, sentuh tombol virtual <strong>[◀ KIRI]</strong> dan <strong>[▶ KANAN]</strong>.<br />
                  • <strong>Melompat:</strong> Tekan <span className="text-amber-300 font-mono">[Spasi]</span>, <span className="text-amber-300 font-mono">[W]</span>, atau Panah Atas. Pada HP / Tablet, tekan tombol bulat <strong>[LOMPAT]</strong>. Tahan lompat lebih lama untuk melompat lebih tinggi.<br />
                  • <strong>Ulangi / Restart:</strong> Tekan tombol <span className="text-amber-300 font-mono">[R]</span>.<br />
                  • <strong>Keluar / Stop:</strong> Tekan tombol <span className="text-amber-300 font-mono">[Esc]</span>.
                </p>
              </div>

              {/* Petunjuk 2 */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="font-bold text-sky-400 font-arcade text-[11px] flex items-center gap-1.5">
                  <span>⚔️</span> CARA MENGALAHKAN MUSUH &amp; MENGUMPULKAN KOIN
                </span>
                <p className="mt-2 text-slate-300 leading-relaxed">
                  • <strong>Injak Goomba dari Atas:</strong> Saat melayang turun, daratkan kaki tepat di atas kepala musuh. Musuh akan gepeng (+200 poin) dan pemain akan memantul tinggi ke atas!<br />
                  • <strong>Balok Misteri [?]:</strong> Sundul balok tanda tanya dari arah bawah untuk mengeluarkan koin emas berkilau (+100 poin).<br />
                  • <strong>Awas Duri Merah:</strong> Jangan menyentuh duri tajam di lantai atau dinding, karena dapat membuat pemain langsung respawn.
                </p>
              </div>

              {/* Petunjuk 3 */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="font-bold text-emerald-400 font-arcade text-[11px] flex items-center gap-1.5">
                  <span>🗺️</span> PETA DUNIA (OVERWORLD MAP)
                </span>
                <p className="mt-2 text-slate-300 leading-relaxed">
                  • Jelajahi jalur stage menggunakan tombol panah keyboard atau <strong>D-Pad sentuh HP</strong>.<br />
                  • Tekan <strong>[Enter]</strong> atau sentuh tombol <strong>[Mainkan Level]</strong> untuk memulai permainan pada stage tersebut.<br />
                  • Level yang telah diselesaikan akan ditandai dengan bintang emas <strong>⭐ Cleared</strong>.
                </p>
              </div>

              {/* Petunjuk 4 */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="font-bold text-rose-400 font-arcade text-[11px] flex items-center gap-1.5">
                  <span>✏️</span> LEVEL EDITOR (PEMBUAT STAGE)
                </span>
                <p className="mt-2 text-slate-300 leading-relaxed">
                  • <strong>Klik Kiri:</strong> Menaruh balok terpilih (Tanah, Balok ?, Duri, Koin, Musuh, Tiang Bendera).<br />
                  • <strong>Klik Kanan:</strong> Menghapus balok yang ada.<br />
                  • <strong>Slider Bawah:</strong> Menggeser posisi kanvas sepanjang 80 balok.<br />
                  • <strong>PLAYTEST:</strong> Klik tombol hijau untuk langsung menguji stage kreasi Anda!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-1 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors font-arcade cursor-pointer"
            >
              MENGERTI, AYO BERMAIN!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
