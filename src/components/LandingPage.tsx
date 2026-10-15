import React from 'react';
import { WorldData } from '../types';
import {
  Play,
  Edit3,
  Compass,
  Sparkles,
  Gamepad2,
  HelpCircle,
  Trophy,
  Layers,
  ChevronRight,
  ShieldAlert,
  Coins,
  Flag,
} from 'lucide-react';

interface LandingPageProps {
  world: WorldData;
  onStartAdventure: () => void;
  onOpenEditor: (levelId?: string) => void;
  onPlayStage: (levelId: string) => void;
  onOpenGuide: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  world,
  onStartAdventure,
  onOpenEditor,
  onPlayStage,
  onOpenGuide,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-8 py-4 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="w-full max-w-5xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
        {/* Subtle decorative retro grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#f59e0b 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            backgroundPosition: '0 0, 18px 18px',
          }}
        />

        {/* Mascot / Arcade Emblem */}
        <div className="w-20 h-20 rounded-2xl bg-amber-400 text-slate-950 font-arcade text-3xl flex items-center justify-center shadow-xl shadow-amber-400/20 mb-6 border-4 border-amber-300 animate-bounce">
          M
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-arcade leading-tight">
          SUPER MAKER 2D
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl font-medium">
          Platformer 2D &amp; Pembuat Level Mandiri. Bangun rintangan, rancang jalur Peta Dunia, dan mainkan langsung di komputer, tablet, maupun ponsel Anda!
        </p>

        {/* Primary Call-to-Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartAdventure}
            className="px-8 py-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-arcade text-sm font-bold rounded-2xl shadow-xl shadow-amber-400/25 transition-all flex items-center gap-3 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>MULAI PETUALANGAN</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenEditor()}
            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold text-sm rounded-2xl border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-amber-400" />
            <span>Buka Level Editor</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="px-5 py-4 bg-slate-800/60 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white font-medium text-sm rounded-2xl border border-slate-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>Petunjuk Bahasa Indonesia</span>
          </button>
        </div>

        {/* Feature Badges (clean unboxed text with dots) */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-mono-num">
          <span>Fisika AABB Realistis</span>
          <span aria-hidden="true">·</span>
          <span>Peta Dunia Interaktif</span>
          <span aria-hidden="true">·</span>
          <span>Dukungan Layar Sentuh HP &amp; Tablet</span>
          <span aria-hidden="true">·</span>
          <span>Audio Synthesizer Retro</span>
        </div>
      </div>

      {/* Petunjuk Game Lengkap (Bahasa Indonesia) */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col gap-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-arcade">PETUNJUK LENGKAP PERMAINAN</h2>
            <p className="text-xs text-slate-400">Panduan dasar bermain, kontrol karakter, dan cara membuat level sendiri</p>
          </div>
        </div>

        {/* Grid 3 Kolom Petunjuk */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kolom 1: Kontrol Permainan */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-arcade">
              <Gamepad2 className="w-4 h-4" />
              <span>1. KONTROL GERAK</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <li>
                <strong className="text-white">Berlari Kiri / Kanan:</strong> Tekan tombol <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">A</code> / <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">D</code> atau tombol panah keyboard. Di HP/Tablet, gunakan tombol panah virtual di pojok kiri bawah layar.
              </li>
              <li>
                <strong className="text-white">Melompat:</strong> Tekan <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">Spasi</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">W</code>, atau tombol panah atas. Tahan tombol lebih lama untuk lompatan yang lebih tinggi!
              </li>
              <li>
                <strong className="text-white">Ulang / Restart:</strong> Tekan tombol <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">R</code> untuk langsung respawn jika terjebak.
              </li>
              <li>
                <strong className="text-white">Keluar / Stop:</strong> Tekan tombol <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">Esc</code> untuk kembali ke editor.
              </li>
            </ul>
          </div>

          {/* Kolom 2: Mekanika & Tantangan */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm font-arcade">
              <Sparkles className="w-4 h-4" />
              <span>2. MEKANIKA GAME</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <li>
                <strong className="text-white">Menginjak Musuh:</strong> Saat meluncur turun dari lompatan, injak kepala Goomba untuk memusnahkannya (+200 poin) dan memantul ke udara! Jika menyentuh musuh dari samping, pemain akan kalah.
              </li>
              <li>
                <strong className="text-white">Blok Misteri [?]:</strong> Sundul balok dari bawah untuk memunculkan koin emas (+100 poin). Balok yang sudah disundul akan berubah menjadi balok padat.
              </li>
              <li>
                <strong className="text-white">Duri Bahaya:</strong> Waspadai jebakan duri merah tajam! Menyentuh duri akan langsung menggagalkan pemain.
              </li>
              <li>
                <strong className="text-white">Tiang Bendera:</strong> Sentuh tiang bendera di akhir stage untuk menyelesaikan level dan mencatat skor tertinggi!
              </li>
            </ul>
          </div>

          {/* Kolom 3: Pembuat Level & Peta Dunia */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-arcade">
              <Edit3 className="w-4 h-4" />
              <span>3. LEVEL MAKER</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <li>
                <strong className="text-white">Kanvas 80 Balok:</strong> Buat stage side-scroller horizontal hingga 80 balok dengan ketinggian 15 baris.
              </li>
              <li>
                <strong className="text-white">Pilihan Elemen (0-7):</strong> Tanah, Balok Tanya, Duri, Koin, Musuh, Tiang Bendera, dan Titik Awal.
              </li>
              <li>
                <strong className="text-white">Klik &amp; Gambar:</strong> Klik Kiri untuk menaruh balok, Klik Kanan untuk menghapus. Geser slider bawah untuk menjelajahi kanvas.
              </li>
              <li>
                <strong className="text-white">Uji Coba Langsung:</strong> Klik tombol <strong className="text-amber-400">PLAYTEST</strong> untuk langsung bermain dan menguji stage kreasi Anda!
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pilihan Level Siap Main (Quick Stage Select) */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-arcade">PILIH LEVEL LANGSUNG</h2>
              <p className="text-xs text-slate-400">Pilih salah satu dari 4 level resmi bawaan untuk langsung dimainkan</p>
            </div>
          </div>
          <button
            onClick={onStartAdventure}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Peta Dunia</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(world.levels).map((lvl, idx) => {
            const isCleared = world.nodes.some((n) => n.levelId === lvl.id && n.cleared);
            return (
              <div
                key={lvl.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all hover:scale-[1.02] group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-arcade text-[10px] text-amber-400">STAGE 0{idx + 1}</span>
                    {isCleared && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                        Tamat ⭐
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1.5 group-hover:text-amber-300 transition-colors">
                    {lvl.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 capitalize">
                    <span>Tema: {lvl.theme}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lvl.timeLimit}s</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onPlayStage(lvl.id)}
                    className="flex-1 py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-arcade"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>MAIN</span>
                  </button>
                  <button
                    onClick={() => onOpenEditor(lvl.id)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
                    title="Edit di Builder"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
