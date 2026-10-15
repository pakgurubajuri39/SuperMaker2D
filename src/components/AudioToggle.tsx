import React, { useEffect, useState } from 'react';
import { audioManager, AudioState } from '../audio';
import { Volume2, VolumeX, Volume1, Sliders } from 'lucide-react';

interface AudioToggleProps {
  compact?: boolean;
}

export const AudioToggle: React.FC<AudioToggleProps> = ({ compact = false }) => {
  const [audioState, setAudioState] = useState<AudioState>({
    muted: audioManager.isMuted(),
    volume: audioManager.getVolume(),
  });
  const [showSlider, setShowSlider] = useState<boolean>(false);

  useEffect(() => {
    // Subscribe to centralized audio manager updates
    const unsubscribe = audioManager.subscribe((state) => {
      setAudioState({ ...state });
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioManager.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audioManager.setVolume(val);
  };

  const isMuted = audioState.muted || audioState.volume === 0;

  return (
    <div className="relative flex items-center">
      <button
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowSlider((prev) => !prev);
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold select-none ${
          !isMuted
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 shadow-sm shadow-emerald-500/10'
            : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:border-slate-600'
        }`}
        title={!isMuted ? 'Suara Aktif (Klik untuk Mematikan)' : 'Suara Mati (Klik untuk Mengaktifkan)'}
        aria-label={!isMuted ? 'Matikan Suara Game' : 'Nyalakan Suara Game'}
      >
        {!isMuted ? (
          audioState.volume > 0.5 ? (
            <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Volume1 className="w-4 h-4 text-emerald-400 shrink-0" />
          )
        ) : (
          <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
        )}

        {/* Text label hidden on small phones, visible on tablet & laptop/PC */}
        <span className="hidden sm:inline font-mono-num whitespace-nowrap">
          {!isMuted ? `Suara: ${Math.round(audioState.volume * 100)}%` : 'Suara: MATI'}
        </span>
      </button>

      {/* Volume Quick Slider Popover on click/long press */}
      {showSlider && (
        <div
          className="absolute top-full right-0 mt-2 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col gap-2 w-44 animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => setShowSlider(false)}
        >
          <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold">
            <span>Volume Suara</span>
            <span className="font-mono-num text-amber-400">{Math.round(audioState.volume * 100)}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioState.muted ? 0 : audioState.volume}
            onChange={handleVolumeChange}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between gap-1 pt-1 border-t border-slate-800 text-[10px]">
            <button
              onClick={() => {
                audioManager.playJump();
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            >
              Tes Lompat
            </button>
            <button
              onClick={() => {
                audioManager.playCoin();
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
            >
              Tes Koin
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
