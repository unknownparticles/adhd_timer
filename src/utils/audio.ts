// Custom synthesized Web Audio effects to prevent loading external assets and support offline PWA usage.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function resumeAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    return ctx.resume();
  }
  return Promise.resolve();
}

// Automatically attempt to unlock AudioContext on first user interaction to bypass browser autoplay restrictions.
if (typeof window !== "undefined") {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume().then(() => {
          removeListeners();
        }).catch((err) => {
          console.warn("Failed to resume AudioContext:", err);
        });
      } else {
        removeListeners();
      }
    }
  };

  const removeListeners = () => {
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("click", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

/**
 * Synthesizes a subtle, mechanical clock "tick" or "tock"
 */
export function playTick(pitch: "tick" | "tock" = "tick", volumeMultiplier: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Fast decay for mechanical sound
  const freq = pitch === "tick" ? 1200 : 900;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  // Boosted base gain from 0.02 to 0.12
  gainNode.gain.setValueAtTime(0.12 * volumeMultiplier, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.04);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

/**
 * Synthesizes a beautiful 5-note pentatonic/uplifting music box melody (C5 -> E5 -> G5 -> A5 -> C6)
 */
export function playChime(volumeMultiplier: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const now = ctx.currentTime;
  // C5 (523.25), E5 (659.25), G5 (783.99), A5 (880.00), C6 (1046.50)
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.8 },
    { freq: 659.25, time: 0.16, dur: 0.8 },
    { freq: 783.99, time: 0.32, dur: 0.8 },
    { freq: 880.00, time: 0.48, dur: 0.8 },
    { freq: 1046.50, time: 0.64, dur: 1.5 }
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Use triangle wave for warmer, music-box-like sound
    osc.type = "triangle";
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Boosted baseline volume coefficients
    const maxGain = 0.28 * volumeMultiplier;
    gainNode.gain.setValueAtTime(0.00001, now + note.time);
    gainNode.gain.linearRampToValueAtTime(maxGain, now + note.time + 0.05);
    gainNode.gain.setValueAtTime(maxGain, now + note.time + note.dur - 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + note.time + note.dur);

    osc.start(now + note.time);
    osc.stop(now + note.time + note.dur + 0.1);
  });
}

/**
 * Synthesizes a clean triple-note ascending melody for mode changes (G5 -> B5 -> D6)
 */
export function playModeTrigger(volumeMultiplier: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 783.99, time: 0.0, dur: 0.25 },  // G5
    { freq: 987.77, time: 0.07, dur: 0.25 }, // B5
    { freq: 1174.66, time: 0.14, dur: 0.4 }  // D6
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Boosted baseline volume from 0.05 to 0.2
    const maxGain = 0.2 * volumeMultiplier;
    gainNode.gain.setValueAtTime(0.00001, now + note.time);
    gainNode.gain.linearRampToValueAtTime(maxGain, now + note.time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + note.time + note.dur);

    osc.start(now + note.time);
    osc.stop(now + note.time + note.dur + 0.05);
  });
}

/**
 * Synthesizes a simple double-note rising melody for starting the timer (C5 -> E5)
 */
export function playStartMelody(volumeMultiplier: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.22 }, // C5
    { freq: 659.25, time: 0.08, dur: 0.35 } // E5
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const maxGain = 0.2 * volumeMultiplier;
    gainNode.gain.setValueAtTime(0.00001, now + note.time);
    gainNode.gain.linearRampToValueAtTime(maxGain, now + note.time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + note.time + note.dur);

    osc.start(now + note.time);
    osc.stop(now + note.time + note.dur + 0.05);
  });
}

/**
 * Synthesizes a double-note descending melody for pausing the timer (E5 -> C5)
 */
export function playPauseBeep(volumeMultiplier: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 659.25, time: 0.0, dur: 0.22 }, // E5
    { freq: 523.25, time: 0.08, dur: 0.35 } // C5
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const maxGain = 0.18 * volumeMultiplier;
    gainNode.gain.setValueAtTime(0.00001, now + note.time);
    gainNode.gain.linearRampToValueAtTime(maxGain, now + note.time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + note.time + note.dur);

    osc.start(now + note.time);
    osc.stop(now + note.time + note.dur + 0.05);
  });
}

let lastCollisionSoundTime = 0;

/**
 * Synthesizes a subtle, organic "clack" or "click" sound of beads/particles colliding
 * @param intensity scale factor (0.0 to 1.0) based on impact velocity
 */
export function playCollisionSound(intensity: number = 0.5, volumeMultiplier: number = 0.8) {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const now = ctx.currentTime;
  // Throttle to maximum one collision sound per 40ms to avoid audio overload or harsh noise
  if (now - lastCollisionSoundTime < 0.04) return;
  lastCollisionSoundTime = now;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = "sine";
  
  // Randomize pitch slightly to make it sound organic and not repetitive
  const freq = 1000 + Math.random() * 500;
  osc.frequency.setValueAtTime(freq, now);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Boosted base gain from max 0.015 to 0.06
  const vol = Math.min(0.06, intensity * 0.05) * volumeMultiplier;
  gainNode.gain.setValueAtTime(vol, now);
  // Extremely fast decay
  gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.015);

  osc.start(now);
  osc.stop(now + 0.02);
}
