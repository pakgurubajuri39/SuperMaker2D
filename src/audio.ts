/**
 * Centralized Audio Manager for Retro Arcade Platformer
 * Implements Web Audio API synthesizers for jumping, coin collection,
 * enemy stomping, level completion, and reactive state management.
 */

export interface AudioState {
  muted: boolean;
  volume: number; // 0.0 to 1.0
}

type AudioListener = (state: AudioState) => void;

class CentralizedAudioManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.8;
  private listeners: Set<AudioListener> = new Set();
  private readonly STORAGE_KEY = 'super_maker_audio_state_v1';

  constructor() {
    this.loadSettings();
  }

  // Load preferences from localStorage
  private loadSettings() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.muted === 'boolean') this.muted = parsed.muted;
        if (typeof parsed.volume === 'number') this.volume = Math.max(0, Math.min(1, parsed.volume));
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({ muted: this.muted, volume: this.volume })
      );
    } catch {
      // Ignore
    }
  }

  // Safe AudioContext initialization with browser autoplay resume
  public initContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Subscribe to mute/volume changes for React UI updates
  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    // Initial emit
    listener({ muted: this.muted, volume: this.volume });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state: AudioState = { muted: this.muted, volume: this.volume };
    this.listeners.forEach((fn) => fn(state));
  }

  public get enabled(): boolean {
    return !this.muted;
  }

  public set enabled(val: boolean) {
    this.muted = !val;
    this.saveSettings();
    this.notifyListeners();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    this.saveSettings();
    this.notifyListeners();
    // Play a friendly confirmation blip if unmuted
    if (!this.muted) {
      this.playNodeStep();
    }
    return this.muted;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.volume === 0) {
      this.muted = true;
    } else if (this.muted) {
      this.muted = false;
    }
    this.saveSettings();
    this.notifyListeners();
  }

  public getVolume(): number {
    return this.volume;
  }

  private getEffectiveVolume(baseVol: number): number {
    if (this.muted) return 0;
    return baseVol * this.volume;
  }

  // --- 1. JUMP SOUND ---
  public playJump() {
    const vol = this.getEffectiveVolume(0.18);
    if (vol <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.14);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(0.005, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- 2. COIN COLLECTION SOUND ---
  public playCoin() {
    const vol = this.getEffectiveVolume(0.22);
    if (vol <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // --- 3. ENEMY STOMPING SOUND ---
  public playStomp() {
    const vol = this.getEffectiveVolume(0.26);
    if (vol <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.15);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(0.005, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- 4. LEVEL COMPLETION (VICTORY FANFARE) SOUND ---
  public playFanfare() {
    const vol = this.getEffectiveVolume(0.25);
    if (vol <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Iconic Mario-style victory arpeggio: C5 -> E5 -> G5 -> C6 followed by rich triad chord
    const melody = [
      { freq: 523.25, duration: 0.11, time: 0 },      // C5
      { freq: 659.25, duration: 0.11, time: 0.11 },   // E5
      { freq: 783.99, duration: 0.11, time: 0.22 },   // G5
      { freq: 1046.50, duration: 0.35, time: 0.33 },  // C6
      { freq: 880.00, duration: 0.12, time: 0.68 },   // A5
      { freq: 987.77, duration: 0.12, time: 0.80 },   // B5
      { freq: 1046.50, duration: 0.55, time: 0.92 }   // C6 held
    ];

    melody.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(vol, now + n.time);
      gain.gain.linearRampToValueAtTime(0.001, now + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.duration);
    });

    // Sub-harmony bass note for celebratory weight
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(261.63, now + 0.92); // C4
    bassGain.gain.setValueAtTime(vol * 0.7, now + 0.92);
    bassGain.gain.linearRampToValueAtTime(0.001, now + 1.47);
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    bass.start(now + 0.92);
    bass.stop(now + 1.47);
  }

  // Alias for level completion
  public playLevelComplete() {
    this.playFanfare();
  }

  // --- POLISH SOUNDS ---
  public playBlockHit() {
    const vol = this.getEffectiveVolume(0.24);
    if (vol <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(230, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playHurt() {
    const vol = this.getEffectiveVolume(0.28);
    if (vol <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.linearRampToValueAtTime(85, now + 0.35);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(0.005, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playNodeStep() {
    const vol = this.getEffectiveVolume(0.14);
    if (vol <= 0) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5

    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }
}

// Global Singleton Centralized Audio Manager
export const audioManager = new CentralizedAudioManager();
export const sound = audioManager; // Backward compatibility
